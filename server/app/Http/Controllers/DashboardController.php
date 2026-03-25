<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\AuditTrail;

class DashboardController extends Controller
{
    public function stats()
    {
        try {
            $total_products = Product::count();
            $out_of_stock = Product::where('stocks', '<=', 0)->count();
            $low_stock = Product::whereBetween('stocks', [1, 20])->count();
            $total_stock_units = (int) Product::sum('stocks');

            if (auth()->check()) {
                AuditTrail::create([
                    'user_id' => auth()->user()->id,
                    'action' => 'view',
                    'description' => 'Viewed dashboard stats.',
                ]);
            }

            return response()->json([
                'kpis' => [
                    'total_products' => $total_products,
                    'out_of_stock' => $out_of_stock,
                    'low_stock' => $low_stock,
                    'total_stock_units' => $total_stock_units,
                ],
                'recent_deliveries' => [],
                'low_stock_products' => Product::where('stocks', '<=', 20)
                    ->orderBy('stocks', 'asc')
                    ->limit(10)
                    ->get(['id', 'name', 'stocks', 'price']),
                'monthly_revenue' => [],
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Export current stock list as CSV (attachment).
     */
    public function export_csv()
    {
        try {
            $products = Product::orderBy('name')->get();

            $filename = 'inventory_stock_' . now()->format('Y-m-d_His') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'no-store, no-cache',
            ];

            $callback = function () use ($products) {
                $file = fopen('php://output', 'w');
                fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
                fputcsv($file, ['id', 'name', 'price', 'stocks']);

                foreach ($products as $product) {
                    fputcsv($file, [
                        $product->id,
                        $product->name,
                        $product->price,
                        $product->stocks,
                    ]);
                }
                fclose($file);
            };

            if (auth()->check()) {
                AuditTrail::create([
                    'user_id' => auth()->user()->id,
                    'action' => 'download',
                    'description' => 'Downloaded inventory CSV export.',
                ]);
            }

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
