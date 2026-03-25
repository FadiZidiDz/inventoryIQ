<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\ProductDelivery;
use App\Models\Supplier;
use App\Models\AuditTrail;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Revenue grouped by month for the current year
     */
    public function revenue()
    {
        try {
            $data = ProductDelivery::where('delivery_status', 2)
                ->whereYear('created_at', now()->year)
                ->select(
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('SUM(subtotal) as total_revenue'),
                    DB::raw('COUNT(*) as total_orders')
                )
                ->groupBy(DB::raw('YEAR(created_at)'), DB::raw('MONTH(created_at)'))
                ->orderBy('month')
                ->get();

            if (auth()->check()) {
                AuditTrail::create([
                    'user_id'     => auth()->user()->id,
                    'action'      => 'view',
                    'description' => 'Viewed analytics – revenue data.',
                ]);
            }

            return response()->json(['revenue' => $data], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Top 10 best-selling products by quantity delivered
     */
    public function top_products()
    {
        try {
            $data = ProductDelivery::where('delivery_status', 2)
                ->join('products', 'product_delivery.product_id', '=', 'products.id')
                ->select(
                    'products.id',
                    'products.name',
                    'products.sku',
                    'products.stocks',
                    DB::raw('SUM(product_delivery.quantity) as total_sold'),
                    DB::raw('SUM(product_delivery.subtotal) as total_revenue')
                )
                ->groupBy('products.id', 'products.name', 'products.sku', 'products.stocks')
                ->orderBy('total_sold', 'desc')
                ->limit(10)
                ->get();

            return response()->json(['top_products' => $data], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Low stock products (stocks <= 50) with restock recommendation
     */
    public function low_stock()
    {
        try {
            $data = Product::with('category', 'suppliers')
                ->where('stocks', '<=', 50)
                ->orderBy('stocks', 'asc')
                ->get()
                ->map(function ($product) {
                    // Simple restock recommendation: target 100 units
                    $recommended_restock = max(0, 100 - $product->stocks);
                    return [
                        'id'                  => $product->id,
                        'name'                => $product->name,
                        'sku'                 => $product->sku,
                        'stocks'              => $product->stocks,
                        'price'               => $product->price,
                        'category'            => $product->category->name ?? 'N/A',
                        'status'              => $product->status,
                        'recommended_restock' => $recommended_restock,
                        'restock_cost'        => round($recommended_restock * $product->price, 2),
                    ];
                });

            return response()->json(['low_stock' => $data], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Overall inventory summary stats
     */
    public function summary()
    {
        try {
            $total_products  = Product::count();
            $total_value     = Product::selectRaw('SUM(stocks * price) as val')->value('val') ?? 0;
            $total_delivered = ProductDelivery::where('delivery_status', 2)->sum('subtotal');
            $total_orders    = ProductDelivery::where('delivery_status', 2)->count();
            $avg_order_value = $total_orders > 0 ? round($total_delivered / $total_orders, 2) : 0;

            // Stock by category (table name is 'category')
            $by_category = Product::join('category', 'products.category_id', '=', 'category.id')
                ->select(
                    'category.name as category',
                    DB::raw('SUM(products.stocks) as total_stock'),
                    DB::raw('COUNT(products.id) as product_count')
                )
                ->groupBy('category.id', 'category.name')
                ->orderBy('total_stock', 'desc')
                ->get();

            // Delivery status breakdown
            $delivery_breakdown = ProductDelivery::select(
                'delivery_status',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('delivery_status')
            ->get()
            ->mapWithKeys(function ($item) {
                $label = match ($item->delivery_status) {
                    0 => 'for_pickup',
                    1 => 'on_the_way',
                    2 => 'delivered',
                    default => 'unknown'
                };
                return [$label => $item->count];
            });

            return response()->json([
                'summary' => [
                    'total_products'  => $total_products,
                    'total_value'     => round($total_value, 2),
                    'total_revenue'   => round($total_delivered, 2),
                    'total_orders'    => $total_orders,
                    'avg_order_value' => $avg_order_value,
                ],
                'by_category'        => $by_category,
                'delivery_breakdown' => $delivery_breakdown,
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Items/contracts expiring soon (supplier contracts within 30 days)
     */
    public function near_expiry()
    {
        try {
            $today = Carbon::today();
            $in30Days = $today->copy()->addDays(30);

            $suppliers = Supplier::whereNotNull('contract_expiry_date')
                ->whereBetween('contract_expiry_date', [$today, $in30Days])
                ->orderBy('contract_expiry_date', 'asc')
                ->get(['id', 'name', 'contact_person', 'contract_expiry_date'])
                ->map(function ($s) use ($today) {
                    $expiry = $s->contract_expiry_date;
                    $daysLeft = (int) $expiry->diffInDays($today, false);
                    return [
                        'id'         => $s->id,
                        'name'       => $s->name,
                        'contact'    => $s->contact_person ?? '—',
                        'expiry_date'=> $expiry->format('Y-m-d'),
                        'days_left'  => $daysLeft,
                        'status'     => $daysLeft <= 0 ? 'expired' : ($daysLeft <= 7 ? 'soon' : 'warning'),
                    ];
                });

            return response()->json(['near_expiry' => $suppliers], 200);
        } catch (\Exception $e) {
            return response()->json(['near_expiry' => []], 200);
        }
    }
}
