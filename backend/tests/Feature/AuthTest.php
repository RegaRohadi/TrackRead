<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function registerPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ], $overrides);
    }

    public function test_user_can_register_and_receive_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', $this->registerPayload());

        $response->assertStatus(201)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'username', 'email'],
                'token',
            ])
            ->assertJsonPath('user.username', 'testuser');
    }

    public function test_user_cannot_register_with_duplicate_username(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registerPayload())->assertStatus(201);

        $response = $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'email' => 'another@example.com',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors('username');
    }

    public function test_user_cannot_register_with_duplicate_email(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registerPayload())->assertStatus(201);

        $response = $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'username' => 'anotheruser',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_user_can_login_with_email(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'email' => 'login@example.com',
        ]));

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'login@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'username', 'email'],
                'token',
            ]);
    }

    public function test_user_can_login_with_username(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'username' => 'loginuser',
            'email' => 'login@example.com',
        ]));

        $response = $this->postJson('/api/v1/auth/login', [
            'login' => 'loginuser',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.username', 'loginuser');
    }

    public function test_login_username_is_case_insensitive(): void
    {
        $this->postJson('/api/v1/auth/register', $this->registerPayload([
            'username' => 'CaseUser',
            'email' => 'case@example.com',
        ]))->assertStatus(201);

        $this->assertDatabaseHas('users', ['username' => 'caseuser']);

        $response = $this->postJson('/api/v1/auth/login', [
            'login' => 'CASEUSER',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'username' => 'wrongpass',
            'email' => 'wrong@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'login' => 'wrongpass',
            'password' => 'NotThePassword!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('login');
    }
}
