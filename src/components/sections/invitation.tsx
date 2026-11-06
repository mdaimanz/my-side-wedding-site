import { wedding } from "@/data/wedding";
import { MovingWaves } from "@/components/ui/moving-waves";

export function Invitation() {
  return (
    <section className="section invitation" id="jemputan">
      <MovingWaves placement="top" />
      <div className="invitation-content">
        <p className="eyebrow">Assalamualaikum Warahmatullahi Wabarakatuh</p>
        <div className="invitation-families">
          {wedding.invitationFrom.map((line) => <p key={line}>{line}</p>)}
        </div>
        <p className="lead">Dengan segala hormatnya menjemput Dato&apos; / Datin / Tuan / Puan / Encik / Cik seisi keluarga ke majlis perkahwinan putera kami.</p>
        <blockquote>“Semoga Allah memberkati kamu dan melimpahkan berkat kepada kamu, serta menghimpunkan kamu berdua dalam kebaikan.”</blockquote>
      </div>
    </section>
  );
}

