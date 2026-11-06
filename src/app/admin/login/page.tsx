import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");
  return <main className="admin-shell"><section className="admin-login"><p className="eyebrow">Pengurusan RSVP</p><h1>Log masuk admin</h1><p>Gunakan akaun pentadbir untuk melihat senarai tetamu.</p><LoginForm /></section></main>;
}

