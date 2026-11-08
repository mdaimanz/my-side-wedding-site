"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function WeddingExperience({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopAutomaticStartRef = useRef<() => void>(() => {});
  const userAttemptRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let disposed = false;

    function stopAutomaticStart() {
      document.removeEventListener("click", startOnInteraction, true);
      document.removeEventListener("keydown", startOnInteraction, true);
    }

    function startOnInteraction(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && (event.repeat || !["Enter", " "].includes(event.key))) return;
      // The music control owns its own play/pause action.
      if (event.target instanceof Element && event.target.closest(".wedding-music")) return;
      stopAutomaticStart();
      userAttemptRef.current = true;
      void audio!.play().catch(() => {
        if (!disposed && audio!.paused) {
          setMessage("Cuba lagi");
        }
      });
    }

    stopAutomaticStartRef.current = stopAutomaticStart;
    document.addEventListener("click", startOnInteraction, true);
    document.addEventListener("keydown", startOnInteraction, true);
    audio.addEventListener("playing", stopAutomaticStart);
    // A blocked autoplay attempt is expected; the first interaction can retry.
    void audio.play().then(stopAutomaticStart).catch(() => {});

    return () => {
      disposed = true;
      stopAutomaticStart();
      audio.removeEventListener("playing", stopAutomaticStart);
    };
  }, []);

  function playMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    userAttemptRef.current = true;
    setMessage("");
    setStarting(true);
    void audio.play().catch(() => {
      setMessage("Muzik belum dapat dimainkan. Tekan Mainkan muzik untuk mencuba lagi.");
    }).finally(() => setStarting(false));
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/wedding-entrance.mp3"
        loop
        preload="metadata"
        onPlaying={() => {
          stopAutomaticStartRef.current();
          setPlaying(true);
          setMessage("");
        }}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setStarting(false);
          if (userAttemptRef.current) {
            setMessage("Muzik tidak dapat dimuatkan. Jemputan masih boleh dilihat.");
          }
        }}
      />
      <main aria-label="Jemputan perkahwinan">{children}</main>
      <div className="wedding-music">
        {message && <p className="wedding-music-message" role="status">{message}</p>}
        <button
          className="wedding-music-toggle"
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          disabled={starting}
          onClick={() => {
            stopAutomaticStartRef.current();
            if (playing) audioRef.current?.pause();
            else playMusic();
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            {playing ? <path d="M6 4h4v16H6zm8 0h4v16h-4z" /> : <path d="M7 4v16l14-8z" />}
          </svg>
          <span>{playing ? "Pause" : "Play"}</span>
        </button>
      </div>
    </>
  );
}
