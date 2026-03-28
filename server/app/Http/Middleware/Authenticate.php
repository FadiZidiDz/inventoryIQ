<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // API-only app: never redirect unauthenticated requests to a web login route.
        // Returning null ensures Laravel responds with a proper 401 JSON instead of 500.
        return null;
    }
}
