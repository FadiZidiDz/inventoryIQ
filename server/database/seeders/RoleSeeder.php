<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roleNames = ['Administrator', 'Staff Manager', 'Staff', 'Developer'];

        foreach ($roleNames as $roleName) {
            // withTrashed() ensures we find soft-deleted records too,
            // preventing unique constraint violations on re-seed.
            $existing = Role::withTrashed()->where('role_name', $roleName)->first();

            if (!$existing) {
                Role::create(['role_name' => $roleName]);
            } elseif ($existing->trashed()) {
                $existing->restore();
            }
            // else: already exists and active — nothing to do
        }

        $this->command->info('RoleSeeder: done.');
    }
}
