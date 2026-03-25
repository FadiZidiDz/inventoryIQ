<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Navigation;
use App\Models\AuditTrail;
use Illuminate\Support\Facades\Cache;

class NavigationController extends Controller
{
    public function get_navigations($role_id, $user_id) {
        $cacheKey = 'navigations_v2_simple_' . $role_id . '_' . $user_id;
        $cacheTags = [$role_id . '_' . $user_id];
        $minutes = 180;
    
        // Attempt to retrieve the data from the cache
        $allowedUrls = ['dashboard', 'inventory', 'users', 'profile', 'audit-trails'];
        $orderMap = array_flip($allowedUrls);

        $navigations = Cache::remember($cacheKey, $minutes, function () use ($role_id, $allowedUrls, $orderMap) {
            return Navigation::whereIn('navigation_url', $allowedUrls)
                ->whereHas('roles', function ($query) use ($role_id) {
                    $query->where('role_id', $role_id);
                })
                ->get()
                ->sortBy(function ($nav) use ($orderMap) {
                    return $orderMap[$nav->navigation_url] ?? 99;
                })
                ->values();
        });

        # track navigation view
        if (auth()->check()) {
            AuditTrail::create([
                'user_id' => auth()->user()->id,
                'action' => 'view',
                'description' => 'Viewed all navigation.'
            ]);
        }

        return response()->json(['navigations' => $navigations]);
    }
}
