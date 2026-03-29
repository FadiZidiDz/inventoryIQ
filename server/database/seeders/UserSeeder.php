<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure the Roles exist first (important for empty databases)
        $role_admin = Role::firstOrCreate(['role_name' => 'Administrator']);
        $role_staff = Role::firstOrCreate(['role_name' => 'Staff']);

        // 2. Ensure initial admin user exists
        $admin = User::updateOrCreate(
            ['email' => 'test@test.com'],
            [
                'username' => 'admin',
                'password' => Hash::make('Test1234!'),
            ]
        );

        // 3. Attach Administrator Role if not already attached
        if (!$admin->roles()->where('roles.id', $role_admin->id)->exists()) {
            $admin->roles()->attach($role_admin->id);
        }

        // 4. Ensure a default staff user exists
        $staff = User::updateOrCreate(
            ['email' => 'staff1@test.com'],
            [
                'username' => 'staff1',
                'password' => Hash::make('Test1234!'),
            ]
        );

        // 5. Attach Staff Role if not already attached
        if (!$staff->roles()->where('roles.id', $role_staff->id)->exists()) {
            $staff->roles()->attach($role_staff->id);
        }
    }
}
