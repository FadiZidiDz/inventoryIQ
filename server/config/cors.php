<?php

return [

    /*

    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------

    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute

    | in web browsers.
    |
    */

    // Added 'api/*' and 'login' paths to ensure all your React requests are covered
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register'],

    'allowed_methods' => ['*'],

    // Replace the * with your specific React URL for better security
    'allowed_origins' => [
        'https://inventoryiq-1.onrender.com', 
        'http://localhost:5173' // This allows you to still test locally
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Change this to true so React can send Cookies/Sessions for Login
    'supports_credentials' => true,

];
