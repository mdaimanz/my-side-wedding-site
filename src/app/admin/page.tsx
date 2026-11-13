import Link from "next/link";
import { logoutAdmin } from "@/app/actions/admin";
import { listGuests } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { WishVisibilityForm } from "@/components/admin/wish-visibility-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const guests = await listGuests();
  const attending = guests.filter((guest) => guest.attendance === "attending");
  const totalPax = attending.reduce((sum, guest) => sum + guest.guest_count, 0);

  return (
    <main className="admin-dashboard">
      <header>
        <div><p className="eyebrow">Pengurusan RSVP</p><h1>Senarai tetamu</h1></div>
        <div className="admin-header-actions">
          <Link className="button button-secondary" href="/admin/gifts">Urus hadiah</Link>
          <form action={logoutAdmin}><button className="button button-secondary">Log keluar</button></form>
        </div>
      </header>
      <div className="summary-grid"><article><span>Maklum balas</span><strong>{guests.length}</strong></article><article><span>Hadir</span><strong>{attending.length}</strong></article><article><span>Jumlah tetamu</span><strong>{totalPax}</strong></article></div>
      <p className="admin-wishes-note">Terbitkan ucapan yang ingin dikongsi. Lima ucapan diterbitkan yang terkini akan dipaparkan di laman jemputan. Perubahan nama atau ucapan memerlukan kelulusan semula.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nama</th><th>Telefon</th><th>Status</th><th>Tetamu</th><th>Ucapan</th><th>Paparan ucapan</th><th>Dikemas kini</th></tr></thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td>{guest.name}</td>
                <td>{guest.phone_number}</td>
                <td><span className={`status ${guest.attendance}`}>{guest.attendance === "attending" ? "Hadir" : "Tidak hadir"}</span></td>
                <td>{guest.guest_count}</td>
                <td>{guest.message || "—"}</td>
                <td>
                  <WishVisibilityForm
                    guestId={guest.id}
                    name={guest.name}
                    message={guest.message}
                    visible={Boolean(guest.display_wish)}
                  />
                </td>
                <td>{new Intl.DateTimeFormat("ms-MY", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(guest.updated_at))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {guests.length === 0 && <p className="empty-state">Belum ada maklum balas RSVP.</p>}
      </div>
    </main>
  );
}

