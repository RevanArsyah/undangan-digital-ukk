
import React, { useState, useEffect } from "react";
import { Save, Loader2, Upload, Trash2, Plus } from "lucide-react";

interface BankAccount {
  bank: string;
  number: string;
  name: string;
}

const SETTINGS_KEYS = {
  // Groom
  "groom.name": "Nama Panggilan Pria",
  "groom.fullName": "Nama Lengkap Pria",
  "groom.parents": "Nama Orang Tua Pria",
  "groom.instagram": "Instagram Pria",
  "groom.image": "Foto Pria (URL)",
  // Bride
  "bride.name": "Nama Panggilan Wanita",
  "bride.fullName": "Nama Lengkap Wanita",
  "bride.parents": "Nama Orang Tua Wanita",
  "bride.instagram": "Instagram Wanita",
  "bride.image": "Foto Wanita (URL)",
  // Venue
  "venue.name": "Nama Lokasi (Gedung/Hotel)",
  "venue.address": "Alamat Lengkap",
  "venue.mapUrl": "Link Google Maps",
  // Akad
  "akad.title": "Judul Acara 1 (Akad)",
  "akad.date": "Tanggal Akad",
  "akad.startTime": "Jam Mulai Akad",
  "akad.endTime": "Jam Selesai Akad",
  // Resepsi
  "resepsi.title": "Judul Acara 2 (Resepsi)",
  "resepsi.date": "Tanggal Resepsi",
  "resepsi.startTime": "Jam Mulai Resepsi",
  "resepsi.endTime": "Jam Selesai Resepsi",
};

const WeddingSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      setSettings(data);
      if (data.bank_accounts) {
        try {
          setBankAccounts(JSON.parse(data.bank_accounts));
        } catch (e) {
          console.error("Failed to parse bank accounts");
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...settings, bank_accounts: JSON.stringify(bankAccounts) };
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      alert("Settings saved!");
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingKey(key);
    
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        handleChange(key, data.url);
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploadingKey(null);
    }
  };

  const addBankAccount = () => {
    setBankAccounts([...bankAccounts, { bank: "", number: "", name: "" }]);
  };

  const removeBankAccount = (index: number) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  const updateBankAccount = (index: number, field: keyof BankAccount, value: string) => {
    const newAccounts = [...bankAccounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setBankAccounts(newAccounts);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 max-w-4xl">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold text-slate-800">Wedding Settings</h2>
            <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Perubahan
            </button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
            {/* Groom Section */}
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-slate-900 border-b pb-4">Mempelai Pria</h3>
                {Object.entries(SETTINGS_KEYS)
                    .filter(([key]) => key.startsWith("groom."))
                    .map(([key, label]) => (
                    <div key={key} className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                        {key.includes("image") ? (
                             <div className="flex gap-4 items-start">
                                {settings[key] && (
                                    <img src={settings[key]} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" />
                                )}
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        value={settings[key] || ""}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
                                        placeholder="URL Foto..."
                                    />
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            id={`upload-${key}`} 
                                            className="hidden" 
                                            onChange={(e) => handleImageUpload(key, e)} 
                                            accept="image/*"
                                        />
                                        <label 
                                            htmlFor={`upload-${key}`}
                                            className="inline-flex items-center gap-2 text-xs font-semibold text-accentDark cursor-pointer hover:underline"
                                        >
                                            {uploadingKey === key ? <Loader2 className="h-3 w-3 animate-spin"/> : <Upload className="h-3 w-3" />}
                                            Upload dari komputer
                                        </label>
                                    </div>
                                </div>
                             </div>
                        ) : (
                            <input
                            type="text"
                            value={settings[key] || ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Bride Section */}
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-slate-900 border-b pb-4">Mempelai Wanita</h3>
                {Object.entries(SETTINGS_KEYS)
                    .filter(([key]) => key.startsWith("bride."))
                    .map(([key, label]) => (
                    <div key={key} className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                        {key.includes("image") ? (
                             <div className="flex gap-4 items-start">
                                {settings[key] && (
                                    <img src={settings[key]} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" />
                                )}
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        value={settings[key] || ""}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
                                        placeholder="URL Foto..."
                                    />
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            id={`upload-${key}`} 
                                            className="hidden" 
                                            onChange={(e) => handleImageUpload(key, e)} 
                                            accept="image/*"
                                        />
                                        <label 
                                            htmlFor={`upload-${key}`}
                                            className="inline-flex items-center gap-2 text-xs font-semibold text-accentDark cursor-pointer hover:underline"
                                        >
                                            {uploadingKey === key ? <Loader2 className="h-3 w-3 animate-spin"/> : <Upload className="h-3 w-3" />}
                                            Upload dari komputer
                                        </label>
                                    </div>
                                </div>
                             </div>
                        ) : (
                            <input
                            type="text"
                            value={settings[key] || ""}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Venue Section */}
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-slate-900 border-b pb-4">Lokasi & Acara</h3>
                
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-700">Info Lokasi</h4>
                  {Object.entries(SETTINGS_KEYS)
                      .filter(([key]) => key.startsWith("venue."))
                      .map(([key, label]) => (
                      <div key={key} className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                          <input
                              type="text"
                              value={settings[key] || ""}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
                          />
                      </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-700">Acara 1 (Akad / Pemberkatan)</h4>
                  {Object.entries(SETTINGS_KEYS)
                      .filter(([key]) => key.startsWith("akad."))
                      .map(([key, label]) => (
                      <div key={key} className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                          <input
                              type={key.includes("date") ? "text" : key.includes("Time") ? "time" : "text"}
                              value={settings[key] || ""}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
                              placeholder={key.includes("date") ? "Contoh: 11 Oktober 2025" : ""}
                          />
                      </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-700">Acara 2 (Resepsi / Syukuran)</h4>
                  {Object.entries(SETTINGS_KEYS)
                      .filter(([key]) => key.startsWith("resepsi."))
                      .map(([key, label]) => (
                      <div key={key} className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                          <input
                              type={key.includes("date") ? "text" : key.includes("Time") ? "time" : "text"}
                              value={settings[key] || ""}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-accent focus:outline-none"
                              placeholder={key.includes("date") ? "Contoh: 11 Oktober 2025" : ""}
                          />
                      </div>
                  ))}
                </div>
            </div>

            {/* Bank Accounts Section */}
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="font-serif text-xl font-bold text-slate-900">Tanda Kasih (Rekening & E-Wallet)</h3>
                    <button
                        onClick={addBankAccount}
                        className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Rekening
                    </button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                    {bankAccounts.map((account, index) => (
                        <div key={index} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <button
                                onClick={() => removeBankAccount(index)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <div className="space-y-3 pr-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Bank / E-Wallet</label>
                                    <input
                                        type="text"
                                        value={account.bank}
                                        onChange={(e) => updateBankAccount(index, "bank", e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
                                        placeholder="Contoh: BCA / GoPay"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Rekening</label>
                                    <input
                                        type="text"
                                        value={account.number}
                                        onChange={(e) => updateBankAccount(index, "number", e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
                                        placeholder="1234567890"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Atas Nama</label>
                                    <input
                                        type="text"
                                        value={account.name}
                                        onChange={(e) => updateBankAccount(index, "name", e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
                                        placeholder="Nama Pemilik"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {bankAccounts.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-8 text-slate-400 border border-dashed rounded-xl">
                            <p className="text-sm">Belum ada rekening yang ditambahkan</p>
                            <button onClick={addBankAccount} className="mt-2 text-xs text-accentDark font-bold hover:underline">Tambah Sekarang</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default WeddingSettings;
