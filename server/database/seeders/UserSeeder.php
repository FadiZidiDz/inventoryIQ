<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
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
        // Ensure initial admin user exists (idempotent)
        $admin = User::updateOrCreate(
            ['email' => 'test@test.com'],
            [
                'username' => 'admin',
                'password' => Hash::make('Test1234!'),
            ]
        );

        $role_admin = Role::where('role_name', 'Administrator')->first();
        if ($role_admin && !$admin->roles()->where('roles.id', $role_admin->id)->exists()) {
            $admin->roles()->attach($role_admin->id);
        }

        // Ensure a default staff user exists (idempotent)
        $staff = User::updateOrCreate(
            ['email' => 'staff1@test.com'],
            [
                'username' => 'staff1',
                'password' => Hash::make('Test1234!'),
            ]
        );

        $role_staff = Role::where('role_name', 'Staff')->first();
        if ($role_staff && !$staff->roles()->where('roles.id', $role_staff->id)->exists()) {
            $staff->roles()->attach($role_staff->id);
        }
    }
}
