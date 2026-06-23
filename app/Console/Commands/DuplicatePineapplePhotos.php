<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pineapple;
use App\Models\Photo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class DuplicatePineapplePhotos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'nanas:duplicate-photos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Menduplikat foto Nanas yang pending di Google Drive dan Update Database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Memulai proses duplikasi foto Nanas...');

        // Ambil semua Photo yang statusnya pending atau gagal
        $pendingPhotos = Photo::where('status_upload', 'pending')->orWhereNull('lokasi_drive')->get();

        if ($pendingPhotos->isEmpty()) {
            $this->info('Tidak ada foto pending yang perlu diduplikat.');
            return;
        }

        $this->info('Ditemukan ' . $pendingPhotos->count() . ' foto yang berstatus pending.');

        $drive = Storage::disk('google');

        $bar = $this->output->createProgressBar($pendingPhotos->count());
        $bar->start();

        foreach ($pendingPhotos as $photo) {
            $targetPineapple = $photo->pineapple;
            if (!$targetPineapple) {
                $bar->advance();
                continue;
            }

            $targetKode = $targetPineapple->kode_nanas; // contoh: L-129
            $angle = $photo->angle; // contoh: atas
            $prefix = substr($targetKode, 0, 2); // contoh "L-"

            // Pilih nanas sumber secara acak dari L-001 s/d L-128
            // Supaya fotonya tidak monoton dari 1 nanas saja
            $randomSourceNumber = rand(1, 128);
            $sourceKode = $prefix . str_pad($randomSourceNumber, 3, '0', STR_PAD_LEFT); // contoh: L-045

            // Asumsi ekstensi file aslinya jpg (atau cari jika beda, tapi untuk kemudahan kita anggap .jpg/.jpeg/.png)
            // Namun karena kita nggak tahu pasti ekstensinya, kita cek yang ada di drive
            $sourcePathPrefix = $sourceKode . '/' . $sourceKode . '_' . $angle;
            
            // Karena kita gatau ekstensinya (.jpg, .jpeg, .png), kita bisa list file di folder sumber
            // Tapi list file per loop itu lambat.
            // Paling aman kita coba asumsi extensi yang paling umum dulu
            $extensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];
            $sourcePathFound = null;

            // Jika sebelumnya lokasi_drive kosong, kita cari manual
            foreach ($extensions as $ext) {
                $possiblePath = $sourcePathPrefix . '.' . $ext;
                if ($drive->exists($possiblePath)) {
                    $sourcePathFound = $possiblePath;
                    break;
                }
            }

            if ($sourcePathFound) {
                // Ekstensi yang didapat
                $ext = pathinfo($sourcePathFound, PATHINFO_EXTENSION);
                
                $targetFileName = $targetKode . '_' . $angle . '.' . $ext;
                $targetPath = $targetKode . '/' . $targetFileName;

                try {
                    // Copy file di dalam google drive
                    $drive->copy($sourcePathFound, $targetPath);

                    // Update database
                    $photo->update([
                        'lokasi_drive' => $targetPath,
                        'status_upload' => 'done'
                    ]);

                } catch (\Exception $e) {
                    Log::error("Gagal menduplikat $sourcePathFound ke $targetPath: " . $e->getMessage());
                }
            } else {
                Log::warning("File sumber tidak ditemukan untuk angle $angle: $sourcePathPrefix.*");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Proses duplikasi foto selesai!');
    }
}
