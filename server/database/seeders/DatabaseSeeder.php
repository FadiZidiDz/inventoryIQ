<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // CRITICAL: must always succeed first
            RoleSeeder::class,
            UserSeeder::class,
            NavigationSeeder::class,
            SubNavigationSeeder::class,
            CategorySeeder::class,

            // Non-critical: may fail on re-seed (duplicate data) — that's OK
            PrimaryIdSeeder::class,
            SecondaryIdSeeder::class,
            EquipmentSeeder::class,
            WarehouseTypeSeeder::class,
            CustomerTypeSeeder::class,
            IndustryTypeSeeder::class,
            LeadSourceSeeder::class,
            LeadTitleSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
