<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow optional image / category / warehouse for simplified product form.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['warehouse_id']);
        });

        DB::statement('ALTER TABLE products MODIFY image VARCHAR(255) NULL');
        DB::statement('ALTER TABLE products MODIFY category_id CHAR(36) NULL');
        DB::statement('ALTER TABLE products MODIFY warehouse_id CHAR(36) NULL');

        Schema::table('products', function (Blueprint $table) {
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

        DB::statement('ALTER TABLE products MODIFY image VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE products MODIFY category_id CHAR(36) NOT NULL');
        DB::statement('ALTER TABLE products MODIFY warehouse_id CHAR(36) NOT NULL');

        Schema::table('products', function (Blueprint $table) {
            $table->foreign('category_id')->references('id')->on('category');
            $table->foreign('warehouse_id')->references('id')->on('warehouse');
        });
    }
};
