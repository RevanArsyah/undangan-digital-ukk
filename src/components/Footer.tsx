import React from "react";
import { Heart } from "lucide-react";
import { WEDDING_CONFIG } from "../constants";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const weddingDate = WEDDING_CONFIG?.events?.akad?.startDateTime 
    ? new Date(WEDDING_CONFIG.events.akad.startDateTime).toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    : "Coming Soon";
  const brideName = WEDDING_CONFIG?.couple?.bride?.name || "Bride";
  const groomName = WEDDING_CONFIG?.couple?.groom?.name || "Groom";

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 py-12 dark:from-slate-900 dark:to-slate-950">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-amber-400 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full bg-rose-400 blur-3xl"></div>
      </div>

      <div className="container relative mx-auto max-w-4xl px-4">
        {/* Quote Section */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Heart className="h-8 w-8 fill-rose-500 text-rose-500 animate-pulse" />
          </div>
          <p className="font-serif text-lg italic text-slate-600 dark:text-slate-300 md:text-xl">
            "Two souls, one heart"
          </p>
        </div>

        {/* Divider */}
        <div className="mx-auto mb-8 h-px w-24 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>

        {/* Wedding Info */}
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">
            <span>{brideName}</span>
            <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
            <span>{groomName}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {weddingDate}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-auto mb-8 h-px w-24 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>

        {/* Developer Credit */}
        <div className="mb-6 text-center">
          <p className="mb-1 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Made with</span>
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            <span>by</span>
          </p>
          <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300">
            Revan Arsyah
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Uji Kompetensi Keahlian 2026
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-200 pt-6 text-center dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            © {currentYear} All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
