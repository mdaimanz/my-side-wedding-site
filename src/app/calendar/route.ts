import { wedding } from "@/data/wedding";
import { weddingCalendarFile } from "@/lib/calendar";

export function GET() {
  return new Response(weddingCalendarFile(wedding), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="walimatul-urus.ics"',
    },
  });
}
