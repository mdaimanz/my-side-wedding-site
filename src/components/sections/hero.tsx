import { wedding } from "@/data/wedding";
import { MovingWaves } from "@/components/ui/moving-waves";

export function Hero() {
  return (
    <section className="hero" id="utama">
      <MovingWaves />
      <div className="hero-content">
        <p className="eyebrow">Walimatul Urus</p>
        <h1>
          <span>{wedding.couple.partnerOne}</span>
          <em>&amp;</em>
          <span>{wedding.couple.partnerTwo}</span>
        </h1>
        <div className="ornament" aria-hidden="true"><span>✦</span></div>
        <p className="hero-date">{wedding.date.display}</p>
        <p className="hero-copy">Dengan penuh kesyukuran, kami menjemput anda untuk bersama meraikan hari bahagia kami.</p>
        <a className="button button-primary" href="#rsvp">Sahkan kehadiran</a>
      </div>
      <a className="scroll-cue" href="#jemputan" aria-label="Teruskan ke jemputan">↓</a>
    </section>
  );
}

