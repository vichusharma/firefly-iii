<?php

declare(strict_types=1);

namespace FireflyIII\Api\V1\Controllers\User;

use FireflyIII\Api\V1\Controllers\Controller;
use FireflyIII\Events\Security\System\NewUserRegistered;
use FireflyIII\Exceptions\FireflyException;
use FireflyIII\Notifications\Notifiables\OwnerNotifiable;
use FireflyIII\Repositories\User\UserRepositoryInterface;
use FireflyIII\Support\Http\Controllers\CreateStuff;
use Illuminate\Foundation\Auth\RegistersUsers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

final class RegisterController extends Controller
{
    use CreateStuff;
    use RegistersUsers;

    public function __construct()
    {
        parent::__construct();

        if ('web' !== config('firefly.authentication_guard')) {
            throw new FireflyException('Using external identity provider. Cannot continue.');
        }
    }

    public function register(Request $request): JsonResponse
    {
        try {
            $allowRegistration = $this->allowedToRegister();
            $inviteCode        = (string) $request->get('invite_code', '');
            $repository        = app(UserRepositoryInterface::class);
            $validCode         = $repository->validateInviteCode($inviteCode);

            if (false === $allowRegistration && false === $validCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'Registration is currently not available.',
                ], 403);
            }

            // Validate input
            $validator = $this->validator($request->only(['email', 'password', 'password_confirmation']));
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            // Create user
            $user = $this->createUser($request->only(['email', 'password']));
            Log::info(sprintf('Registered new user %s', $user->email));

            // Fire event and login
            $owner = new OwnerNotifiable();
            event(new NewUserRegistered($owner, $user));
            $this->guard()->login($user);

            // Redeem invite code if valid
            if ($validCode) {
                $repository->redeemCode($inviteCode);
            }

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully.',
                'user'    => [
                    'id'    => $user->id,
                    'email' => $user->email,
                    'name'  => $user->name,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
            ], 500);
        }
    }
}
