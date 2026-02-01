import React, { useState } from "react";
import { Gift, Copy, Check, CreditCard } from "lucide-react";
import { WEDDING_CONFIG, WEDDING_TEXT } from "../constants";
import { WeddingContext } from "../App";
import { useContext } from "react";
const GiftInfo: React.FC = () => {
  const { bankAccounts } = useContext(WeddingContext);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  return (
    <section
      id="gift"
      className="dark:bg-darkBg bg-white py-16 transition-colors duration-1000 md:py-40"
    >
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-12 space-y-4 text-center md:mb-24 md:space-y-6">
          <div className="text-accentDark dark:text-accent mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 shadow-md md:mb-12 md:h-20 md:w-20 md:rounded-[2rem] dark:border-white/5 dark:bg-white/5">
            <Gift className="h-6 w-6 md:h-10 md:w-10" />
          </div>

          {/* Judul: Tanda Kasih */}
          <h2 className="font-serif text-4xl tracking-tight text-slate-900 italic md:text-9xl dark:text-white">
            {WEDDING_TEXT.gift.title}
          </h2>

          {/* <h2 className="font-serif text-4xl tracking-tight text-slate-900 italic md:text-9xl dark:text-white">
            Kado Pernikahan
          </h2> */}
          <div className="bg-accent/30 mx-auto h-[1px] w-16"></div>

          {/* Deskripsi Sopan */}
          <p className="mx-auto max-w-xl text-base leading-relaxed font-light text-balance text-slate-500 italic md:text-2xl dark:text-slate-400">
            {WEDDING_TEXT.gift.desc}
          </p>
          {/* <p className="mx-auto max-w-xl text-base leading-relaxed font-light text-balance text-slate-500 italic md:text-2xl dark:text-slate-400">
            Doa restu Anda adalah karunia terindah bagi kami. Jika bermaksud
            memberikan tanda kasih, dapat melalui:
          </p> */}
        </div>
        <div className="mb-10 grid grid-cols-1 gap-5 md:mb-20 md:grid-cols-2 md:gap-14">
          {bankAccounts.map((acc, idx) => (
            <div
              key={idx}
              className="editorial-card group relative space-y-6 overflow-hidden rounded-[1.5rem] border border-slate-100 p-8 shadow-sm transition-all hover:shadow-lg md:space-y-12 md:rounded-[4.5rem] md:p-20 dark:border-white/5"
            >
              <CreditCard className="text-accentDark/5 dark:text-accent/5 pointer-events-none absolute -top-10 -right-10 h-32 w-32 rotate-12 transition-transform duration-[3s] group-hover:scale-110 md:-top-16 md:-right-16 md:h-64 md:w-64" />
              <div className="relative z-10 space-y-6 text-center md:space-y-12 md:text-left">
                <div className="space-y-3 md:space-y-6">
                  <div className="flex items-center justify-center gap-2.5 md:justify-start">
                    <div className="bg-accent h-1.5 w-1.5 animate-pulse rounded-full"></div>
                    <p className="text-accentDark dark:text-accent tracking-luxury text-[9px] font-bold uppercase md:text-[12px]">
                      {acc.bank}
                    </p>
                  </div>
                  <p className="font-serif text-2xl leading-none tracking-tighter break-all text-slate-900 md:text-7xl dark:text-white">
                    {acc.number}
                  </p>
                  <p className="tracking-editorial text-[10px] font-medium text-slate-400 uppercase italic md:text-[14px] dark:text-slate-500">
                    A/N {acc.name}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(acc.number, `bank-${idx}`)}
                  className={`tracking-editorial inline-flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-[9px] font-bold uppercase shadow-md transition-all md:w-auto md:gap-5 md:px-12 md:py-6 md:text-[12px] ${
                    copiedId === `bank-${idx}`
                      ? "bg-green-500 text-white"
                      : "bg-primary dark:text-primary text-white active:scale-95 dark:bg-white"
                  }`}
                >
                  {copiedId === `bank-${idx}` ? (
                    <Check className="h-3.5 w-3.5 md:h-5 md:w-5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 md:h-5 md:w-5" />
                  )}
                  {copiedId === `bank-${idx}` ? "Berhasil" : "Salin Nomor"}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
export default GiftInfo;
