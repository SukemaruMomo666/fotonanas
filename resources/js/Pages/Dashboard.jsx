import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";

// 1. Tambahkan nextKodeNanas di dalam kurung kurawal ini
export default function Dashboard({ auth, nextKodeNanas }) {
    const angles = [
        { id: "atas", label: "Atas" },
        { id: "bawah", label: "Bawah" },
        { id: "samping_kanan", label: "Samping Kanan" },
        { id: "samping_kiri", label: "Samping Kiri" },
        { id: "depan", label: "Depan" },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        atas: null,
        bawah: null,
        samping_kanan: null,
        samping_kiri: null,
        depan: null,
    });

    const [previews, setPreviews] = useState({});

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

    const submit = (e) => {
        e.preventDefault();
        post(route("pineapples.store"), {
            onSuccess: () => {
                alert("Berhasil upload! Lanjut nanas berikutnya.");
                setPreviews({}); // Kosongkan preview gambar
                reset(); // Kosongkan file di memori form agar bersih untuk nanas selanjutnya
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Jepret Nanas Lapangan
                </h2>
            }
        >
            <Head title="Dashboard Nanas" />

            <div className="py-6">
                <div className="max-w-md mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-xl sm:rounded-lg p-6">
                        <div className="mb-6 text-center bg-gray-100 dark:bg-gray-700 py-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                Kode Nanas Saat Ini
                            </p>
                            {/* 2. Ubah P-001 menjadi variabel dinamis {nextKodeNanas} */}
                            <h1 className="text-4xl font-extrabold text-green-600 dark:text-green-400 mt-1">
                                {nextKodeNanas}
                            </h1>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            {angles.map((angle) => (
                                <div
                                    key={angle.id}
                                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center bg-gray-50 dark:bg-gray-900 relative"
                                >
                                    {/* Area Preview Foto */}
                                    {previews[angle.id] ? (
                                        <img
                                            src={previews[angle.id]}
                                            alt={angle.label}
                                            className="mx-auto h-40 w-full object-cover rounded-lg mb-3 shadow-sm"
                                        />
                                    ) : (
                                        <div className="h-24 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-3 font-medium">
                                            Belum ada foto
                                        </div>
                                    )}

                                    {/* Tombol Jepret Anti-Gagal */}
                                    <div className="relative overflow-hidden w-full bg-blue-600 text-white font-bold px-4 py-3 rounded-lg cursor-pointer hover:bg-blue-700 active:bg-blue-800 transition shadow-md">
                                        <span>
                                            📸 Jepret Angle {angle.label}
                                        </span>
                                        {/* Input file ditimpa di atas tombol transparan agar 100% responsif terhadap klik */}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) =>
                                                handlePhotoChange(e, angle.id)
                                            }
                                        />
                                    </div>
                                    {errors[angle.id] && (
                                        <div className="text-red-500 text-sm mt-2 font-medium">
                                            {errors[angle.id]}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-green-600 text-white font-extrabold text-lg py-4 px-4 rounded-xl hover:bg-green-700 active:bg-green-800 disabled:opacity-50 mt-8 shadow-lg transition"
                            >
                                {processing
                                    ? "Memproses & Uploading..."
                                    : "Simpan & Lanjut ke Nanas Berikutnya"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
