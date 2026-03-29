<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow optional image / category / warehouse for simplified product form.
     *
     * FIX: The original migration used MySQL `MODIFY` syntax which fails on
     * PostgreSQL (used on Render). This version uses PostgreSQL-compatible
     * `ALTER COLUMN ... DROP NOT NULL` syntax and is safe to run on both.
     */
    public function up(): void
    {
        // ── Step 1: Drop existing foreign key constraints (safe IF EXISTS) ───
        DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_foreign');
        DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_warehouse_id_foreign');

        // ── Step 2: Make columns nullable (PostgreSQL syntax) ─────────────────
        // MySQL uses:  ALTER TABLE ... MODIFY col TYPE NULL
        // PostgreSQL:  ALTER TABLE ... ALTER COLUMN col DROP NOT NULL
        DB::statement('ALTER TABLE products ALTER COLUMN image DROP NOT NULL');
        DB::statement('ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL');
        DB::statement('ALTER TABLE products ALTER COLUMN warehouse_id DROP NOT NULL');

        // ── Step 3: Re-add foreign keys with nullOnDelete behaviour ───────────
        Schema::table('products', function (Blueprint $table) {
            $table->foreign('category_id')
                  ->references('id')->on('category')
                  ->nullOnDelete();

            $table->foreign('warehouse_id')
                  ->references('id')->on('warehouse')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Drop the nullOnDelete FKs
        DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_foreign');
        DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_warehouse_id_foreign');

        // Restore NOT NULL
        DB::statement('ALTER TABLE products ALTER COLUMN image SET NOT NULL');
        DB::statement('ALTER TABLE products ALTER COLUMN category_id SET NOT NULL');
        DB::statement('ALTER TABLE products ALTER COLUMN warehouse_id SET NOT NULL');

        // Re-add strict foreign keys
        Schema::table('products', function (Blueprint $table) {
            $table->foreign('category_id')->references('id')->on('category');
            $table->foreign('warehouse_id')->references('id')->on('warehouse');
        });
    }
};
