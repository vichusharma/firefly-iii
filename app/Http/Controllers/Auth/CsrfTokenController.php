<?php

/**
 * CsrfTokenController.php
 * 
 * Provides CSRF tokens for SPA (Single Page Application) authentication.
 * Angular and other SPAs need CSRF tokens to submit form-based login/register requests.
 */
declare(strict_types=1);

namespace FireflyIII\Http\Controllers\Auth;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Class CsrfTokenController
 * 
 * Handles CSRF token generation for SPA authentication flow
 */
class CsrfTokenController extends Controller
{
    /**
     * Get CSRF token for SPA
     * 
     * Used by Angular/Vue/React SPAs that need to submit
     * form-based login/register with CSRF protection
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'csrf_token' => $request->session()->token(),
            'success' => true,
            'message' => 'CSRF token retrieved successfully'
        ]);
    }
}
