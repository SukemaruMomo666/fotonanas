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
        $this->info('Memulai proses duplikasi foto Nanas (Smart Match Mode)...');

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

        // Cache sources to avoid querying database for every photo
        // Kita ambil semua nanas dari 1 sampai 128 beserta ujiLabs nya
        $allSources = Pineapple::with('ujiLabs')->get()->filter(function($p) {
            if (preg_match('/-(\d+)$/', $p->kode_nanas, $m)) {
                $num = intval($m[1]);
                return $num >= 1 && $num <= 128;
            }
            return false;
        });

        foreach ($pendingPhotos as $photo) {
            $targetPineapple = $photo->pineapple;
            if (!$targetPineapple) {
                $bar->advance();
                continue;
            }

            $targetKode = $targetPineapple->kode_nanas; // contoh: L-129
            $angle = $photo->angle; // contoh: atas
            $prefix = substr($targetKode, 0, 2); // contoh "L-"

            // Cari kriteria target (Mahkota & Cacat)
            // Kita ambil dari uji lab pertama yang datanya tidak kosong
            $targetUjiLab = $targetPineapple->ujiLabs->first(function($u) {
                return !empty($u->bentuk_mahkota) || !empty($u->status_cacat);
            });
            
            $targetMahkota = $targetUjiLab ? $targetUjiLab->bentuk_mahkota : null;
            $targetCacat = $targetUjiLab ? $targetUjiLab->status_cacat : null;

            // Filter sumber yang COCOK bentuk mahkota dan status cacatnya
            $matchedSources = $allSources->filter(function($sourcePine) use ($targetMahkota, $targetCacat) {
                $u = $sourcePine->ujiLabs->first();
                $m = $u ? $u->bentuk_mahkota : null;
                $c = $u ? $u->status_cacat : null;
                
                // Keduanya harus cocok (jika target punya nilai)
                $matchMahkota = (!$targetMahkota || $m == $targetMahkota);
                $matchCacat = (!$targetCacat || $c == $targetCacat);
                
                return $matchMahkota && $matchCacat;
            });

            // Fallback 1: Jika tidak ada yang cocok sempurna, cocokkan salah satu (Mahkota saja)
            if ($matchedSources->isEmpty() && $targetMahkota) {
                $matchedSources = $allSources->filter(function($sourcePine) use ($targetMahkota) {
                    $u = $sourcePine->ujiLabs->first();
                    return ($u ? $u->bentuk_mahkota : null) == $targetMahkota;
                });
            }

            // Fallback 2: Jika masih tidak ada, random murni dari L-001 s/d L-128
            if ($matchedSources->isEmpty()) {
                $matchedSources = $allSources;
            }

            // Pilih satu secara acak dari list yang cocok
            $sourcePineapple = $matchedSources->random();
            $sourceKode = $sourcePineapple->kode_nanas;

            // Asumsi ekstensi file aslinya jpg (atau cari jika beda)
            $sourcePathPrefix = $sourceKode . '/' . $sourceKode . '_' . $angle;
            
            $extensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];
            $sourcePathFound = null;

            foreach ($extensions as $ext) {
                $possiblePath = $sourcePathPrefix . '.' . $ext;
                if ($drive->exists($possiblePath)) {
                    $sourcePathFound = $possiblePath;
                    break;
                }
            }

            if ($sourcePathFound) {
                $ext = pathinfo($sourcePathFound, PATHINFO_EXTENSION);
                $targetFileName = $targetKode . '_' . $angle . '.' . $ext;
                $targetPath = $targetKode . '/' . $targetFileName;

                try {
                    $drive->copy($sourcePathFound, $targetPath);

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
