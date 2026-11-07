import type { WeddingDetails } from "@/types/wedding";

function calendarDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function eventDetails(details: WeddingDetails) {
  return {
    title: `Walimatul Urus ${details.couple.partnerOne} & ${details.couple.partnerTwo}`,
    location: `${details.venue.name}, ${details.venue.address}`,
    description: `Dengan penuh kesyukuran, kami menjemput anda untuk bersama meraikan hari bahagia kami.\n\nLokasi: ${details.venue.mapUrl}`,
    start: calendarDate(details.date.iso),
    end: calendarDate(details.date.endIso),
  };
}

export function googleCalendarUrl(details: WeddingDetails) {
  const event = eventDetails(details);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${event.start}/${event.end}`,
    ctz: "Asia/Kuala_Lumpur",
    location: event.location,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

// RFC 5545 folds content lines at 75 UTF-8 octets, without splitting a character.
function foldLine(line: string) {
  const encoder = new TextEncoder();
  let folded = "";
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      folded += "\r\n ";
      bytes = 1;
    }
    folded += character;
    bytes += size;
  }
  return folded;
}

export function weddingCalendarFile(details: WeddingDetails, now = new Date()) {
  const event = eventDetails(details);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Walimatul Urus//Wedding Calendar//MS",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    // Keep the same identity when guests download the event again.
    "UID:7b29f81d-fd44-40f1-b9ee-391fbbd1d23a",
    `DTSTAMP:${calendarDate(now.toISOString())}`,
    `DTSTART:${event.start}`,
    `DTEND:${event.end}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.location)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].map(foldLine).join("\r\n");
}
