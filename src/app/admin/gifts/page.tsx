import Link from "next/link";
import { logoutAdmin } from "@/app/actions/admin";
import { GiftAdminCard, GiftCreateForm } from "@/components/admin/gift-manager";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminGifts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminGiftsPage() {
  await requireAdmin();
  const gifts = await listAdminGifts();
  const activeGifts = gifts.filter((gift) => gift.active);
  const reservedGifts = activeGifts.filter((gift) => gift.reserved);

  return (
    <main className="admin-dashboard gift-admin-dashboard">
      <header>
        <div><p className="eyebrow">Pengurusan hadiah</p><h1>Senarai hadiah</h1></div>
        <div className="admin-header-actions">
          <Link className="button button-secondary" href="/admin">Lihat RSVP</Link>
          <form action={logoutAdmin}><button className="button button-secondary">Log keluar</button></form>
        </div>
      </header>
      <div className="summary-grid">
        <article><span>Hadiah aktif</span><strong>{activeGifts.length}</strong></article>
        <article><span>Ditempah</span><strong>{reservedGifts.length}</strong></article>
        <article><span>Masih tersedia</span><strong>{activeGifts.length - reservedGifts.length}</strong></article>
      </div>
      <GiftCreateForm />
      <section className="gift-admin-list" aria-labelledby="gift-admin-list-heading">
        <div className="gift-admin-list-heading">
          <div><p className="eyebrow">Katalog</p><h2 id="gift-admin-list-heading">Urus hadiah</h2></div>
          <p>Nombor susunan yang lebih kecil akan dipaparkan dahulu.</p>
        </div>
        {gifts.length > 0 ? gifts.map((gift) => (
          <GiftAdminCard key={`${gift.id}-${new Date(gift.updatedAt).getTime()}`} gift={gift} />
        )) : <p className="gift-admin-empty">Belum ada hadiah. Gunakan borang di atas untuk menambah hadiah pertama.</p>}
      </section>
    </main>
  );
}
