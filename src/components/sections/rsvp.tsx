import { RsvpForm } from "./rsvp-form";

export function Rsvp() {
  return (
    <section className="section rsvp-section" id="rsvp">
      <div className="rsvp-intro">
        <p className="eyebrow">RSVP</p>
        <h2>Kehadiran anda bermakna</h2>
        <p>Sila sahkan kehadiran supaya kami dapat menyambut anda dengan sebaiknya. Maklum balas baharu dengan nombor yang sama akan mengemas kini rekod terdahulu.</p>
      </div>
      <RsvpForm />
    </section>
  );
}

