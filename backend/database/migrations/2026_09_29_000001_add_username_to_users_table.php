<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
        });

        // Backfill username untuk user yang sudah ada dari bagian lokal email,
        // lalu tambahkan suffix angka bila bentrok.
        $users = DB::table('users')->select('id', 'email')->whereNull('username')->get();
        $taken = DB::table('users')->whereNotNull('username')->pluck('username')->all();

        foreach ($users as $user) {
            $base = strtolower(preg_replace('/[^a-z0-9]+/i', '', strstr($user->email, '@', true) ?: 'user'));
            $base = $base !== '' ? $base : 'user';
            $username = $base;
            $i = 1;

            while (in_array($username, $taken, true)) {
                $username = $base.$i;
                $i++;
            }

            $taken[] = $username;

            DB::table('users')->where('id', $user->id)->update(['username' => $username]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};
