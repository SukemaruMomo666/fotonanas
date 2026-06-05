<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uji_labs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pineapple_id')->constrained('pineapples')->cascadeOnDelete();
            $table->integer('pengujian_ke'); // Akan diisi 1, 2, dan 3
            $table->string('ukuran')->nullable();
            $table->decimal('brix', 5, 2)->nullable();
            $table->decimal('tat', 5, 2)->nullable();
            $table->decimal('ph', 5, 2)->nullable();
            $table->decimal('vit_c', 5, 2)->nullable();
            $table->string('status_cacat')->nullable();
            $table->string('bentuk_mahkota')->nullable();
            $table->enum('kelayakan', ['export', 'supermarket', 'pasar', 'reject'])->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uji_labs');
    }
};