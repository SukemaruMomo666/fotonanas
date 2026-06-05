import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";

export default function Dashboard({ auth, nextKodeNanas }) {
    // Urutan diubah: Depan jadi yang pertama sesuai request
    const angles = [
        { id: "depan", label: "Bagian Depan" },
        { id: "atas", label: "Bagian Atas" },
        { id: "bawah", label: "Bagian Bawah" },
        { id: "samping_kanan", label: "Samping Kanan" },
        { id: "samping_kiri", label: "Samping Kiri" },
    ];

    // State untuk melacak user sedang ada di tahap mana (0 sampai 4, 5 = selesai)
    const [currentStep, setCurrentStep] = useState(0);
    const [previews, setPreviews] = useState({});

    const { data, setData, post, processing, errors, reset } = useForm({
        depan: null,
        atas: null,
        bawah: null,
        samping_kanan: null,
        samping_kiri: null,
    });

    const handlePhotoChange = (e, angleId) => {
        const file = e.target.files[0];
        if (file) {
            setData(angleId, file);
            setPreviews((prev) => ({
                ...prev,
                [angleId]: URL.createObjectURL(file),
            }));
        }
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
                alert("✅ Berhasil upload ke Google Drive! Lanjut ke nanas berikutnya.");
                setPreviews({}); 
                reset(); 
                setCurrentStep(0); // Kembalikan ke tahap 1 (Depan)
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
                        
                        {/* Tampilan Step-by-Step (Jika belum sampai step 5) */}
                        {currentStep < angles.length && (
                            <div className="space-y-6">
                                {/* Header Info Tahap */}
                                <div className="text-center">
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">
                                        LANGKAH {currentStep + 1} DARI 5
                                    </p>
                                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                        Foto {angles[currentStep].label}
                                    </h2>
                                </div>

                                {/* Kotak Preview 1:1 (Aspect Square) */}
                                <div className="w-full aspect-square border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-900 relative flex items-center justify-center overflow-hidden shadow-inner">
                                    {previews[angles[currentStep].id] ? (
                                        <img
                                            src={previews[angles[currentStep].id]}
                                            alt={angles[currentStep].label}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-gray-400 dark:text-gray-500 flex flex-col items-center">
                                            <svg className="w-16 h-16 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span className="font-medium">Area Kamera 1:1</span>
                                        </div>
                                    )}

                                    {/* Pesan Error jika ada */}
                                    {errors[angles[currentStep].id] && (
                                        <div className="absolute bottom-4 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold shadow-md">
                                            {errors[angles[currentStep].id]}
                                        </div>
                                    )}
                                </div>

                                {/* Area Tombol Kontrol */}
                                <div className="pt-4">
                                    {!previews[angles[currentStep].id] ? (
                                        // Tombol jika BELUM difoto
                                        <div className="relative overflow-hidden w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl cursor-pointer hover:bg-blue-700 active:bg-blue-800 transition shadow-lg text-center flex justify-center items-center">
                                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            Buka Kamera
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => handlePhotoChange(e, angles[currentStep].id)}
                                            />
                                        </div>
                                    ) : (
                                        // Tombol jika SUDAH difoto (Opsi Retake & Next)
                                        <div className="flex gap-4">
                                            <div className="relative flex-1 overflow-hidden bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold py-4 rounded-xl cursor-pointer hover:bg-gray-300 transition text-center shadow-md">
                                                🔄 Ulangi
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => handlePhotoChange(e, angles[currentStep].id)}
                                                />
                                            </div>
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

                        {/* Tampilan Konfirmasi Akhir (Step 5) */}
                        {currentStep === angles.length && (
                            <form onSubmit={submit} className="text-center space-y-6">
                                <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-2xl border border-green-200 dark:border-green-800 mb-6">
                                    <div className="text-5xl mb-4">🍍</div>
                                    <h2 className="text-2xl font-extrabold text-green-700 dark:text-green-400 mb-1">
                                        Siap Diupload!
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                                        5 Angle Nanas <b>{nextKodeNanas}</b> sudah lengkap.
                                    </p>
                                </div>

                                {/* Mini Grid Preview */}
                                <div className="grid grid-cols-5 gap-2 mb-6">
                                    {angles.map((angle) => (
                                        <div key={angle.id} className="aspect-square rounded-md overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
                                            <img src={previews[angle.id]} className="w-full h-full object-cover" alt="Mini preview" />
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex justify-center items-center bg-blue-600 text-white font-extrabold text-lg py-5 px-4 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 shadow-xl transition"
                                >
                                    {processing ? (
                                        "Memproses Upload..."
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            Selesai & Lanjut Nanas Berikutnya
                                        </>
                                    )}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(0)}
                                    className="text-gray-500 font-medium hover:text-gray-700 text-sm mt-4 underline"
                                >
                                    Cek foto kembali
                                </button>
                            </form>
                        )}

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}