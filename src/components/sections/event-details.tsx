import { wedding } from "@/data/wedding";

export function EventDetails() {
  return (
    <section className="section event-section" id="majlis">
      <div className="section-heading">
        <p className="eyebrow">Butiran Majlis</p>
        <h2>Hari yang dinantikan</h2>
      </div>
      <div className="event-card">
        <div className="event-date-mark">
          <strong>01</strong>
          <span>Januari</span>
          <small>2027</small>
        </div>
        <div className="event-information">
          <p className="event-day">{wedding.date.day}</p>
          <h3>{wedding.venue.name}</h3>
          <p>{wedding.venue.address}</p>
          <p className="event-time">{wedding.date.time}</p>
          <a className="event-map-link" href={wedding.venue.mapUrl} target="_blank" rel="noreferrer" aria-label="Buka lokasi di Google Maps" title="Buka lokasi di Google Maps">
            Buka Lokasi
          </a>
        </div>
      </div>
      <div className="schedule">
        {wedding.schedule.map((item, index) => (
          <article key={item.time}>
            <span className="schedule-index">0{index + 1}</span>
            <p>{item.time}</p>
            <h3>{item.title}</h3>
            <small>{item.description}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

