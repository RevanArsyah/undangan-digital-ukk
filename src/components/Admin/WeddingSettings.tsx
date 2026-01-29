
import React, { useState, useEffect } from "react";
import { Save, Loader2, Upload } from "lucide-react";

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
};

const WeddingSettings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      setSettings(data);
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
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
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
        </div>
    </div>
  );
};

export default WeddingSettings;
