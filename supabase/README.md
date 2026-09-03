# Fact Desk Supabase bootstrap

Use a dedicated Supabase project for The Fact Desk. Do not share the database with another application.

Apply the SQL files in this order before adding runtime credentials to Cloudflare:

1. `schema.sql` — creates the editorial, ingest, subscriber, and automation tables.
2. `security.sql` — enables Row Level Security and the server-only exposed-schema posture.
3. `performance.sql` — adds the reviewed foreign-key/query indexes used by the pilot.
4. `automation_concurrency.sql` — enforces one active mutating automation run so two schedulers cannot process the same inbox simultaneously.

The pilot intentionally defines no `anon` or `authenticated` table policies. Browser clients do not query these tables directly. The server runtime uses the Supabase secret key and exposes only the application/API responses intended by the product.

After bootstrap, run Supabase security and performance advisors, seed only the source catalog, then exercise the ingest → auto-draft → deliberate review → publish lifecycle before production promotion. Do not seed demonstration stories into the real database.

Never expose `SUPABASE_SECRET_KEY` or the legacy `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_*` environment variable or client component.
