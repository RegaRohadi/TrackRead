<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Safety net: the test suite uses RefreshDatabase (it wipes the
        // database), so refuse to run unless the target is clearly a test
        // database. This prevents accidentally wiping production.
        if ($this->app->runningUnitTests()) {
            $connection = config('database.default');
            $database = (string) config("database.connections.{$connection}.database");

            if ($database !== ':memory:' && ! str_ends_with($database, '_test')) {
                throw new \RuntimeException(
                    "Refusing to run tests against the \"{$database}\" database. ".
                    'Configure a dedicated *_test database (e.g. trackread_test).'
                );
            }
        }
    }
}
