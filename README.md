# My Side Wedding Site

A Malaysian wedding invitation built with Next.js 16, React 19, Tailwind CSS 4, Vinext, and Cloudflare Workers. RSVP records are stored in MySQL through Cloudflare Hyperdrive, with a signed-cookie admin dashboard at `/admin`.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and replace every placeholder.
3. Run `database/schema.sql` against your MySQL database.
4. Create a Cloudflare Hyperdrive configuration and replace the placeholder ID in `wrangler.jsonc`.
5. Use `npm run dev:vinext` for the Cloudflare-compatible local server.

Edit the names, date, venue, schedule, and contact details in `src/data/wedding.ts` before publishing.

## Wedding wishes

The “Ucapan & Doa” section shows the five most recently updated, published wishes
from `guests_aiman`. Sign in at `/admin` and use **Terbitkan** or **Sembunyikan**
to control publication. Updating a guest's name or wish resets approval; changing
attendance alone preserves it. Guests see changes on their next page load.

Existing databases need the `display_wish` column. Check before applying the
existing migration (do not run it again if the column is present):

```sql
SHOW COLUMNS FROM guests_aiman LIKE 'display_wish';
```

If no column is returned, apply `database/migrations/001_add_display_wish.sql`.
Fresh databases created with `database/schema.sql` already include it.

`GET /api/wishes` returns only `{ wishes: [{ full_name, wish }] }`, with no-store
response caching. Publication reads also include a server-side timestamp to avoid
[Hyperdrive query caching](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/),
so publishing and hiding take effect on the next load. Database errors return a
generic 503 response. The carousel
loads once, supports retry, pauses on hover or with its pause button, and uses a
static layout for a single wish or reduced-motion preferences. It never seeds
example submissions or automatically publishes existing wishes.

## Checks

- `npm run typecheck`
- `npm test` (isolated wishes/API/admin checks; no live database writes)
- `npm run lint`
- `npm run build:vinext`
