<?php

namespace App\Http\Controllers;

use App\Models\Pineapple;
use App\Models\UjiLab;
use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Auth; <-- Ini sudah tidak perlu dipakai lagi di sini
use Inertia\Inertia;

class UjiLabController extends Controller
{
    public function index()
    {
        // Tarik SEMUA data nanas dari database beserta relasi uji_labs-nya.
        // Pembatasan user_id sudah dihapus di sini.
        $pineapples = Pineapple::with('ujiLabs')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('UjiLab/Index', [
            'pineapples' => $pineapples
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'pineapple_id' => 'required|exists:pineapples,id',
            'pengujian_ke' => 'required|integer|min:1|max:3',
            'ukuran' => 'nullable|string',
            'brix' => 'nullable|numeric',
            'tat' => 'nullable|numeric',
            'ph' => 'nullable|numeric',
            'vit_c' => 'nullable|numeric',
            'status_cacat' => 'nullable|string',
            'bentuk_mahkota' => 'nullable|string',
            'kelayakan' => 'nullable|in:export,supermarket,pasar,reject',
        ]);

        // updateOrCreate agar kalau diinput ulang, data lama (di pengujian yg sama) tertimpa
        UjiLab::updateOrCreate(
            [
                'pineapple_id' => $request->pineapple_id,
                'pengujian_ke' => $request->pengujian_ke,
            ],
            $request->except(['pineapple_id', 'pengujian_ke'])
        );

        return redirect()->back();
    }
}
