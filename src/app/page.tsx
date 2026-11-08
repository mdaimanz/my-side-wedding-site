import { SiteHeader } from "@/components/layout/site-header";
import { EventDetails } from "@/components/sections/event-details";
import { Hero } from "@/components/sections/hero";
import { Invitation } from "@/components/sections/invitation";
import { Rsvp } from "@/components/sections/rsvp";
import { WeddingWishes } from "@/components/sections/wedding-wishes";
import { SingleWaveDivider } from "@/components/ui/moving-waves";
import { WeddingExperience } from "@/components/ui/wedding-experience";

export default function Home() {
  return (
    <WeddingExperience>
      <SiteHeader />
      <Hero />
      <Invitation />
      <SingleWaveDivider reverseColors />
      <EventDetails />
      <SingleWaveDivider />
      <Rsvp />
      <SingleWaveDivider reverseColors />
      <WeddingWishes />
      <footer>
        <p className="eyebrow">Terima kasih</p>
        <p>Semoga pertemuan ini membawa seribu kenangan indah.</p>
      </footer>
    </WeddingExperience>
  );
}

