import type { WeddingDetails } from "@/types/wedding";

// Replace these starter values with the confirmed wedding details.
export const wedding: WeddingDetails = {
  couple: { partnerOne: "Aiman", partnerTwo: "Atiqah" },
  invitationFrom: ["Masod bin Ahmad", "&", "Norashafiza binti Md Said"],
  date: {
    iso: "2027-01-01T11:00:00+08:00",
    display: "1 Januari 2027",
    day: "Jumaat",
    time: "11.00 pagi — 4.00 petang",
  },
  venue: {
    name: "Dewan Pilihan Keluarga",
    address: "Alamat penuh majlis, Malaysia",
    mapUrl: "https://maps.google.com",
  },
  schedule: [
    { time: "11.00 pagi", title: "Ketibaan tetamu", description: "Jamuan makan bermula." },
    { time: "12.30 tengah hari", title: "Ketibaan pengantin", description: "Majlis bersanding dan doa selamat." },
    { time: "4.00 petang", title: "Majlis selesai", description: "Terima kasih atas kehadiran dan doa anda." },
  ],
  contact: [
    { name: "Wakil keluarga", phone: "+60 12-345 6789", href: "tel:+60123456789" },
  ],
};

