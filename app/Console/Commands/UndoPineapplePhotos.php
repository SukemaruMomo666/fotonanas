<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pineapple;
use App\Models\Photo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class UndoPineapplePhotos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'nanas:undo-photos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Membatalkan duplikasi foto dari L-129 ke atas dan mengembalikan status ke pending';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Mencari foto duplikat yang akan di-undo...');

        // Ambil semua foto yang sudah done, tapi id nanasnya > 128
        // Kita juga bisa cek dari kode_nanas jika mau lebih pasti.
        // Asumsi format kode_nanas L-129 ke atas
        $photosToUndo = Photo::where('status_upload', 'done')
            ->whereNotNull('lokasi_drive')
            ->whereHas('pineapple', function ($query) {
                // Ambil kode_nanas, kita filter di collection aja biar aman cross-database format
            })
            ->get();

        $photosToUndo = $photosToUndo->filter(function($photo) {
            $pineapple = $photo->pineapple;
            if (!$pineapple) return false;
            
            $kode = $pineapple->kode_nanas;
            // misal "L-129"
            if (preg_match('/-(\d+)$/', $kode, $matches)) {
                $number = intval($matches[1]);
                return $number > 128; // Hanya L-129 sampai L-352
            }
            return false;
        });

        if ($photosToUndo->isEmpty()) {
            $this->info('Tidak ada foto yang perlu di-undo.');
            return;
        }

        $this->info('Ditemukan ' . $photosToUndo->count() . ' foto yang akan dihapus dari Google Drive.');
        
        $drive = Storage::disk('google');
        $bar = $this->output->createProgressBar($photosToUndo->count());
        $bar->start();

        foreach ($photosToUndo as $photo) {
            try {
                if ($drive->exists($photo->lokasi_drive)) {
                    $drive->delete($photo->lokasi_drive);
                }

                $photo->update([
                    'status_upload' => 'pending',
                    'lokasi_drive' => null
                ]);
            } catch (\Exception $e) {
                Log::error("Gagal menghapus file " . $photo->lokasi_drive . " : " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Berhasil melakukan Undo! Status telah kembali menjadi pending.');
    }
}
