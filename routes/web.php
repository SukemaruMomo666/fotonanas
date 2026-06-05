<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PineappleController;
use App\Http\Controllers\UjiLabController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/login');

Route::get('/dashboard', [PineappleController::class, 'dashboard'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/pineapples', [PineappleController::class, 'store'])->name('pineapples.store');

    // Route Uji Lab
    Route::get('/uji-lab', [UjiLabController::class, 'index'])->name('ujilab.index');
    Route::post('/uji-lab', [UjiLabController::class, 'store'])->name('ujilab.store');
});

require __DIR__.'/auth.php';