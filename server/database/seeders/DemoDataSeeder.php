<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Category;
use App\Models\WarehouseType;
use App\Models\Warehouse;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\PrimaryId;
use App\Models\DeliveryPerson;
use App\Models\Batches;
use App\Models\ProductDelivery;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $category = Category::first();
        $warehouseType = WarehouseType::first();
        $primaryId = PrimaryId::first();

        $customerType = CustomerType::first();
        if (!$category || !$warehouseType || !$primaryId || !$customerType) {
            $this->command->warn('DemoDataSeeder: Run CategorySeeder, WarehouseTypeSeeder, PrimaryIdSeeder and CustomerTypeSeeder first.');
            return;
        }

        // 1. Warehouse
        $warehouse = Warehouse::create([
            'name'                     => 'Main Store Warehouse',
            'location'                 => '123 Demo Street',
            'contact_person'           => 'John Doe',
            'person_conno'             => '+1234567890',
            'email'                    => 'warehouse@demo.com',
            'hotline'                  => '+1234567890',
            'warehouseType_id'         => $warehouseType->id,
            'opening_hrs'              => '08:00',
            'closing_hrs'              => '18:00',
            'landmark'                 => 'Near Central Mall',
            'description'              => 'Demo warehouse',
            'size_area'                => '500 sqm',
            'insurance_info'           => 'demo_insurance.pdf',
            'certifications_compliance'=> 'demo_cert.pdf',
            'usage'                    => 'distribution',
            'is_biohazard'             => false,
            'maintenance_schedule'     => 'Monthly',
            'vendor_contracts'         => 'demo_contract.pdf',
        ]);

        // 2. Suppliers (one expiring soon for Near Expiry)
        $supplier1 = Supplier::create([
            'name'                 => 'Demo Supplies Co',
            'location'             => '456 Supplier Ave',
            'email'                => 'supplier1@demo.com',
            'hotline'              => '+1111111111',
            'contact_person'       => 'Jane Smith',
            'contact_person_number'=> '+1111111111',
            'contract_expiry_date' => Carbon::today()->addDays(15),
            'terms_and_conditions' => 'demo_terms.pdf',
            'agreement'            => 'demo_agreement.pdf',
        ]);
        $supplier2 = Supplier::create([
            'name'                 => 'Global Goods Inc',
            'location'             => '789 Trade Rd',
            'email'                => 'supplier2@demo.com',
            'hotline'              => '+2222222222',
            'contact_person'       => 'Bob Wilson',
            'contact_person_number'=> '+2222222222',
            'contract_expiry_date' => Carbon::today()->addDays(60),
            'terms_and_conditions' => 'demo_terms.pdf',
            'agreement'            => 'demo_agreement.pdf',
        ]);

        // 3. Products (mix of normal and low stock)
        $products = [];
        foreach (
            [
                ['name' => 'Laptop Pro',        'sku' => 'SKU-001', 'stocks' => 45,  'price' => 999.99],
                ['name' => 'Wireless Mouse',    'sku' => 'SKU-002', 'stocks' => 12,  'price' => 29.99],
                ['name' => 'USB Cable Pack',    'sku' => 'SKU-003', 'stocks' => 200, 'price' => 14.99],
                ['name' => 'Monitor 24"',      'sku' => 'SKU-004', 'stocks' => 8,   'price' => 249.99],
                ['name' => 'Keyboard Standard', 'sku' => 'SKU-005', 'stocks' => 55,  'price' => 49.99],
            ] as $p
        ) {
            $products[] = Product::create([
                'name'           => $p['name'],
                'sku'            => $p['sku'],
                'barcode'        => 'BC-' . $p['sku'],
                'stocks'         => $p['stocks'],
                'price'          => $p['price'],
                'description'    => 'Demo product: ' . $p['name'],
                'image'          => 'demo.png',
                'weight'         => '0.5',
                'dimensions'     => '10x10x5',
                'is_variant'     => false,
                'category_id'    => $category->id,
                'warehouse_id'   => $warehouse->id,
                'has_serial'     => false,
                'status'         => true,
            ]);
        }

        // Link products to suppliers
        foreach ($products as $product) {
            $product->suppliers()->attach([$supplier1->id => ['status' => 1], $supplier2->id => ['status' => 1]]);
        }

        // 4. Customers
        $customer1 = Customer::create([
            'account_number'    => 'ACC-001',
            'firstname'         => 'Alice',
            'lastname'          => 'Johnson',
            'contact_number'    => '+3333333333',
            'email'             => 'alice@demo.com',
            'customer_location' => 'City A',
            'billing_address'   => '100 Billing St',
            'shipping_address'  => '100 Billing St',
            'tin'               => 'TIN001',
            'has_company'       => false,
            'customer_type_id'  => $customerType->id,
        ]);
        $customer2 = Customer::create([
            'account_number'    => 'ACC-002',
            'firstname'         => 'Charlie',
            'lastname'          => 'Brown',
            'contact_number'    => '+4444444444',
            'email'             => 'charlie@demo.com',
            'customer_location' => 'City B',
            'billing_address'   => '200 Billing St',
            'shipping_address'  => '200 Billing St',
            'tin'               => 'TIN002',
            'has_company'       => false,
            'customer_type_id'  => $customerType->id,
        ]);

        // 5. Delivery person
        $deliveryPerson = DeliveryPerson::create([
            'firstname'       => 'Demo',
            'lastname'        => 'Driver',
            'primaryID_id'    => $primaryId->id,
            'primary_id_img'  => 'demo_id.jpg',
            'contact_number'  => '+5555555555',
            'home_address'    => '300 Driver Lane',
            'delivery_status' => true,
        ]);

        // 6. Batch
        $batch = Batches::create([
            'batch_num' => 'BATCH-' . strtoupper(Str::random(6)),
        ]);

        // 7. Product deliveries (delivered = status 2) for revenue and top products
        $year = now()->year;
        $deliveries = [
            ['product' => $products[0], 'qty' => 5,  'price' => 999.99,  'month' => 1],
            ['product' => $products[1], 'qty' => 20, 'price' => 29.99,   'month' => 1],
            ['product' => $products[0], 'qty' => 3,  'price' => 999.99,  'month' => 2],
            ['product' => $products[2], 'qty' => 50, 'price' => 14.99,   'month' => 2],
            ['product' => $products[3], 'qty' => 4,  'price' => 249.99, 'month' => 3],
            ['product' => $products[1], 'qty' => 15, 'price' => 29.99,  'month' => 3],
            ['product' => $products[4], 'qty' => 10, 'price' => 49.99,   'month' => (int) now()->month],
            ['product' => $products[0], 'qty' => 2,  'price' => 999.99,  'month' => (int) now()->month],
        ];

        $poNum = 1000;
        foreach ($deliveries as $d) {
            $qty = $d['qty'];
            $price = $d['price'];
            $subtotal = round($qty * $price, 2);
            $created = Carbon::createFromDate($year, $d['month'], min(28, now()->day));

            ProductDelivery::create([
                'po_number'          => 'PO-' . (++$poNum),
                'batch_id'           => $batch->id,
                'product_id'         => $d['product']->id,
                'quantity'           => (string) $qty,
                'price'              => $price,
                'subtotal'           => $subtotal,
                'customer_id'        => $customer1->id,
                'delivery_status'    => 2,
                'delivery_person_id' => $deliveryPerson->id,
                'created_at'         => $created,
                'updated_at'         => $created,
            ]);
        }

        $this->command->info('Demo data seeded: warehouse, suppliers, products, customers, deliveries.');
    }
}
