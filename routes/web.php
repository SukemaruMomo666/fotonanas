<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PineappleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Langsung arahkan halaman utama ke Login
Route::redirect('/', '/login');

// Mengarahkan dashboard ke Controller agar kodenya dinamis (bukan text mati)
Route::get('/dashboard', [PineappleController::class, 'dashboard'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Route eksekusi simpan foto
    Route::post('/pineapples', [PineappleController::class, 'store'])->name('pineapples.store');
});

require __DIR__.'/auth.php';
