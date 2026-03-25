<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditTrail;
use App\Models\SubNavigation;
use App\Models\Navigation;
use Illuminate\Support\Facades\Cache;

class SubNavigationController extends Controller
{
    public function get_profile_sub_navigations($role_id, $user_id) {
        $cacheKey = 'profile_subNavigations_v2_simple_' . $role_id . '_' . $user_id;
        $cacheTags = [$role_id . '_' . $user_id];
        $minutes = 180;

        # remember the navigations using cache for fast initial retrieval
        $sub_navigations = Cache::remember($cacheKey, $minutes, function () use ($role_id) {
            # If the data is not in the cache, retrieve it from the database
            return SubNavigation::whereHas('roles', function ($query) use ($role_id) {
                # Attempt to retrieve the data from the cache
                $profile = Navigation::where('navigation_url', 'profile')->first();
                $query->where('role_id', $role_id)->where('parent_navigation_id', $profile->id);
            })->get();
        });

        # track view profile sub navigations
        if (auth()->check()) {
            AuditTrail::create([
                'user_id' => auth()->user()->id,
                'action' => 'view',
                'description' => 'Viewed all profile subnavigations.'
            ]);
        }

        return response()->json([ 'sub_navigations' => $sub_navigations ]);
    }

    public function get_productDelivery_sub_navigations($role_id, $user_id) {
        $cacheKey = 'prodDelivery_subNavigations_v2_simple_' . $role_id . '_' . $user_id;
        $cacheTags = [$role_id . '_' . $user_id];
        $minutes = 180;

        # remember the navigations using cache for fast initial retrieval
        // Logistics removed in simplified app
        $sub_navigations = collect([]);

        # track view product delivery sub navigations
        if (auth()->check()) {
            AuditTrail::create([
                'user_id' => auth()->user()->id,
                'action' => 'view',
                'description' => 'Viewed all product delivery subnavigations.'
            ]);
        }

        return response()->json([ 'sub_navigations' => $sub_navigations ]);
    }

    public function get_inventoryControl_sub_navigations($role_id, $user_id) {
        $cacheKey = 'inventoryControl_subNavigations_v2_simple_' . $role_id . '_' . $user_id;
        $cacheTags = [$role_id . '_' . $user_id];
        $minutes = 180;

        # remember the navigations using cache for fast initial retrieval
        $sub_navigations = Cache::remember($cacheKey, $minutes, function () use ($role_id) {
            # If the data is not in the cache, retrieve it from the database
            $products = Navigation::where('navigation_url', 'inventory')->first();
            if (!$products) {
                return collect([]);
            }

            return SubNavigation::where('sub_navigation_url', 'products-list')
                ->whereHas('roles', function ($query) use ($role_id, $products) {
                    $query->where('role_id', $role_id)
                        ->where('parent_navigation_id', $products->id);
                })
                ->get();
        });

        # track view inventory control sub navigations
        if (auth()->check()) {
            AuditTrail::create([
                'user_id' => auth()->user()->id,
                'action' => 'view',
                'description' => 'Viewed all inventory control subnavigations.'
            ]);
        }

        return response()->json([ 'sub_navigations' => $sub_navigations ]);
    }
}
