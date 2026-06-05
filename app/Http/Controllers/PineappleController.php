<?php

namespace App\Http\Controllers;

use App\Models\Pineapple;
use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log; // Tambahan untuk mencatat error
use Inertia\Inertia;

class PineappleController extends Controller
{
    // 1. Fungsi untuk menampilkan halaman Dashboard dengan KODE OTOMATIS
    public function dashboard()
    {
        $user = Auth::user();
        $prefix = strtoupper(substr($user->name, 0, 1)); // Ambil huruf pertama nama (Prabu -> P)

        // Cari data nanas terakhir milik user ini
        $lastPineapple = Pineapple::where('user_id', $user->id)
                            ->orderBy('id', 'desc')
                            ->first();

        $nextNumber = 1;
        if ($lastPineapple && preg_match('/-(\d+)$/', $lastPineapple->kode_nanas, $matches)) {
            $nextNumber = intval($matches[1]) + 1;
        }

        // Bikin kode otomatis, misal: P-001
        $nextKodeNanas = $prefix . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        return Inertia::render('Dashboard', [
            'nextKodeNanas' => $nextKodeNanas
        ]);
    }

    // 2. Fungsi untuk memproses file dan UPLOAD LANGSUNG KE GOOGLE DRIVE
    public function store(Request $request)
    {
        // Validasi 5 foto wajib ada
        $request->validate([
            'atas' => 'required|image|max:10240',
            'bawah' => 'required|image|max:10240',
            'samping_kanan' => 'required|image|max:10240',
            'samping_kiri' => 'required|image|max:10240',
            'depan' => 'required|image|max:10240',
        ]);

        $user = Auth::user();
        $prefix = strtoupper(substr($user->name, 0, 1));

        // Menentukan ID Nanas berikutnya
        $lastPineapple = Pineapple::where('user_id', $user->id)
                            ->orderBy('id', 'desc')
                            ->first();

        $nextNumber = 1;
        if ($lastPineapple && preg_match('/-(\d+)$/', $lastPineapple->kode_nanas, $matches)) {
            $nextNumber = intval($matches[1]) + 1;
        }

        $kodeNanas = $prefix . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        // Simpan data ke Database Utama
        $pineapple = Pineapple::create([
            'user_id' => $user->id,
            'kode_nanas' => $kodeNanas,
            'status_lengkap' => true,
        ]);

        $angles = ['atas', 'bawah', 'samping_kanan', 'samping_kiri', 'depan'];

        foreach ($angles as $angle) {
            if ($request->hasFile($angle)) {
                $file = $request->file($angle);
                $filename = $kodeNanas . '_' . $angle . '.' . $file->getClientOriginalExtension();

                // A. Simpan cadangan di lokal server dulu (Cepat)
                $localPath = $file->storeAs('public/nanas_lokal', $filename);

                try {
                    // B. LANGSUNG GAS UPLOAD KE GOOGLE DRIVE
                    Storage::disk('google')->put($kodeNanas . '/' . $filename, fopen($file->getRealPath(), 'r+'));
                    $statusUpload = 'done';
                    $drivePath = $kodeNanas . '/' . $filename;
                } catch (\Exception $e) {
                    // C. JIKA GAGAL UPLOAD KE DRIVE: Catat errornya di background
                    Log::error("Gagal Upload Drive untuk Nanas {$kodeNanas} angle {$angle}: " . $e->getMessage());

                    // Status jadi pending, nanti bisa dibuatkan tombol "Upload Ulang"
                    $statusUpload = 'pending';
                    $drivePath = null;
                }

                // Catat informasi foto ke database MySQL
                Photo::create([
                    'pineapple_id' => $pineapple->id,
                    'angle' => $angle,
                    'lokasi_lokal' => $localPath,
                    'lokasi_drive' => $drivePath,
                    'status_upload' => $statusUpload
                ]);
            }
        }

        return redirect()->route('dashboard')->with('success', "Nanas $kodeNanas berhasil diunggah!");
    }
}
