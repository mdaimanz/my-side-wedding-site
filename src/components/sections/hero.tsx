import Image from "next/image";
import { wedding } from "@/data/wedding";
import { MovingWaves } from "@/components/ui/moving-waves";

const heroFlowers = [
  { src: "/images/invitation-flower-5.png", width: 701, height: 760 },
  { src: "/images/invitation-flower-6.png", width: 840, height: 928 },
  { src: "/images/invitation-flower-7.png", width: 1134, height: 1071 },
  { src: "/images/invitation-flower-5.png", width: 701, height: 760 },
  { src: "/images/invitation-flower-6.png", width: 840, height: 928 },
];

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
        <div className="hero-names">
          <div className="hero-name-flowers" aria-hidden="true">
            {heroFlowers.map((flower, index) => (
              <Image
                key={`${flower.src}-${index}`}
                className="hero-name-flower"
                src={flower.src}
                alt=""
                width={flower.width}
                height={flower.height}
                sizes="(max-width: 760px) 48px, 72px"
                draggable={false}
              />
            ))}
          </div>
          <h1>
            <span>{wedding.couple.partnerOne}</span>
            <em>&amp;</em>
            <span>{wedding.couple.partnerTwo}</span>
          </h1>
        </div>
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

