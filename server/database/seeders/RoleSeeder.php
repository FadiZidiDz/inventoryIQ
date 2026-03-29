<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roleNames = ['Administrator', 'Staff Manager', 'Staff', 'Developer'];

        foreach ($roleNames as $roleName) {
            // withTrashed() finds soft-deleted rows too — prevents unique constraint crash
            $existing = Role::withTrashed()->where('role_name', $roleName)->first();

            if (!$existing) {
                Role::create(['role_name' => $roleName]);
            } elseif ($existing->trashed()) {
                $existing->restore();
            }
        }

        $this->command->info('RoleSeeder: done.');
    }
}
