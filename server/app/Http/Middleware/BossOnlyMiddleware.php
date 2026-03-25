<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BossOnlyMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Simplified app: only Administrator manages inventory, members, exports, etc.
        $isBoss = $user->roles()->where('role_name', 'Administrator')->exists();

        if (!$isBoss) {
            return response()->json(['message' => 'Unauthorized. Administrator access required.'], 403);
        }

        return $next($request);
    }
}
