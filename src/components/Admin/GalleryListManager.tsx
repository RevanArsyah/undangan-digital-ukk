
import React, { useState, useEffect } from "react";
import { Plus, Trash, Image as ImageIcon, Loader2 } from "lucide-react";

interface GalleryImage {
  id: number;
  image_url: string;
  caption: string;
  created_at: string;
}

const GalleryListManager: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      setImages(data || []);
    } catch (error) {
      console.error("Failed to fetch gallery", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload File
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      if (!uploadData.success) throw new Error(uploadData.error);

      // 2. Save to Gallery DB
      const saveRes = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: uploadData.url, caption: "" }),
      });
      
      if (saveRes.ok) {
        fetchImages();
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus foto ini?")) return;
    try {
      await fetch(`/api/admin/gallery?id=${id}`, { method: "DELETE" });
      setImages(images.filter((img) => img.id !== id));
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-slate-800">Gallery Manager</h2>
        <div className="relative">
            <input
                type="file"
                id="gallery-upload"
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
            />
            <label 
                htmlFor="gallery-upload"
                className={`flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-accent/90 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
                {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Plus className="h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Upload Foto"}
            </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <div className="mb-4 rounded-full bg-slate-50 p-4">
                <ImageIcon className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500">Belum ada foto di gallery</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
              <img
                src={img.image_url}
                alt="Gallery"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-2 right-2 rounded-full bg-white/90 p-2 text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryListManager;
