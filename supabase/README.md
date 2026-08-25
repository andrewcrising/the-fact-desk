# Fact Desk Supabase bootstrap

Use a dedicated Supabase project for The Fact Desk. Do not share the database with another application.

Apply the SQL files in this order before adding production credentials to Vercel:

1. `schema.sql` — creates the editorial, ingest, subscriber, and automation tables.
2. `security.sql` — enables Row Level Security on every application table in the exposed `public` schema.

The MVP intentionally defines no `anon` or `authenticated` policies. Browser clients should not query these tables directly. The Next.js server uses the Supabase service role and exposes only the application/API responses intended by the product.

After bootstrap, run Supabase security and performance advisors, then seed the source catalog/demo data and exercise the ingest → draft → publish lifecycle before production promotion.

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_*` environment variable or client component.
