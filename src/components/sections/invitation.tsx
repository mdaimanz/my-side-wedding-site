import Image from "next/image";
import { wedding } from "@/data/wedding";
import { MovingWaves } from "@/components/ui/moving-waves";

export function Invitation() {
  return (
    <section className="section invitation" id="jemputan">
      <MovingWaves placement="top" />
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

