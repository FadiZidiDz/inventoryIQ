<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // ── CRITICAL: must always run first ───────────────────────────────
            RoleSeeder::class,           // roles needed by UserSeeder + NavigationSeeder
            UserSeeder::class,           // admin login (idempotent via updateOrCreate)
            NavigationSeeder::class,     // sidebar (idempotent via firstOrCreate + syncWithoutDetaching)
            SubNavigationSeeder::class,  // sub-menu items
            CategorySeeder::class,       // product categories (idempotent)

            // ── NON-CRITICAL: these may throw on re-seed but that's fine ──────
            PrimaryIdSeeder::class,      // ID templates (unique constraint — may fail on re-seed)
            SecondaryIdSeeder::class,    // ID templates (unique constraint — may fail on re-seed)
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
