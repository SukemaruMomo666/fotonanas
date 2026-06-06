import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";

export default function Dashboard({ auth, nextKodeNanas }) {
    const angles = [
        { id: "depan", label: "Bagian Depan" },
        { id: "atas", label: "Bagian Atas" },
        { id: "bawah", label: "Bagian Bawah" },
        { id: "samping_kanan", label: "Samping Kanan" },
        { id: "samping_kiri", label: "Samping Kiri" },
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const [previews, setPreviews] = useState({});

    // Referensi untuk akses kamera langsung
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        depan: null,
        atas: null,
        bawah: null,
        samping_kanan: null,
        samping_kiri: null,
    });

    // Fungsi menyalakan kamera belakang dengan kualitas tinggi
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment", // Paksa pakai kamera belakang
                    width: { ideal: 1920 }, // Minta resolusi tinggi (Full HD)
                    height: { ideal: 1080 },
                },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraReady(true);
            }
        } catch (err) {
            console.error("Akses kamera ditolak:", err);
            alert(
                "Gagal mengakses kamera. Pastikan browser diizinkan mengakses kamera di pengaturan HP kamu!",
            );
        }
    };

    // Fungsi mematikan kamera (agar baterai HP tidak boros)
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
        }
        setIsCameraReady(false);
    };

    // Otomatis nyalakan kamera tiap pindah step JIKA foto belum diambil
    useEffect(() => {
        if (currentStep < angles.length && !previews[angles[currentStep].id]) {
            startCamera();
        } else {
            stopCamera();
        }

        // Cleanup saat komponen ditutup
        return () => stopCamera();
    }, [currentStep, previews]);

    // Fungsi menjepret langsung dari kotak Live Camera
    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const currentAngleId = angles[currentStep].id;

        if (video && canvas) {
            const context = canvas.getContext("2d");

            // Set ukuran canvas sama dengan resolusi asli video kamera
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Lukis frame saat ini ke dalam canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Ubah lukisan canvas menjadi file JPG asli (Kualitas 100% biar jernih)
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const file = new File([blob], `${currentAngleId}.jpg`, {
                            type: "image/jpeg",
                        });
                        setData(currentAngleId, file);

                        const imageUrl = URL.createObjectURL(blob);
                        setPreviews((prev) => ({
                            ...prev,
                            [currentAngleId]: imageUrl,
                        }));

                        // Matikan kamera setelah jepret berhasil
                        stopCamera();
                    }
                },
                "image/jpeg",
                1.0, // <--- Kualitas maksimal (1.0 = 100%)
            );
        }
    };

    const handleRetake = () => {
        const currentAngleId = angles[currentStep].id;
        // Hapus data foto saat ini
        setData(currentAngleId, null);
        setPreviews((prev) => {
            const newPreviews = { ...prev };
            delete newPreviews[currentAngleId];
            return newPreviews;
        });
        // Kamera akan otomatis menyala lagi berkat useEffect di atas
    };

    const handleNext = () => {
        if (currentStep < angles.length) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("pineapples.store"), {
            onSuccess: () => {
                alert(
                    "✅ Berhasil upload ke Google Drive! Lanjut ke nanas berikutnya.",
                );
                setPreviews({});
                reset();
                setCurrentStep(0);
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Jepret Nanas: {nextKodeNanas}
                </h2>
            }
        >
            <Head title="Dashboard Nanas" />

            {/* Wrapper utama, padding disesuaikan untuk layar HP */}
            <div className="py-4 sm:py-6 px-4 sm:px-0">
                <div className="max-w-md mx-auto">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-xl sm:shadow-2xl rounded-2xl p-5 sm:p-6">
                        {/* Step 1-5: Proses Foto */}
                        {currentStep < angles.length && (
                            <div className="space-y-5">
                                <div className="text-center">
                                    <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">
                                        LANGKAH {currentStep + 1} DARI 5
                                    </p>
                                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                                        Foto {angles[currentStep].label}
                                    </h2>
                                </div>

                                {/* Area Kamera / Preview - Aspek Rasio 1:1 Sempurna */}
                                <div className="w-full aspect-square bg-black rounded-xl relative flex items-center justify-center overflow-hidden shadow-inner border-2 sm:border-4 border-dashed border-gray-300 dark:border-gray-600">
                                    {/* Jika sudah difoto: Tampilkan Hasil */}
                                    {previews[angles[currentStep].id] ? (
                                        <img
                                            src={
                                                previews[angles[currentStep].id]
                                            }
                                            alt={angles[currentStep].label}
                                            className="w-full h-full object-cover transform scale-100"
                                        />
                                    ) : (
                                        /* Jika belum difoto: Tampilkan Live Video */
                                        <>
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline /* PENTING untuk iOS agar tidak otomatis fullscreen */
                                                muted
                                                className="w-full h-full object-cover"
                                            ></video>

                                            {/* Efek Loading sebelum kamera siap */}
                                            {!isCameraReady && (
                                                <div className="absolute flex flex-col items-center justify-center text-white opacity-80 animate-pulse">
                                                    <svg
                                                        className="w-10 h-10 mb-2"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                                        ></path>
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                                        ></path>
                                                    </svg>
                                                    <span className="text-sm font-medium">
                                                        Membuka Kamera...
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Canvas tersembunyi untuk memproses tangkapan layar */}
                                    <canvas
                                        ref={canvasRef}
                                        className="hidden"
                                    ></canvas>

                                    {/* Notifikasi Error Validasi */}
                                    {errors[angles[currentStep].id] && (
                                        <div className="absolute bottom-4 bg-red-100 text-red-600 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-md">
                                            {errors[angles[currentStep].id]}
                                        </div>
                                    )}
                                </div>

                                {/* Area Tombol Kontrol (Dioptimalkan untuk sentuhan jari) */}
                                <div className="pt-2">
                                    {!previews[angles[currentStep].id] ? (
                                        // Tombol jepret (Hanya bisa diklik jika kamera sudah menyala)
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            disabled={!isCameraReady}
                                            className="w-full flex justify-center items-center bg-blue-600 text-white font-extrabold text-base sm:text-lg py-4 sm:py-5 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 shadow-lg transition transform active:scale-[0.98]"
                                        >
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-4 border-white flex items-center justify-center mr-3">
                                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full"></div>
                                            </div>
                                            Jepret Sekarang
                                        </button>
                                    ) : (
                                        // Tombol Cek Hasil
                                        <div className="flex gap-3 sm:gap-4">
                                            <button
                                                type="button"
                                                onClick={handleRetake}
                                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold text-sm sm:text-base py-4 rounded-xl shadow-md hover:bg-gray-300 transition transform active:scale-[0.98]"
                                            >
                                                🔄 Ulangi
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                className="flex-1 bg-green-500 text-white font-bold text-sm sm:text-base py-4 rounded-xl shadow-md hover:bg-green-600 transition transform active:scale-[0.98]"
                                            >
                                                Selanjutnya ➡️
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step Selesai (Konfirmasi Upload) */}
                        {currentStep === angles.length && (
                            <form
                                onSubmit={submit}
                                className="text-center space-y-5 sm:space-y-6"
                            >
                                <div className="bg-green-100 dark:bg-green-900/30 p-5 sm:p-6 rounded-xl border border-green-200 dark:border-green-800 mb-4 sm:mb-6">
                                    <div className="text-4xl sm:text-5xl mb-3">
                                        🍍
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-extrabold text-green-700 dark:text-green-400 mb-1">
                                        Siap Diupload!
                                    </h2>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">
                                        5 Angle Nanas <b>{nextKodeNanas}</b>{" "}
                                        sudah lengkap.
                                    </p>
                                </div>

                                {/* Mini grid diperbaiki agar tetap presisi di layar kecil */}
                                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                                    {angles.map((angle) => (
                                        <div
                                            key={angle.id}
                                            className="aspect-square rounded-md overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm relative group"
                                        >
                                            <img
                                                src={previews[angle.id]}
                                                className="w-full h-full object-cover"
                                                alt={`Preview ${angle.label}`}
                                            />
                                            {/* Klik gambar kecil untuk edit ulang */}
                                            <div
                                                className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-white text-[9px] sm:text-[10px] font-bold uppercase text-center cursor-pointer"
                                                onClick={() =>
                                                    setCurrentStep(
                                                        angles.findIndex(
                                                            (a) =>
                                                                a.id ===
                                                                angle.id,
                                                        ),
                                                    )
                                                }
                                            >
                                                Edit
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex justify-center items-center bg-blue-600 text-white font-extrabold text-base sm:text-lg py-4 sm:py-5 px-4 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 shadow-xl transition transform active:scale-[0.98]"
                                >
                                    {processing
                                        ? "Memproses Upload..."
                                        : "Simpan & Lanjut Nanas Berikutnya"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(0)}
                                    className="block w-full text-gray-500 font-medium hover:text-gray-700 text-sm mt-3 sm:mt-4 underline p-2"
                                >
                                    Cek foto kembali dari awal
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
