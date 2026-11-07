import { listWeddingWishes } from "@/lib/db";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    return Response.json({ wishes: await listWeddingWishes() }, { headers });
  } catch {
    console.error("Public wedding wishes could not be loaded.");
    return Response.json(
      { error: "Ucapan belum dapat dimuatkan. Sila cuba lagi sebentar." },
      { status: 503, headers },
    );
  }
}
