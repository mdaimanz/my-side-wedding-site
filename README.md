# My Side Wedding Site

A Malaysian wedding invitation built with Next.js 16, React 19, Tailwind CSS 4, Vinext, and Cloudflare Workers. RSVP records are stored in MySQL through Cloudflare Hyperdrive, with a signed-cookie admin dashboard at `/admin`.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and replace every placeholder.
3. Run `database/schema.sql` against your MySQL database.
4. Create a Cloudflare Hyperdrive configuration and replace the placeholder ID in `wrangler.jsonc`.
5. Use `npm run dev:vinext` for the Cloudflare-compatible local server.

Edit the names, date, venue, schedule, and contact details in `src/data/wedding.ts` before publishing.

## Checks

- `npm run typecheck`
- `npm run lint`
- `npm run build:vinext`
