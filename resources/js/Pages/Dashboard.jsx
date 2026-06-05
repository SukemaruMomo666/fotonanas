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

    // Fungsi menyalakan kamera belakang
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }, // Paksa pakai kamera belakang
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraReady(true);
            }
        } catch (err) {
            console.error("Akses kamera ditolak:", err);
            alert(
                "Gagal mengakses kamera. Pastikan browser diizinkan mengakses kamera!",
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

            // Ubah lukisan canvas menjadi file JPG asli (kualitas 80%)
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
                0.8,
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

            <div className="py-6">
                <div className="max-w-md mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-2xl sm:rounded-2xl p-6">
                        {/* Step 1-5: Proses Foto */}
                        {currentStep < angles.length && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">
                                        LANGKAH {currentStep + 1} DARI 5
                                    </p>
                                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                        Foto {angles[currentStep].label}
                                    </h2>
                                </div>

                                {/* Area Kamera / Preview */}
                                <div className="w-full aspect-square bg-black rounded-2xl relative flex items-center justify-center overflow-hidden shadow-inner border-4 border-dashed border-gray-300 dark:border-gray-600">
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
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover"
                                            ></video>

                                            {/* Efek Loading sebelum kamera siap */}
                                            {!isCameraReady && (
                                                <div className="absolute text-white animate-pulse">
                                                    Membuka Kamera...
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Canvas tersembunyi untuk memproses tangkapan layar */}
                                    <canvas
                                        ref={canvasRef}
                                        className="hidden"
                                    ></canvas>

                                    {errors[angles[currentStep].id] && (
                                        <div className="absolute bottom-4 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold shadow-md">
                                            {errors[angles[currentStep].id]}
                                        </div>
                                    )}
                                </div>

                                {/* Area Tombol Kontrol */}
                                <div className="pt-2">
                                    {!previews[angles[currentStep].id] ? (
                                        // Tombol jepret (Hanya muncul jika kamera siap)
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            disabled={!isCameraReady}
                                            className="w-full flex justify-center items-center bg-blue-600 text-white font-extrabold text-lg py-5 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 shadow-lg transition"
                                        >
                                            <div className="w-8 h-8 rounded-full border-4 border-white flex items-center justify-center mr-3">
                                                <div className="w-4 h-4 bg-white rounded-full"></div>
                                            </div>
                                            Jepret Sekarang
                                        </button>
                                    ) : (
                                        // Tombol Cek Hasil
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={handleRetake}
                                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold py-4 rounded-xl shadow-md hover:bg-gray-300 transition"
                                            >
                                                🔄 Ulangi
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                className="flex-1 bg-green-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-green-600 transition"
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
                                className="text-center space-y-6"
                            >
                                <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-2xl border border-green-200 dark:border-green-800 mb-6">
                                    <div className="text-5xl mb-4">🍍</div>
                                    <h2 className="text-2xl font-extrabold text-green-700 dark:text-green-400 mb-1">
                                        Siap Diupload!
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                                        5 Angle Nanas <b>{nextKodeNanas}</b>{" "}
                                        sudah lengkap.
                                    </p>
                                </div>

                                <div className="grid grid-cols-5 gap-2 mb-6">
                                    {angles.map((angle) => (
                                        <div
                                            key={angle.id}
                                            className="aspect-square rounded-md overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm relative group"
                                        >
                                            <img
                                                src={previews[angle.id]}
                                                className="w-full h-full object-cover"
                                                alt="Mini preview"
                                            />
                                            <div
                                                className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-[10px] font-bold uppercase text-center cursor-pointer"
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
                                    className="w-full flex justify-center items-center bg-blue-600 text-white font-extrabold text-lg py-5 px-4 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 shadow-xl transition"
                                >
                                    {processing
                                        ? "Memproses Upload..."
                                        : "Selesai & Lanjut Nanas Berikutnya"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(0)}
                                    className="text-gray-500 font-medium hover:text-gray-700 text-sm mt-4 underline"
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
