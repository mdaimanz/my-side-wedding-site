import Image from "next/image";
import { wedding } from "@/data/wedding";
import { MovingWaves } from "@/components/ui/moving-waves";

export function Hero() {
  return (
    <section className="hero" id="utama">
      <MovingWaves />
      <Image
        className="hero-flowers-top-center"
        src="/images/hero-flowers-top-center.png"
        alt=""
        aria-hidden="true"
        width={981}
        height={510}
        sizes="(max-width: 924px) 90vw, 832px"
        priority
      />
      <div className="hero-content">
        <p className="eyebrow">Walimatul Urus</p>
        <h1>
          <span>{wedding.couple.partnerOne}</span>
          <em>&amp;</em>
          <span>{wedding.couple.partnerTwo}</span>
        </h1>
        <div className="ornament" aria-hidden="true"><span>✦</span></div>
        <div className="hero-date">
          <p className="hero-date-value">{wedding.date.display}</p>
          <p className="hero-time">{wedding.date.time}</p>
        </div>
        <p className="hero-copy"><strong>Dengan penuh kesyukuran, kami menjemput anda untuk bersama meraikan hari bahagia kami.</strong></p>
        <a className="button button-primary" href="#rsvp">Sahkan kehadiran</a>
      </div>
      <a className="scroll-cue" href="#jemputan" aria-label="Teruskan ke jemputan">↓</a>
    </section>
  );
}

