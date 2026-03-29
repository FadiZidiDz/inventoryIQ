<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Navigation;
use App\Models\Role;

class NavigationSeeder extends Seeder
{
    public function run(): void
    {
        // ── Step 1: Upsert nav items keyed by navigation_url (stable, unique) ──────
        $navItems = [
            ['navigation_name' => 'Dashboard',      'navigation_url' => 'dashboard',      'navigation_icon' => 'DashboardOutlined',    'order' => 1],
            ['navigation_name' => 'Inventory',       'navigation_url' => 'inventory',      'navigation_icon' => 'LayersOutlined',        'order' => 2],
            ['navigation_name' => 'Logistics',       'navigation_url' => 'delivery',       'navigation_icon' => 'LocalShippingOutlined', 'order' => 3],
            ['navigation_name' => 'Sales Leads',     'navigation_url' => 'leads',          'navigation_icon' => 'Diversity3Outlined',    'order' => 4],
            ['navigation_name' => 'Members',         'navigation_url' => 'users',          'navigation_icon' => 'Groups2Outlined',       'order' => 5],
            ['navigation_name' => 'Profile',         'navigation_url' => 'profile',        'navigation_icon' => 'Person2Outlined',       'order' => 6],
            ['navigation_name' => 'Analytics',       'navigation_url' => 'reports',        'navigation_icon' => 'AnalyticsOutlined',     'order' => 7],
            ['navigation_name' => 'System Logs',     'navigation_url' => 'audit-trails',   'navigation_icon' => 'DevicesOutlined',       'order' => 8],
            ['navigation_name' => 'System Settings', 'navigation_url' => 'configurations', 'navigation_icon' => 'SettingsOutlined',      'order' => 9],
        ];

        foreach ($navItems as $item) {
            // firstOrCreate: finds by navigation_url, inserts only if absent — 100% safe on re-run
            Navigation::firstOrCreate(
                ['navigation_url' => $item['navigation_url']],
                array_merge($item, ['status' => 1])
            );
        }

        // ── Step 2: Assign role-navigation permissions ────────────────────────────
        $admin        = Role::where('role_name', 'Administrator')->first();
        $staffManager = Role::where('role_name', 'Staff Manager')->first();
        $staff        = Role::where('role_name', 'Staff')->first();
        $developer    = Role::where('role_name', 'Developer')->first();

        if (!$admin || !$staffManager || !$staff || !$developer) {
            $this->command->error('NavigationSeeder: one or more roles missing — aborting permission assignment.');
            return;
        }

        $allNavs = Navigation::all()->keyBy('navigation_url');

        // Admin + Developer: full access to all navigations
        foreach ($allNavs as $nav) {
            // syncWithoutDetaching: adds if missing, skips if already attached — no duplicates
            $nav->roles()->syncWithoutDetaching([
                $admin->id     => ['create' => 1, 'read' => 1, 'update' => 1, 'delete' => 1, 'download' => 1, 'upload' => 1],
                $developer->id => ['create' => 1, 'read' => 1, 'update' => 1, 'delete' => 0, 'download' => 1, 'upload' => 1],
            ]);
        }

        // Staff Manager: dashboard, inventory, delivery, profile, reports
        $staffManagerNavs = ['dashboard', 'inventory', 'delivery', 'profile', 'reports'];
        foreach ($staffManagerNavs as $url) {
            if (isset($allNavs[$url])) {
                $allNavs[$url]->roles()->syncWithoutDetaching([
                    $staffManager->id => ['create' => 1, 'read' => 1, 'update' => 1, 'delete' => 0, 'download' => 1, 'upload' => 0],
                ]);
            }
        }

        // Staff: inventory (read-only) + profile
        $staffNavs = ['inventory', 'profile'];
        foreach ($staffNavs as $url) {
            if (isset($allNavs[$url])) {
                $allNavs[$url]->roles()->syncWithoutDetaching([
                    $staff->id => ['create' => 0, 'read' => 1, 'update' => 0, 'delete' => 0, 'download' => 1, 'upload' => 0],
                ]);
            }
        }

        $this->command->info('NavigationSeeder: done.');
    }
}
