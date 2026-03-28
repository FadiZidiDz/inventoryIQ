<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow optional image / category / warehouse for simplified product form.
     */
    public function up(): void
    {
        // STEP 1: Drop the old foreign key constraints first
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['warehouse_id']);
        });

        // STEP 2: Change the column types and nullability
        Schema::table('products', function (Blueprint $table) {
            $table->string('image', 255)->nullable()->change();
            
            // Using uuid() here is MANDATORY for PostgreSQL to match the parent 'id'
            $table->uuid('category_id')->nullable()->change();
            $table->uuid('warehouse_id')->nullable()->change();
        });

        // STEP 3: Re-add the foreign keys with the new 'on delete set null' behavior
        Schema::table('products', function (Blueprint $table) {
            $table->foreign('category_id')->references('id')->on('category')->nullOnDelete();
            $table->foreign('warehouse_id')->references('id')->on('warehouse')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['warehouse_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->string('image', 255)->nullable(false)->change();
            $table->uuid('category_id')->nullable(false)->change();
            $table->uuid('warehouse_id')->nullable(false)->change();

            $table->foreign('category_id')->references('id')->on('category');
            $table->foreign('warehouse_id')->references('id')->on('warehouse');
        });
    }
};
