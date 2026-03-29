<?php

namespace Database\Seeders;

use App\Models\PrimaryId;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PrimaryIdSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['name' => 'Philippine Passport', 'description' => 'Philippine Passport from Department of Foreign Affairs'],
            ['name' => 'SSS/UMID Card', 'description' => 'SSS UMID Card from Social Security System'],
            ['name' => 'GSIS/UMID Card', 'description' => 'GSIS UMID Card Government Service Insurance System'],
            ['name' => 'Driver\'s License', 'description' => 'Driver\'s License from Land Transportation Office'],
            ['name' => 'OWWA ID', 'description' => 'OWWA ID Overseas Workers Welfare Administration'],
            ['name' => 'iDOLE Card', 'description' => 'iDOLE Card from Department of Labor and Employment'],
            ['name' => 'Voter\'s ID', 'description' => 'Voter\'s ID from Commission on Elections'],
            ['name' => 'Voter\'s Certificate', 'description' => 'Voter\'s Certification from the Officer of Election with Dry Seal'],
            ['name' => 'Firearms License', 'description' => 'Firearms License from Philippine National Police'],
            ['name' => 'Senior Citizen ID', 'description' => 'Senior Citizen ID from Local Government Unit'],
            ['name' => 'PWD ID', 'description' => 'Persons with Disabilities (PWD) ID from Local Government Unit'],
            ['name' => 'NBI Clearance', 'description' => 'NBI Clearance from National Bureau of Investigation'],
            ['name' => 'Immigrant Certificate', 'description' => 'Alien Certification of Registration or Immigrant Certificate of Registration'],
            ['name' => 'PhilHealth ID (digitized PVC)', 'description' => 'PhilHealth ID (digitized PVC)'],
            ['name' => 'GOCC ID', 'description' => 'Government Office and GOCC ID'],
            ['name' => 'Integrated Bar of the Philippines ID', 'description' => 'Integrated Bar of the Philippines ID'],
            ['name' => 'Valid e-Passport', 'description' => 'Current Valid ePassport (For Renewal of ePassport)'],
        ];

        $primaryIds = collect($data)->map(function ($item, $index) {
            return array_merge($item, [
                'id'         => Str::uuid(),
                'order'      => $index + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        })->toArray();

        PrimaryId::insert($primaryIds);
    }
}
