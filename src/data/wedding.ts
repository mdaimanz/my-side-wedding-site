import type { WeddingDetails } from "@/types/wedding";

// Replace these starter values with the confirmed wedding details.
export const wedding: WeddingDetails = {
  couple: { partnerOne: "Aiman", partnerTwo: "Atiqah" },
  invitationFrom: ["Haji Masod bin Hj. Ahmad", "&", "Hajjah Norashafiza binti Hj. Md Said"],
  date: {
    iso: "2027-01-01T11:00:00+08:00",
    display: "1 Januari 2027",
    day: "Jumaat",
    time: "6.30 petang — 10.30 malam",
  },
  venue: {
    name: "Grandeur Beling Glasshall",
    address: "Lorong Melati, 47000 Sungai Buloh, Selangor",
    mapUrl: "https://maps.app.goo.gl/BwUFQgpYpyGwTaYM7",
  },
  schedule: [
    { time: "6.30 petang", title: "Ketibaan tetamu", description: "Jamuan makan bermula." },
    { time: "8.00 malam", title: "Ketibaan pengantin", description: "Majlis bersanding dan doa selamat." },
    { time: "10.30 malam", title: "Majlis selesai", description: "Terima kasih atas kehadiran anda." },
  ],
  contact: [
    { name: "Hj. Masod", phone: "+6019-2408681", href: "tel:+60192408681" },
  ],
};

