<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Batches;
use App\Models\ProductDelivery;
use App\Models\AuditTrail;
use Illuminate\Support\Facades\DB;

class BatchesController extends Controller
{
    /**
     * Get paginated list of batches with item summaries
     */
    public function index(Request $request)
    {
        try {
            $page    = $request->query('page', 1);
            $perPage = $request->query('per_page', 10);
            $search  = $request->query('search', '');

            $query = Batches::withCount('product_delivery as total_items')
                ->withSum(['product_delivery' => function ($q) {
                    $q->where('delivery_status', 2);
                }], 'subtotal')
                ->withSum('product_delivery', 'quantity')
                ->with(['product_delivery' => function ($q) {
                    $q->select('batch_id', 'delivery_status',
                        DB::raw('COUNT(*) as count'))
                        ->groupBy('batch_id', 'delivery_status');
                }]);

            if ($search) {
                $query->where('batch_num', 'like', "%{$search}%");
            }

            $batches = $query->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            // Enrich each batch with status breakdown
            $batches->getCollection()->transform(function ($batch) {
                $statusCounts = ProductDelivery::where('batch_id', $batch->id)
                    ->select('delivery_status', DB::raw('COUNT(*) as count'))
                    ->groupBy('delivery_status')
                    ->pluck('count', 'delivery_status')
                    ->toArray();

                $batch->status_breakdown = [
                    'for_pickup'  => $statusCounts[0] ?? 0,
                    'on_the_way'  => $statusCounts[1] ?? 0,
                    'delivered'   => $statusCounts[2] ?? 0,
                ];

                $totalItems  = array_sum($statusCounts);
                $delivered   = $statusCounts[2] ?? 0;

                $batch->overall_status = match (true) {
                    $totalItems === 0             => 'empty',
                    $delivered === $totalItems    => 'completed',
                    ($statusCounts[1] ?? 0) > 0  => 'in_transit',
                    default                       => 'pending',
                };

                return $batch;
            });

            if (auth()->check()) {
                AuditTrail::create([
                    'user_id'     => auth()->user()->id,
                    'action'      => 'view',
                    'description' => 'Viewed all batches.',
                ]);
            }

            return response()->json($batches, 200);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get a single batch with all its delivery items
     */
    public function show($batch_id)
    {
        try {
            $batch = Batches::with([
                'product_delivery',
                'product_delivery.products',
                'product_delivery.customers',
                'product_delivery.delivery_persons',
            ])->findOrFail($batch_id);

            $totals = [
                'total_items'   => $batch->product_delivery->count(),
                'total_revenue' => $batch->product_delivery->where('delivery_status', 2)->sum('subtotal'),
                'total_qty'     => $batch->product_delivery->sum('quantity'),
            ];

            if (auth()->check()) {
                AuditTrail::create([
                    'user_id'     => auth()->user()->id,
                    'action'      => 'view',
                    'description' => 'Viewed batch details. Batch ID: ' . $batch_id,
                ]);
            }

            return response()->json([
                'batch'  => $batch,
                'totals' => $totals,
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
