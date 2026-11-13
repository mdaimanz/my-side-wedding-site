export default function GiftLoading() {
  return (
    <main className="gift-page" aria-busy="true">
      <section className="gift-hero gift-loading-hero">
        <div className="gift-hero-decoration" aria-hidden="true" />
        <div className="gift-hero-copy">
          <p className="eyebrow">Dengan penuh kesyukuran</p>
          <h1>Senarai Hadiah</h1>
        </div>
      </section>
      <section className="gift-list-section">
        <p className="gift-loading-status" role="status">Memuatkan senarai hadiah…</p>
        <div className="gift-loading-grid" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => <div className="gift-loading-card" key={index} />)}
        </div>
      </section>
    </main>
  );
}
