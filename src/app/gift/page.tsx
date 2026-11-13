import type { Metadata } from "next";
import { GiftList } from "@/components/gift/gift-list";
import { listPublicGifts } from "@/lib/db";
import type { PublicGift } from "@/types/wedding";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Senarai Hadiah | Aiman & Atiqah",
  description: "Senarai hadiah perkahwinan Aiman dan Atiqah.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function GiftPage() {
  let gifts: PublicGift[] = [];
  let loadError = false;
  try {
    gifts = await listPublicGifts();
  } catch (error) {
    console.error("Public gift list could not be loaded", error);
    loadError = true;
  }

  return (
    <main className="gift-page">
      <section className="gift-hero">
        <div className="gift-hero-decoration" aria-hidden="true" />
        <div className="gift-hero-copy">
          <p className="eyebrow">Dengan penuh kesyukuran</p>
          <h1>Senarai Hadiah</h1>
          <div className="ornament" aria-hidden="true">♡</div>
          <p>Kehadiran dan doa anda sudah cukup bermakna. Jika anda ingin menghadiahkan sesuatu, pilihlah daripada senarai kecil ini.</p>
        </div>
      </section>
      <section className="gift-list-section" aria-labelledby="gift-list-heading">
        <div className="gift-list-heading">
          <p className="eyebrow">Pilihan hadiah</p>
          <h2 id="gift-list-heading">Pilih dengan penuh kasih</h2>
          <p>Tekan “Tempah hadiah” supaya tetamu lain tahu hadiah tersebut telah dipilih.</p>
        </div>
        <GiftList gifts={gifts} loadError={loadError} />
      </section>
      <footer className="gift-footer">
        <p className="eyebrow">Terima kasih</p>
        <p>Setiap ingatan dan doa daripada anda amat kami hargai.</p>
      </footer>
    </main>
  );
}
