import Image from "next/image";
import { wedding } from "@/data/wedding";
import { MovingWaves } from "@/components/ui/moving-waves";

const invitationFlowers = [
  { src: "/images/invitation-flower-5.png", width: 701, height: 760 },
  { src: "/images/invitation-flower-6.png", width: 840, height: 928 },
  { src: "/images/invitation-flower-7.png", width: 1134, height: 1071 },
];

export function Invitation() {
  return (
    <section className="section invitation" id="jemputan">
      <MovingWaves placement="top" />
      <div className="invitation-flowers" aria-hidden="true">
        {[...invitationFlowers, ...invitationFlowers].map((flower, index) => (
          <Image
            key={`${flower.src}-${index}`}
            className="invitation-flower"
            src={flower.src}
            alt=""
            width={flower.width}
            height={flower.height}
            sizes="(max-width: 760px) 120px, 240px"
            draggable={false}
          />
        ))}
      </div>
      <div className="invitation-content">
        <Image
          className="invitation-greeting"
          src="/images/assalamualaikum-calligraphy.png"
          alt="Assalamualaikum Warahmatullahi Wabarakatuh"
          width={2068}
          height={366}
        />
        <p className="hero-copy"><strong>Dengan penuh takzim, kami:</strong></p>
        <div className="invitation-families">
          {wedding.invitationFrom.map((line) => <p key={line}>{line}</p>)}
        </div>
        <p className="hero-copy"><strong>Dengan segala hormatnya menjemput Dato&apos; / Datin / Tuan / Puan / Encik / Cik seisi keluarga ke majlis anakanda kami dan pasangan</strong></p>
        <div className="invitation-couple">
          <p>Muhammad Aiman Bin Masod</p>
          <p className="invitation-couple-ampersand">&amp;</p>
          <p>Nor Atiqah Binti Mohd Nor</p>
        </div>
        <blockquote>“Semoga Allah memberkati kamu dan melimpahkan berkat kepada kamu, serta menghimpunkan kamu berdua dalam kebaikan.”</blockquote>
      </div>
    </section>
  );
}

