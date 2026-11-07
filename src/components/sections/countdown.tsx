import { AnimatedCountdown } from "@/components/animated-countdown/animated-countdown";
import { wedding } from "@/data/wedding";

export function CountdownSection() {
  return (
    <section className="section countdown-section" aria-label="Kiraan detik ke majlis">
      <AnimatedCountdown
        targetDate={wedding.date.iso}
        variant="modern"
        completionMessage="Hari bahagia telah tiba!"
      />
    </section>
  );
}
