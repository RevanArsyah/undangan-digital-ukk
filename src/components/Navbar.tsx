import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Image as ImageIcon,
  MessageCircle,
  Send,
  User,
  Home,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  QrCode,
} from "lucide-react";
interface NavbarProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}
const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestSlug, setGuestSlug] = useState("");
  const timeoutRef = useRef<number | null>(null);
  const resetTimer = () => {
    setIsVisible(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setIsVisible(false), 3000);
  };
  useEffect(() => {
    const events = ["mousemove", "scroll", "touchstart", "keydown"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    // Extract guest name from URL parameter
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const toParam = params.get("to");
      if (toParam) {
        setGuestName(decodeURIComponent(toParam));
        // Convert to slug
        const slug = toParam
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        setGuestSlug(slug);
      }
    }

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);
  const toggleMusic = () => {
    setIsMusicMuted((prev) => !prev);
    window.dispatchEvent(new CustomEvent("toggle-music"));
    resetTimer();
  };

  const openQRPage = () => {
    window.open(
      `/qr-checkin?guest=${encodeURIComponent(guestName)}&slug=${guestSlug}`,
      "_blank"
    );
    resetTimer();
  };
  const navItems = [
    { icon: Home, label: "Home", href: "#" },
    { icon: User, label: "Couple", href: "#couple" },
    { icon: Calendar, label: "Events", href: "#event" },
    { icon: ImageIcon, label: "Gallery", href: "#gallery" },
    { icon: Send, label: "RSVP", href: "#rsvp" },
    { icon: MessageCircle, label: "Wishes", href: "#wishes" },
  ];
  const itemBaseClass =
    "p-3 md:p-4 rounded-full text-slate-600 dark:text-slate-300 hover:text-accent dark:hover:text-accent hover:bg-white/80 dark:hover:bg-white/10 transition-all group relative flex items-center justify-center";
  const tooltipClass =
    "absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-accent text-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap hidden md:block shadow-xl pointer-events-none";
  return (
    <nav
      className={`pointer-events-none fixed bottom-4 left-1/2 z-[100] w-[95%] -translate-x-1/2 px-2 transition-all duration-700 ease-in-out md:bottom-8 md:w-fit ${isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        }`}
    >
      <div className="dark:bg-darkSurface/60 pointer-events-auto flex items-center justify-between gap-1 rounded-full border border-white/40 bg-white/60 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-colors duration-1000 md:justify-center md:p-2 dark:border-white/10">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={itemBaseClass}
            title={item.label}
          >
            <item.icon className="h-5 w-5 md:h-6 md:w-6" />
            <span className={tooltipClass}>{item.label}</span>
          </a>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMusic();
          }}
          className={itemBaseClass}
          aria-label="Toggle music"
        >
          {isMusicMuted ? (
            <VolumeX className="h-5 w-5 md:h-6 md:w-6" />
          ) : (
            <Volume2 className="h-5 w-5 md:h-6 md:w-6" />
          )}
          <span className={tooltipClass}>
            {isMusicMuted ? "Unmute Music" : "Mute Music"}
          </span>
        </button>
        {guestName && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openQRPage();
            }}
            className={itemBaseClass}
            aria-label="Show QR Code"
          >
            <QrCode className="h-5 w-5 md:h-6 md:w-6" />
            <span className={tooltipClass}>QR Check-in</span>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTheme();
            handleAction();
          }}
          className={itemBaseClass}
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 md:h-6 md:w-6" />
          ) : (
            <Sun className="h-5 w-5 md:h-6 md:w-6" />
          )}
          <span className={tooltipClass}>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </span>
        </button>
      </div>
    </nav>
  );
};
export default Navbar;
