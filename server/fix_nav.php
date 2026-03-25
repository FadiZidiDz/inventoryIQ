<?php

// Bootstrap Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Role;
use App\Models\Navigation;
use Illuminate\Support\Str;

// Get all roles
$roles = Role::all();
echo "Roles found: " . $roles->count() . "\n";
foreach ($roles as $r) {
    echo "  - " . $r->id . " : " . $r->role_name . "\n";
}

// Get user
$user = User::where('email', 'test@test.com')->with('roles')->first();
if (!$user) {
    die("User not found!\n");
}
echo "User role: " . ($user->roles->first()->role_name ?? 'none') . "\n";

// Find admin role (first one if no specific name found)
$adminRole = Role::where('role_name', 'Administrator')->first()
    ?? Role::where('role_name', 'Boss')->first()
    ?? Role::where('role_name', 'Staff Manager')->first()
    ?? $roles->first();

if (!$adminRole) {
    // Create admin role if none exist
    $adminRole = Role::create(['id' => Str::uuid(), 'role_name' => 'Administrator']);
    echo "Created Administrator role\n";
}

echo "Using role: " . $adminRole->role_name . " (" . $adminRole->id . ")\n";

// Change user to admin role
$user->roles()->detach();
$user->roles()->attach($adminRole->id);
echo "Changed test@test.com to role: " . $adminRole->role_name . "\n";

// Get all navigations
$navs = Navigation::all();
echo "Navigations found: " . $navs->count() . "\n";
foreach ($navs as $nav) {
    echo "  - " . $nav->navigation_url . " : " . $nav->navigation_name . "\n";
    // Check if this nav already has the role
    $exists = \DB::table('navigation_role')
        ->where('navigation_id', $nav->id)
        ->where('role_id', $adminRole->id)
        ->exists();
    
    if (!$exists) {
        \DB::table('navigation_role')->insert([
            'navigation_id' => $nav->id,
            'role_id' => $adminRole->id,
            'create' => 1,
            'read' => 1,
            'update' => 1,
            'delete' => 1,
            'download' => 1,
            'upload' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "    -> Linked to role " . $adminRole->role_name . "\n";
    } else {
        echo "    -> Already linked\n";
    }
}

echo "Done!\n";
