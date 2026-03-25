<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Str;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Goods',
                'slug' => 'goods',
                'description' => 'Items or merchandise available for sale or distribution, encompassing a wide range of consumer goods such as foods and drinks.',
            ],
            [
                'name' => 'Stationary',
                'slug' => 'stationary',
                'description' => 'Stationery refers to a category of office and personal supplies that are used for writing, drawing, organizing, and other administrative tasks. It typically includes items such as pens, pencils, paper, notebooks, folders, and other related accessories.',
            ],
        ];

        foreach ($categories as $category) {
            $existing = DB::table('category')
                ->where('name', $category['name'])
                ->first();

            if ($existing) {
                DB::table('category')
                    ->where('id', $existing->id)
                    ->update([
                        'slug' => $category['slug'],
                        'description' => $category['description'],
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('category')->insert([
                    'id' => Str::uuid(),
                    'name' => $category['name'],
                    'slug' => $category['slug'],
                    'description' => $category['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
