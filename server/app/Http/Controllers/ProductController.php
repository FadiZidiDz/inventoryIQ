<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\AuditTrail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ProductController extends Controller
{
    public function add_product(Request $request) {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'price' => 'required|numeric|min:0',
                'stocks' => 'required|integer|min:0',
                'image' => 'nullable|mimes:jpeg,jpg,png,gif,webp|max:5120',
            ]);
        } catch (ValidationException $e) {
            $message = $e->validator->errors()->first();
            return response()->json([ 'message' => $message, 'errors' => $e->errors() ], 422);
        }

        $filepath = null;
        if ($request->hasFile('image')) {
            $filepath = $request->file('image')->store('public/products');
        }

        $uuid = (string) \Illuminate\Support\Str::uuid();
        $stocks = (int) $request->stocks;

        $product_data = [
            'image' => $filepath,
            'name' => $request->name,
            'sku' => $uuid,
            'barcode' => 'BC-' . str_replace('-', '', substr($uuid, 0, 13)),
            'price' => (float) $request->price,
            'stocks' => $stocks,
            'weight' => '',
            'dimensions' => '',
            'description' => '',
            'is_variant' => false,
            'parent_product_id' => null,
            'has_serial' => 0,
            'serial_number' => null,
            'category_id' => null,
            'warehouse_id' => null,
            'warranty_info' => null,
            'status' => $stocks <= 0 ? 0 : ($stocks <= 20 ? 2 : 1),
        ];

        DB::beginTransaction();
        try {
            $product = Product::create($product_data);

            AuditTrail::create([
                'user_id' => auth()->user()->id,
                'action' => 'create',
                'description' => 'Created product ID: ' . $product->id
            ]);

            DB::commit();
            return response()->json([ 'message' => 'Product added successfully.' ], 200);
        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Product add failed: ' . $e->getMessage(), [ 'trace' => $e->getTraceAsString() ]);
            return response()->json([
                'message' => 'Oops, something went wrong. Please try again later.',
                'error_message' => $e->getMessage()
            ], 500);
        }
    }

    public function get_products_infos() {
        $products = Product::with('category', 'suppliers', 'warehouse')
        ->orderBy('created_at', 'desc')
        ->get();

        # track product view
        AuditTrail::create([
            'user_id' => auth()->user()->id,
            'action' => 'view',
            'description' => 'Viewed all products.'
        ]);

        return response()->json([ 'product_supplier' => $products ]);
    }

    public function get_products() {
        $products = Product::where('status', 1)
        ->orderBy('created_at', 'desc')
        ->get();

        # track product view
        AuditTrail::create([
            'user_id' => auth()->user()->id,
            'action' => 'view',
            'description' => 'Viewed all products.'
        ]);

        return response()->json([ 'products' => $products ]);
    }

    public function get_product($product_id) {
        $product = Product::with('category', 'suppliers')
        ->where('id', $product_id)
        ->first();

        if (!$product) {
            return response()->json([ 'error' => 'Product not found.' ], 404);
        }

        # track product view
        AuditTrail::create([
            'user_id' => auth()->user()->id,
            'action' => 'view',
            'description' => 'Viewed product ID: ' . $product->id
        ]);

        return response()->json([ 'product_info' => $product ]);
    }

    public function get_parent_products() {
        $parent_products = Product::where('parent_product_id', null)
        ->get();
        
        return response()->json([ 'parent_products' => $parent_products ], 200);
    }

    public function get_parent_products_exclude_self($product_id) {
        $parent_products = Product::where('parent_product_id', null)
        ->where('id', '!=', $product_id)
        ->get();

        return response()->json([ 'parent_products' => $parent_products ], 200);
    }

    public function update_product($product_id, Request $request) {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'price' => 'required|numeric|min:0',
                'stocks' => 'required|integer|min:0',
                'image' => 'nullable|mimes:jpeg,jpg,png,gif,webp|max:5120',
            ]);
        } catch (ValidationException $e) {
            return response()->json([ 'message' => $e->validator->errors()->first(), 'errors' => $e->errors() ], 422);
        }

        DB::beginTransaction();
        try {
            $product = Product::findOrFail($product_id);

            $stocks = (int) $request->stocks;
            $product->name = $request->name;
            $product->price = (float) $request->price;
            $product->stocks = $stocks;
            $product->status = $stocks <= 0 ? 0 : ($stocks <= 20 ? 2 : 1);

            if ($request->hasFile('image')) {
                $product->image = $request->file('image')->store('public/products');
            }

            AuditTrail::create([
                'user_id' => auth()->user()->id,
                'action' => 'update',
                'description' => 'Updated product ID: ' . $product->id
            ]);

            $product->save();
            DB::commit();
            return response()->json([ 'message' => 'Product updated successfully.' ]);
        } catch (ModelNotFoundException $e) {
            DB::rollback();
            return response()->json([ 'error_message' => $e->getMessage() ], 404);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([ 'error_message' => $e->getMessage() ], 500);
        }
    }

    public function remove_product($product_id) {
        DB::beginTransaction();
        try {
            $product = Product::findOrFail($product_id);

            # track product removal
            AuditTrail::create([
                'user_id' => auth()->user()->id,
                'action' => 'remove',
                'description' => 'Removed product ID: ' . $product->id
            ]);

            $product->delete();
            DB::commit();
            return response()->json([ 'message' => 'Inventory item has been removed.' ]);
        } catch (ModelNotFoundException $e) {
            DB::rollback();
            return response()->json([ 'error_message' => $e->getMessage() ]);
        }
    }

    public function get_product_price($product_id) {
        try {
            $product = Product::where('id', $product_id)
            ->where('status', 1)
            ->firstOrFail();

            return response()->json([ 'price' => $product->price ], 200);
        } catch (\Exception $e) {
            return response()->json([ 'error' => $e->getMessage(), 'message' => 'Oops, something went wrong, try again later.' ]);
        }
    }

    public function update_quantity($product_id, Request $request) {
        $request->validate([
            'stocks' => 'required|integer|min:0'
        ], [
            'stocks.required' => 'Quantity is required.',
            'stocks.integer'  => 'Quantity must be a whole number.',
            'stocks.min'      => 'Quantity cannot be negative.',
        ]);

        DB::beginTransaction();
        try {
            $product = Product::findOrFail($product_id);

            $old_stocks     = $product->stocks;
            $product->stocks = (int) $request->stocks;

            // Recalculate status based on new stock level
            $product->status = $product->stocks <= 0
                ? 0
                : ($product->stocks <= 20
                    ? 2
                    : ($product->stocks >= 100 ? 1 : 2));

            $product->save();

            AuditTrail::create([
                'user_id'     => auth()->user()->id,
                'action'      => 'update',
                'description' => "Updated product quantity. Product ID: {$product->id}. Old: {$old_stocks}, New: {$product->stocks}",
            ]);

            DB::commit();
            return response()->json([
                'message' => 'Product quantity updated successfully!',
                'stocks'  => $product->stocks,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollback();
            return response()->json(['error_message' => 'Product not found.'], 404);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error_message' => $e->getMessage()], 500);
        }
    }

    public function download_image($product_id) {
        $product = Product::where('id', $product_id)->first();

        if (!$product || empty($product->image)) {
            return response()->json(['message' => 'No image available for this product.'], 404);
        }

        $path = $product->image;
        $sanitized_path = trim($path);
        $ext = pathinfo($sanitized_path, PATHINFO_EXTENSION);

        # track product image download
        AuditTrail::create([
            'user_id' => auth()->user()->id ?? null,
            'action' => 'download',
            'description' => 'Downloaded product image. ID: ' . $product->id
        ]);

        $file_path = storage_path("app/".$sanitized_path);
        $file_name = $product_id.'_Product Image.'.$ext;

        return response()->download($file_path, $file_name);
    }
}
