<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Navigation;
use App\Models\AuditTrail;
use Illuminate\Support\Facades\Cache;

class NavigationController extends Controller
{
    // Only these 5 items show in the sidebar.
    // Add/remove URLs here to control the menu without touching the DB.
    private const ALLOWED_NAV = [
        'dashboard',    // Dashboard
        'inventory',    // Inventory
        'users',        // Members
        'profile',      // Profile
        'audit-trails', // System Logs
    ];

    public function get_navigations($role_id, $user_id) {
        $cacheKey = 'navigations_v4_' . $role_id . '_' . $user_id;
        $minutes = 180;

        $navigations = Cache::remember($cacheKey, $minutes, function () use ($role_id) {
            return Navigation::whereHas('roles', function ($query) use ($role_id) {
                    $query->where('role_id', $role_id);
                })
                ->whereIn('navigation_url', self::ALLOWED_NAV)
                ->orderBy('order')
                ->get();
        });

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
