import React, { useEffect, useRef, useState } from "react";
import { MUSIC_URL } from "../constants";

const MusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const handlePlay = () => {
      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn(
            "Autoplay dicegah oleh browser, membutuhkan interaksi pengguna.",
            err
          );
        });
      }
    };

    const handleToggleMusic = () => {
      setIsMuted((prev) => !prev);
    };

    window.addEventListener("play-wedding-music", handlePlay);
    window.addEventListener("toggle-music", handleToggleMusic);

    return () => {
      window.removeEventListener("play-wedding-music", handlePlay);
      window.removeEventListener("toggle-music", handleToggleMusic);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <audio
      ref={audioRef}
      src={MUSIC_URL}
      loop
      preload="auto"
      className="hidden"
    />
  );
};

export default MusicPlayer;
