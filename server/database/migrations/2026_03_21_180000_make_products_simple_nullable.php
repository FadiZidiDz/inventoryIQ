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
        Schema::table('products', function (Blueprint $table) {
            // Drop foreign keys first to allow type/nullability changes
            $table->dropForeign(['category_id']);
            $table->dropForeign(['warehouse_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            // Use Laravel's change() method. It works for both MySQL and Postgres.
            $table->string('image', 255)->nullable()->change();
            $table->char('category_id', 36)->nullable()->change();
            $table->char('warehouse_id', 36)->nullable()->change();

            // Re-add foreign keys with nullable behavior
            $table->foreign('category_id')->references('id')->on('category')->nullOnDelete();
            $table->foreign('warehouse_id')->references('id')->on('warehouse')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['warehouse_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            // Revert to NOT NULL
            $table->string('image', 255)->nullable(false)->change();
            $table->char('category_id', 36)->nullable(false)->change();
            $table->char('warehouse_id', 36)->nullable(false)->change();

            $table->foreign('category_id')->references('id')->on('category');
            $table->foreign('warehouse_id')->references('id')->on('warehouse');
        });
    }
};
