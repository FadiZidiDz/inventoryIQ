<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Update products table for PostgreSQL compatibility.
     * Makes image, category, and warehouse optional.
     */
    public function up(): void
    {
        // 1. Drop Foreign Keys first (Postgres is strict about this)
        Schema::table('products', function (Blueprint $table) {
            // We use an array to tell Laravel to find the constraint name automatically
            $table->dropForeign(['category_id']);
            $table->dropForeign(['warehouse_id']);
        });

        // 2. Modify columns to be NULLABLE
        Schema::table('products', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
            
            // Ensure these match the parent table ID types (usually UUIDs in your app)
            $table->uuid('category_id')->nullable()->change();
            $table->uuid('warehouse_id')->nullable()->change();
            
            // Ensure price and stocks are ready (adding them if they don't exist, otherwise change)
            $table->decimal('price', 15, 2)->default(0)->change();
            $table->integer('stocks')->default(0)->change();
        });

        // 3. Re-add Foreign Keys with nullOnDelete
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
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['warehouse_id']);
            
            $table->string('image')->nullable(false)->change();
            $table->uuid('category_id')->nullable(false)->change();
            $table->uuid('warehouse_id')->nullable(false)->change();

            $table->foreign('category_id')->references('id')->on('category');
            $table->foreign('warehouse_id')->references('id')->on('warehouse');
        });
    }
};
