# Site Blueprint

This document describes the reusable structure of this wedding invitation site: its technology choices, data flow, database connection, and suggested setup sequence for a new site built on the same foundation.

## Technology stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Application framework | Next.js 16, App Router | Routes, layouts, React Server Components, and Server Actions |
| UI | React 19 + TypeScript | Typed, component-based interface |
| Styling | Tailwind CSS 4 + `src/app/globals.css` | Utility styling and shared design tokens |
| Server deployment | Vinext, Vite, Cloudflare Workers | Runs the full Next.js application (including Server Actions) on Cloudflare |
| Database | MySQL + `mysql2` | Stores the current RSVP record for each phone number |
| Database connectivity | Cloudflare Hyperdrive | Provides Worker-compatible MySQL credentials and connection management |
| Authentication | Signed HTTP-only cookie using Web Crypto HMAC-SHA-256 | Protects the admin RSVP dashboard |
| Input validation | `libphonenumber-js` + server-side validation | Normalizes Malaysian phone numbers and validates RSVP data |
| Static assets | Next.js `public/` directory and local fonts | Decorative images, music, previews, and fonts |
| Tooling | ESLint, TypeScript, Wrangler | Linting, type safety, and Cloudflare deployment |

## Application architecture

```text
Guest browser
  └─ React invitation sections (`src/components/sections/`)
       └─ RSVP form
            └─ Next.js Server Action (`src/app/actions/rsvp.ts`)
                 └─ MySQL through Hyperdrive

Admin browser
  └─ `/admin/login` Server Action
       └─ signed, HTTP-only cookie
            └─ `/admin` protected Server Component
                 └─ MySQL guest list query
```

## Database connection and RSVP flow

### Connection mechanism

`src/lib/db.ts` imports the Cloudflare Workers environment at runtime and builds a `mysql2/promise` connection using the `HYPERDRIVE` binding:

```ts
const { env } = await import("cloudflare:workers");

return createConnection({
  host: env.HYPERDRIVE.host,
  user: env.HYPERDRIVE.user,
  password: env.HYPERDRIVE.password,
  database: env.HYPERDRIVE.database,
  port: env.HYPERDRIVE.port,
  disableEval: true,
});
```

- `wrangler.jsonc` binds a Cloudflare Hyperdrive configuration under the name `HYPERDRIVE`.
- In deployed Workers, Hyperdrive supplies the MySQL credentials; do **not** create production `MYSQL_*` variables.
- For local Vinext development, `.env` maps a local connection string to the same binding with `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`.
- Each database operation creates a connection and closes it in `finally`, including failed requests.
- `disableEval: true` is required for `mysql2` in the Workers runtime.

### Database schema

`database/schema.sql` creates a `guests` table. `phone_number` has a unique constraint, enabling one current RSVP record per number.

The RSVP Server Action validates form values, normalizes the phone number, then uses an `INSERT ... ON DUPLICATE KEY UPDATE` query. A later response from the same number updates the MySQL record rather than adding a duplicate.

> Hyperdrive does not support MySQL's prepared-statement protocol. The project uses `connection.query(sql, values)`, where `mysql2` safely interpolates the supplied values client-side.

### New-project database setup

1. Provision a MySQL database.
2. Run `database/schema.sql` against it.
3. Create a Cloudflare Hyperdrive configuration pointing to that database.
4. Replace the `HYPERDRIVE` ID in `wrangler.jsonc` with the new configuration ID.
5. Copy `.env.example` to `.env`, then supply a safe local MySQL connection string and a random `ADMIN_SESSION_SECRET` with at least 32 characters.
6. In Cloudflare Workers, add `ADMIN_SESSION_SECRET` through `wrangler secret put ADMIN_SESSION_SECRET`.

## File organization

```text
.
├── database/
│   └── schema.sql              # MySQL schema
├── design-reference/           # Design inspiration/reference images; not served to visitors
├── public/
│   ├── assets/                 # Public images, decorations, and music (`/assets/...` URLs)
│   └── og-preview.jpg          # Social sharing image
├── scripts/                    # One-off project automation, such as OG preview generation
├── src/
│   ├── app/                    # App Router routes, layout, global CSS, and Server Actions
│   │   ├── actions/            # Server-only mutations: RSVP and admin authentication
│   │   ├── admin/              # Protected admin dashboard and login route
│   │   ├── layout.tsx          # Root layout, metadata, and locally loaded fonts
│   │   ├── page.tsx            # Home-page section composition and ordering
│   │   └── globals.css         # Global styles and Tailwind import
│   ├── components/
│   │   ├── admin/              # Admin-specific UI
│   │   ├── layout/             # Shared page chrome
│   │   ├── sections/           # Complete content sections of the invitation
│   │   ├── ui/                 # Small reusable visual/interactive primitives
│   │   └── wedding/            # Domain-specific reusable components
│   ├── data/                   # Editable, site-specific content/data objects
│   ├── fonts/                  # Local font files registered in `layout.tsx`
│   ├── lib/                    # Server and shared logic: DB, auth, phone, and utilities
│   └── types/                  # Shared TypeScript domain types
├── .env.example                # Safe environment-variable template
├── wrangler.jsonc              # Cloudflare Worker and Hyperdrive binding configuration
├── vite.config.ts              # Vinext + Cloudflare Vite configuration
├── next.config.ts              # Standard Next.js development configuration
└── package.json                # Dependencies and npm scripts
```

## Reusing this structure for another site

1. Duplicate the repository and change `name` in `package.json` plus the Worker `name` in `wrangler.jsonc`.
2. Replace images, local fonts, metadata, public URLs, and content in `src/data/`.
3. Compose the new landing page by adding, removing, or reordering imports in `src/app/page.tsx`.
4. Build each full-width page block in `src/components/sections/`; put shared pieces in `src/components/ui/`.
5. Define the new domain schema in `database/schema.sql` and keep all query code in `src/lib/`.
6. Create Server Actions under `src/app/actions/` for validated server-side writes.
7. Create the MySQL database and a new Hyperdrive binding, then configure local and production secrets.
8. Use `npm run dev:vinext` to exercise the Cloudflare-compatible development path, `npm run build:vinext` to build, and `npm run deploy` to deploy the generated Worker.

## Security follow-ups before cloning the pattern

- Keep all credentials only in `.env` locally and Cloudflare Worker secrets in production; never commit them.
- Move admin username and password out of `src/lib/admin-auth.ts` and into Worker secrets before using this as a production template.
- Keep authentication checks and all database imports server-only; do not put secrets in `NEXT_PUBLIC_*` variables.
- Update the `wrangler.jsonc` Hyperdrive ID and all site metadata when starting a new project.
