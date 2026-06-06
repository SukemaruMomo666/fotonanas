import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { useState, useEffect, useMemo } from "react";

export default function Index({ auth, pineapples }) {
    // State untuk menyimpan target edit { id_nanas, uji_ke }
    const [editTarget, setEditTarget] = useState({ id: null, ujiKe: 1 });
    const [searchTerm, setSearchTerm] = useState("");

    const { data, setData, post, processing, recentlySuccessful } = useForm({
        pineapple_id: "",
        pengujian_ke: 1,
        ukuran: "",
        brix: "",
        tat: "",
        ph: "",
        vit_c: "",
        status_cacat: "",
        bentuk_mahkota: "",
        kelayakan: "",
    });

    // Ambil data nanas terbaru
    const activePineapple = useMemo(() => {
        return pineapples.find((p) => p.id === editTarget.id) || null;
    }, [pineapples, editTarget.id]);

    // Otomatis isi data form.
    // Untuk atribut fisik (ukuran, mahkota, cacat, kelayakan) kita ambil dari data manapun yang sudah terisi di nanas ini (biar input 1x nempel semua).
    useEffect(() => {
        if (activePineapple) {
            const currentTestData =
                activePineapple.uji_labs?.find(
                    (u) => u.pengujian_ke === editTarget.ujiKe,
                ) || {};
            const sharedData =
                activePineapple.uji_labs?.find(
                    (u) =>
                        u.ukuran ||
                        u.bentuk_mahkota ||
                        u.status_cacat ||
                        u.kelayakan,
                ) || {};

            setData({
                pineapple_id: activePineapple.id,
                pengujian_ke: editTarget.ujiKe,
                ukuran: currentTestData.ukuran || sharedData.ukuran || "",
                brix: currentTestData.brix || "",
                tat: currentTestData.tat || "",
                ph: currentTestData.ph || "",
                vit_c: currentTestData.vit_c || "",
                status_cacat:
                    currentTestData.status_cacat ||
                    sharedData.status_cacat ||
                    "",
                bentuk_mahkota:
                    currentTestData.bentuk_mahkota ||
                    sharedData.bentuk_mahkota ||
                    "",
                kelayakan:
                    currentTestData.kelayakan || sharedData.kelayakan || "",
            });
        }
    }, [activePineapple, editTarget.ujiKe]);

    const submit = (e) => {
        e.preventDefault();
        post(route("ujilab.store"), { preserveScroll: true });
    };

    // --- LOGIC SEARCH & FILTER ---
    const filteredPineapples = useMemo(() => {
        if (!searchTerm) return pineapples;
        const term = searchTerm.toLowerCase();

        return pineapples.filter((p) => {
            if (p.kode_nanas.toLowerCase().includes(term)) return true;
            if (p.uji_labs) {
                return p.uji_labs.some(
                    (u) =>
                        (u.kelayakan || "").toLowerCase().includes(term) ||
                        (u.status_cacat || "").toLowerCase().includes(term) ||
                        (u.bentuk_mahkota || "").toLowerCase().includes(term),
                );
            }
            return false;
        });
    }, [pineapples, searchTerm]);

    // --- LOGIC EXPORT TO EXCEL (Native Format) ---
    const exportToExcel = () => {
        let html = `
            <table border="1">
                <thead>
                    <tr>
                        <th>Kode Nanas</th>
                        <th>Uji Ke</th>
                        <th>Ukuran</th>
                        <th>Bentuk Mahkota</th>
                        <th>Brix</th>
                        <th>TAT</th>
                        <th>pH</th>
                        <th>Vit C</th>
                        <th>Status Cacat</th>
                        <th>Kelayakan</th>
                    </tr>
                </thead>
                <tbody>
        `;

        filteredPineapples.forEach((p) => {
            const sharedData = {
                ukuran: p.uji_labs?.find((u) => u.ukuran)?.ukuran || "-",
                bentuk_mahkota:
                    p.uji_labs?.find((u) => u.bentuk_mahkota)?.bentuk_mahkota ||
                    "-",
                status_cacat:
                    p.uji_labs?.find((u) => u.status_cacat)?.status_cacat ||
                    "-",
                kelayakan:
                    p.uji_labs?.find((u) => u.kelayakan)?.kelayakan || "",
            };

            [1, 2, 3].forEach((ujiKe, indexUji) => {
                const row =
                    p.uji_labs?.find((u) => u.pengujian_ke === ujiKe) || {};

                html += `
                    <tr>
                        <td>${indexUji === 0 ? p.kode_nanas : ""}</td>
                        <td>${ujiKe}</td>
                        <td>${indexUji === 0 ? sharedData.ukuran : ""}</td>
                        <td>${indexUji === 0 ? sharedData.bentuk_mahkota : ""}</td>
                        <td>${row.brix || ""}</td>
                        <td>${row.tat || ""}</td>
                        <td>${row.ph || ""}</td>
                        <td>${row.vit_c || ""}</td>
                        <td>${indexUji === 0 ? sharedData.status_cacat : ""}</td>
                        <td>${indexUji === 0 ? sharedData.kelayakan : ""}</td>
                    </tr>
                `;
            });
        });

        html += `</tbody></table>`;

        // Create Blob
        const blob = new Blob([html], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `Rekap_Uji_Lab_${new Date().toISOString().slice(0, 10)}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditClick = (id, ujiKe) => {
        setEditTarget({ id, ujiKe });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl sm:text-2xl text-gray-800 dark:text-gray-200 tracking-tight">
                    🔬 Data Uji Lab
                </h2>
            }
        >
            <Head title="Uji Lab" />

            <div className="py-6 sm:py-8 px-2 sm:px-6 lg:px-8 max-w-[90rem] mx-auto space-y-6 sm:space-y-8">
                {/* === BAGIAN ATAS: FORM INPUT === */}
                {!activePineapple ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-2xl p-6 sm:p-8 text-center animate-in fade-in transition-all mx-2 sm:mx-0">
                        <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                            👇
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-blue-700 dark:text-blue-400 mb-2">
                            Belum ada target pengisian!
                        </h3>
                        <p className="text-sm sm:text-base text-blue-600 dark:text-blue-300 font-medium">
                            Silakan klik tombol{" "}
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs mx-1">
                                Isi / Edit
                            </span>{" "}
                            pada tabel di bawah untuk mulai menginput data lab.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 md:p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 transition-all mx-2 sm:mx-0">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Input Data Nanas
                                </h3>
                                <h2 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                                    🍍 {activePineapple.kode_nanas}
                                </h2>
                            </div>
                            <button
                                onClick={() =>
                                    setEditTarget({ id: null, ujiKe: 1 })
                                }
                                className="text-sm font-bold text-gray-400 hover:text-red-500 mt-3 sm:mt-0 transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg"
                            >
                                ✖ Tutup Form
                            </button>
                        </div>

                        <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl mb-6 shadow-inner">
                            {[1, 2, 3].map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() =>
                                        setEditTarget({
                                            ...editTarget,
                                            ujiKe: tab,
                                        })
                                    }
                                    className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-bold rounded-lg transition-all duration-300 ${editTarget.ujiKe === tab ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md transform scale-[1.02]" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
                                >
                                    Uji Ke-{tab}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={submit}>
                            {recentlySuccessful && (
                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 font-medium flex items-center text-sm sm:text-base">
                                    <svg
                                        className="w-5 h-5 mr-2 shrink-0"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        ></path>
                                    </svg>
                                    Data Pengujian {editTarget.ujiKe} berhasil
                                    disimpan!
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-4 p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                        Fisik & Dimensi{" "}
                                        <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded text-[10px] normal-case tracking-normal">
                                            Isi 1x aja
                                        </span>
                                    </h3>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                            Ukuran
                                        </label>
                                        <input
                                            type="text"
                                            value={data.ukuran}
                                            onChange={(e) =>
                                                setData(
                                                    "ukuran",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full text-sm rounded-lg bg-white dark:bg-gray-900 dark:text-white border-gray-200 dark:border-gray-700 py-2.5 focus:ring-blue-500"
                                            placeholder="Besar / Kecil"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                            Bentuk Mahkota
                                        </label>
                                        <input
                                            type="text"
                                            value={data.bentuk_mahkota}
                                            onChange={(e) =>
                                                setData(
                                                    "bentuk_mahkota",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full text-sm rounded-lg bg-white dark:bg-gray-900 dark:text-white border-gray-200 dark:border-gray-700 py-2.5 focus:ring-blue-500"
                                            placeholder="Normal / Miring"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                            Status Cacat
                                        </label>
                                        <input
                                            type="text"
                                            value={data.status_cacat}
                                            onChange={(e) =>
                                                setData(
                                                    "status_cacat",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full text-sm rounded-lg bg-white dark:bg-gray-900 dark:text-white border-gray-200 dark:border-gray-700 py-2.5 focus:ring-blue-500"
                                            placeholder="Kosongkan jika mulus..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 sm:p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center">
                                        Uji Kandungan{" "}
                                        <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-300 rounded text-[10px] normal-case tracking-normal">
                                            Berubah per uji
                                        </span>
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                                Brix (%)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.brix}
                                                onChange={(e) =>
                                                    setData(
                                                        "brix",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-sm rounded-lg bg-white dark:bg-gray-900 dark:text-white border-blue-200 dark:border-blue-800 py-2.5 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                                TAT
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.tat}
                                                onChange={(e) =>
                                                    setData(
                                                        "tat",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-sm rounded-lg bg-white dark:bg-gray-900 dark:text-white border-blue-200 dark:border-blue-800 py-2.5 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                                pH
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.ph}
                                                onChange={(e) =>
                                                    setData(
                                                        "ph",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-sm rounded-lg bg-white dark:bg-gray-900 dark:text-white border-blue-200 dark:border-blue-800 py-2.5 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                                Vit C
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={data.vit_c}
                                                onChange={(e) =>
                                                    setData(
                                                        "vit_c",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-sm rounded-lg bg-white dark:bg-gray-900 dark:text-white border-blue-200 dark:border-blue-800 py-2.5 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                                        Kesimpulan Kelayakan
                                        <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded text-[10px] normal-case font-medium">
                                            Isi 1x aja
                                        </span>
                                    </label>
                                    <select
                                        value={data.kelayakan}
                                        onChange={(e) =>
                                            setData("kelayakan", e.target.value)
                                        }
                                        className="w-full text-base sm:text-lg rounded-xl bg-white dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500 p-3 sm:p-4 font-medium shadow-sm cursor-pointer transition-all"
                                    >
                                        <option value="">
                                            -- Tentukan Grade Pasar --
                                        </option>
                                        <option value="export">
                                            ✈️ Grade A (Export)
                                        </option>
                                        <option value="supermarket">
                                            🛒 Grade B (Supermarket)
                                        </option>
                                        <option value="pasar">
                                            🏪 Grade C (Pasar Tradisional)
                                        </option>
                                        <option value="reject">
                                            ❌ Grade D (Reject / Buang)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full mt-6 flex justify-center items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-base sm:text-lg py-3 sm:py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70"
                            >
                                {processing
                                    ? "Menyimpan..."
                                    : `💾 Simpan Data Pengujian ${editTarget.ujiKe}`}
                            </button>
                        </form>
                    </div>
                )}

                {/* === BAGIAN BAWAH: TABEL REKAPITULASI === */}
                <div className="bg-white dark:bg-gray-800 shadow-2xl sm:rounded-2xl border-y sm:border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50">
                        <h2 className="text-lg font-black text-gray-800 dark:text-white">
                            📊 Rekapitulasi Data Lab
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <button
                                onClick={exportToExcel}
                                className="inline-flex justify-center items-center px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors active:scale-[0.98]"
                            >
                                <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    ></path>
                                </svg>
                                Export Excel
                            </button>
                            <div className="relative flex-grow sm:flex-grow-0">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                        className="h-5 w-5 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cari Kode Nanas / Cacat / Grade..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10 block w-full sm:w-80 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="min-w-full border-collapse">
                            <thead className="bg-gray-100 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-900 px-4 py-4 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-r border-gray-200 dark:border-gray-700 whitespace-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                        Kode Nanas
                                    </th>
                                    <th className="px-4 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                        Uji Ke
                                    </th>

                                    {/* KOLOM MERGE (Fisik) */}
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                        Ukuran
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                                        Mahkota
                                    </th>

                                    {/* KOLOM INDIVIDU (Kandungan) */}
                                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 whitespace-nowrap">
                                        Brix
                                    </th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 whitespace-nowrap">
                                        TAT
                                    </th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 whitespace-nowrap">
                                        pH
                                    </th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                                        Vit C
                                    </th>

                                    {/* KOLOM MERGE (Kesimpulan) */}
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                                        Cacat
                                    </th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                        Kelayakan
                                    </th>

                                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-l border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredPineapples.length > 0 ? (
                                    filteredPineapples.map((p, pIndex) => {
                                        const bgClass =
                                            pIndex % 2 === 0
                                                ? "bg-white dark:bg-gray-800"
                                                : "bg-gray-50 dark:bg-gray-800/60";

                                        // Ekstrak data fisik dari salah satu pengujian
                                        const sharedData = {
                                            ukuran:
                                                p.uji_labs?.find(
                                                    (u) => u.ukuran,
                                                )?.ukuran || "-",
                                            bentuk_mahkota:
                                                p.uji_labs?.find(
                                                    (u) => u.bentuk_mahkota,
                                                )?.bentuk_mahkota || "-",
                                            status_cacat:
                                                p.uji_labs?.find(
                                                    (u) => u.status_cacat,
                                                )?.status_cacat || "-",
                                            kelayakan:
                                                p.uji_labs?.find(
                                                    (u) => u.kelayakan,
                                                )?.kelayakan || "",
                                        };

                                        return [1, 2, 3].map(
                                            (ujiKe, indexUji) => {
                                                const row =
                                                    p.uji_labs?.find(
                                                        (u) =>
                                                            u.pengujian_ke ===
                                                            ujiKe,
                                                    ) || {};
                                                const hasData = !!row.id;

                                                const isEditingThis =
                                                    editTarget.id === p.id &&
                                                    editTarget.ujiKe === ujiKe;
                                                const rowClass = isEditingThis
                                                    ? "bg-blue-100 dark:bg-blue-900/40 border-l-4 border-l-blue-600"
                                                    : bgClass;

                                                return (
                                                    <tr
                                                        key={`${p.id}-${ujiKe}`}
                                                        className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${rowClass}`}
                                                    >
                                                        {/* KODE NANAS - MERGE & STICKY */}
                                                        {indexUji === 0 && (
                                                            <td
                                                                rowSpan="3"
                                                                className={`sticky left-0 z-10 px-4 py-3 align-top font-black text-base text-gray-900 dark:text-white whitespace-nowrap border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_rgba(0,0,0,0.05)] ${bgClass}`}
                                                            >
                                                                <div className="flex items-center pt-2.5">
                                                                    <span className="text-xl mr-2">
                                                                        🍍
                                                                    </span>
                                                                    {
                                                                        p.kode_nanas
                                                                    }
                                                                </div>
                                                            </td>
                                                        )}

                                                        {/* UJI KE */}
                                                        <td
                                                            className={`px-4 py-3 text-center border-r border-gray-100 dark:border-gray-700 whitespace-nowrap ${!hasData && "opacity-50"}`}
                                                        >
                                                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md font-bold text-xs">
                                                                Ke-{ujiKe}
                                                            </span>
                                                        </td>

                                                        {/* UKURAN & MAHKOTA - MERGE */}
                                                        {indexUji === 0 && (
                                                            <td
                                                                rowSpan="3"
                                                                className="px-4 py-3 align-top whitespace-nowrap text-gray-600 dark:text-gray-300 font-medium"
                                                            >
                                                                <div className="pt-2.5">
                                                                    {
                                                                        sharedData.ukuran
                                                                    }
                                                                </div>
                                                            </td>
                                                        )}
                                                        {indexUji === 0 && (
                                                            <td
                                                                rowSpan="3"
                                                                className="px-4 py-3 align-top whitespace-nowrap text-gray-600 dark:text-gray-300 font-medium border-r border-gray-200 dark:border-gray-700"
                                                            >
                                                                <div className="pt-2.5">
                                                                    {
                                                                        sharedData.bentuk_mahkota
                                                                    }
                                                                </div>
                                                            </td>
                                                        )}

                                                        {/* HASIL LAB KANDUNGAN */}
                                                        <td
                                                            className={`px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 whitespace-nowrap ${!hasData && "opacity-50"}`}
                                                        >
                                                            {row.brix || "-"}
                                                        </td>
                                                        <td
                                                            className={`px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 whitespace-nowrap ${!hasData && "opacity-50"}`}
                                                        >
                                                            {row.tat || "-"}
                                                        </td>
                                                        <td
                                                            className={`px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 whitespace-nowrap ${!hasData && "opacity-50"}`}
                                                        >
                                                            {row.ph || "-"}
                                                        </td>
                                                        <td
                                                            className={`px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 ${!hasData && "opacity-50"}`}
                                                        >
                                                            {row.vit_c || "-"}
                                                        </td>

                                                        {/* CACAT & KELAYAKAN - MERGE */}
                                                        {indexUji === 0 && (
                                                            <td
                                                                rowSpan="3"
                                                                className="px-4 py-3 align-top text-gray-600 dark:text-gray-300 min-w-[120px] max-w-[200px] border-r border-gray-200 dark:border-gray-700"
                                                            >
                                                                <div className="pt-2.5 truncate">
                                                                    {
                                                                        sharedData.status_cacat
                                                                    }
                                                                </div>
                                                            </td>
                                                        )}
                                                        {indexUji === 0 && (
                                                            <td
                                                                rowSpan="3"
                                                                className="px-4 py-3 align-top text-center whitespace-nowrap"
                                                            >
                                                                <div className="pt-2.5">
                                                                    {sharedData.kelayakan ===
                                                                        "export" && (
                                                                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-extrabold text-xs shadow-sm">
                                                                            Export
                                                                        </span>
                                                                    )}
                                                                    {sharedData.kelayakan ===
                                                                        "supermarket" && (
                                                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-extrabold text-xs shadow-sm">
                                                                            Supermarket
                                                                        </span>
                                                                    )}
                                                                    {sharedData.kelayakan ===
                                                                        "pasar" && (
                                                                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg font-extrabold text-xs shadow-sm">
                                                                            Pasar
                                                                        </span>
                                                                    )}
                                                                    {sharedData.kelayakan ===
                                                                        "reject" && (
                                                                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg font-extrabold text-xs shadow-sm">
                                                                            Reject
                                                                        </span>
                                                                    )}
                                                                    {!sharedData.kelayakan && (
                                                                        <span className="text-gray-300 italic opacity-50">
                                                                            -
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        )}

                                                        {/* AKSI */}
                                                        <td className="px-4 py-3 text-center border-l border-gray-100 dark:border-gray-700 whitespace-nowrap">
                                                            <button
                                                                onClick={() =>
                                                                    handleEditClick(
                                                                        p.id,
                                                                        ujiKe,
                                                                    )
                                                                }
                                                                className={`inline-flex items-center justify-center px-4 py-1.5 rounded-lg font-bold text-xs transition-transform active:scale-95 ${
                                                                    hasData
                                                                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                                                                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/30"
                                                                }`}
                                                            >
                                                                {hasData
                                                                    ? "📝 Edit"
                                                                    : "➕ Isi"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="11"
                                            className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium"
                                        >
                                            <div className="text-4xl mb-3">
                                                🕵️‍♂️
                                            </div>
                                            Nanas dengan pencarian tersebut
                                            tidak ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
