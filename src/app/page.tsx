import { SiteHeader } from "@/components/layout/site-header";
import { EventDetails } from "@/components/sections/event-details";
import { Hero } from "@/components/sections/hero";
import { Invitation } from "@/components/sections/invitation";
import { Rsvp } from "@/components/sections/rsvp";
import { wedding } from "@/data/wedding";

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <Hero />
      <Invitation />
      <EventDetails />
      <Rsvp />
      <footer>
        <p className="eyebrow">Terima kasih</p>
        <h2>{wedding.couple.partnerOne} <em>&amp;</em> {wedding.couple.partnerTwo}</h2>
        <p>Semoga pertemuan ini membawa seribu kenangan indah.</p>
      </footer>
    </main>
  );
}

