<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('books', 'file_type')) {
            Schema::table('books', function (Blueprint $table) {
                $table->string('file_type')->nullable()->after('pdf_path');
            });
        }

        DB::table('books')
            ->whereNotNull('pdf_path')
            ->whereNull('file_type')
            ->update(['file_type' => 'pdf']);
    }

    public function down(): void
    {
        if (Schema::hasColumn('books', 'file_type')) {
            Schema::table('books', function (Blueprint $table) {
                $table->dropColumn('file_type');
            });
        }
    }
};
