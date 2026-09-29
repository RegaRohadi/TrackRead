<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reading status is per user. Uploaded books already store it on the
     * books row, but platform books are shared (user_id = null), so their
     * status lives on the per-user reading_progress row instead.
     */
    public function up(): void
    {
        Schema::table('reading_progress', function (Blueprint $table) {
            $table->string('status')->default('to_read')->after('total_pages');
        });
    }

    public function down(): void
    {
        Schema::table('reading_progress', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
