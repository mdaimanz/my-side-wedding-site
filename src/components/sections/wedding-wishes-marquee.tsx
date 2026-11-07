"use client";

import { useId, useMemo, useState } from "react";
import { Marquee } from "@/components/ui/marquee";
import { normalizeWeddingWishes } from "@/lib/wishes";
import type { WeddingWish } from "@/types/wedding";

export function WeddingWishesMarquee({ wishes }: { wishes: WeddingWish[] }) {
  const [paused, setPaused] = useState(false);
  const trackId = useId();
  // Card elements stay the same when the pause button changes state.
  const cards = useMemo(() => normalizeWeddingWishes(wishes).map((wish, index) => (
    <figure className="wedding-wish-card" key={`${index}-${wish.full_name}`}>
      <span className="wedding-wish-heart" aria-hidden="true">♡</span>
      <figcaption className="wedding-wish-name">{wish.full_name}</figcaption>
      <blockquote className="wedding-wish-message">{wish.wish}</blockquote>
    </figure>
  )), [wishes]);

  if (cards.length === 0) {
    return <p className="wishes-state wishes-empty">Ucapan dan doa daripada tetamu akan dipaparkan di sini.</p>;
  }

  if (cards.length === 1) {
    return <div className="wishes-single">{cards}</div>;
  }

  return (
    <div className="wishes-carousel" data-paused={paused}>
      <Marquee id={trackId} pauseOnHover className="wishes-marquee [--duration:35s] [--gap:1.25rem]">
        {cards}
      </Marquee>
      <div className="wishes-controls">
        <button
          type="button"
          className="button button-secondary wishes-pause"
          aria-controls={trackId}
          aria-pressed={paused}
          onClick={() => setPaused((previous) => !previous)}
        >
          <span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>
          {paused ? "Sambung animasi" : "Jeda animasi"}
        </button>
      </div>
    </div>
  );
}
