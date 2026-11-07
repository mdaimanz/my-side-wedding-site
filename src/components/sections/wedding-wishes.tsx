"use client";

import { useEffect, useState } from "react";
import { WeddingWishesMarquee } from "./wedding-wishes-marquee";
import { normalizeWeddingWishes } from "@/lib/wishes";
import type { WeddingWish } from "@/types/wedding";

type WishesState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; wishes: WeddingWish[] };

export function WeddingWishes() {
  const [state, setState] = useState<WishesState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    async function loadWishes() {
      try {
        const response = await fetch("/api/wishes", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Wishes request failed");
        const data: unknown = await response.json();
        if (!data || typeof data !== "object" || !("wishes" in data) || !Array.isArray(data.wishes)) {
          throw new Error("Invalid wishes response");
        }
        if (!disposed) setState({ status: "ready", wishes: normalizeWeddingWishes(data.wishes) });
      } catch {
        if (!disposed) setState({ status: "error" });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadWishes();
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  return (
    <section className="section wedding-wishes-section" id="ucapan" aria-labelledby="wishes-heading">
      <div className="section-heading wishes-heading">
        <p className="eyebrow">Titipan kasih</p>
        <h2 id="wishes-heading">Ucapan &amp; Doa</h2>
        <p>Setiap ucapan dan doa menjadi kenangan indah buat kami.</p>
        <div className="ornament" aria-hidden="true">♡</div>
      </div>
      <div className="wishes-content" aria-busy={state.status === "loading"}>
        {state.status === "loading" && <p className="wishes-state" role="status">Memuatkan ucapan dan doa…</p>}
        {state.status === "error" && (
          <div className="wishes-state wishes-error">
            <p role="alert">Ucapan belum dapat dimuatkan. Sila cuba lagi sebentar.</p>
            <button className="button button-secondary" type="button" onClick={() => {
              setState({ status: "loading" });
              setAttempt((previous) => previous + 1);
            }}>Cuba lagi</button>
          </div>
        )}
        {state.status === "ready" && <WeddingWishesMarquee wishes={state.wishes} />}
      </div>
    </section>
  );
}
