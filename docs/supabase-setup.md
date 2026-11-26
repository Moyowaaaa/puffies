# Supabase setup (Phase 1)

The app runs on mock data until both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Run these steps once per project.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. open **SQL Editor → New query**, paste all of [supabase/migrations/0001_init.sql](../supabase/migrations/0001_init.sql), and run it.

That creates the 8 tables, indexes, RLS policies, Realtime publication, and seeds the 9 launch flavours, both box sizes, and 3 email templates.

## 2. Create a staff user

Till / Kitchen / Admin are staff-only. In **Authentication → Users → Add user**, create a user with an email and password, then use those credentials on the staff sign-in screen. Kiosk and pre-order stay public.

The wireframe password `puffies2024` is not used — Supabase Auth replaces it.

## 3. Configure the app

```bash
cp .env.example .env.local
```

Fill in from **Project Settings → API**:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-OR-ANON-KEY
```

The anon key is public by design; RLS is what protects order/customer data. Never put the service role key or `STRIPE_SECRET_KEY` in a `VITE_` variable. `.env.local` is gitignored.

Restart `pnpm dev`. The nav shows **● LIVE** when Supabase is active, **● MOCK** otherwise. Flip mock/live anytime in **Admin → Settings** (stored in the browser — no env change needed).

## 4. Verify

1. Open `/kiosk`, build a box, place an order.
2. Open `/till` in another tab, sign in — the order appears under Awaiting payment with a live countdown.
3. Confirm payment → `/kitchen` shows the ticket (also signed in). Mark ready → the till's Ready column updates via Realtime.
4. `/admin` → Menu: change a stock quantity to 0 and confirm the flavour greys out in the kiosk. Admin is not linked in the nav — open it directly.

## What is live vs still mock

**Live:** orders, order boxes and slots (insert + status), stock quantities and sold-out flags, Realtime on `orders`, staff sign-in.

**Still mock / not started:** Stripe payments, loyalty stamping and customer upserts, email sending, CSV export, offline queue, kiosk order editing, end-of-day summary. Admin analytics still use the wireframe's hardcoded chart data.

## Security notes

- RLS lets anonymous users **insert** orders only — needed for the public kiosk/pre-order — but they cannot read or update any order. Add rate limiting (e.g. Cloudflare or Supabase WAF) before public launch.
- The client writes order totals directly. Before taking real card payments, move order creation into a server function that recomputes prices from `box_sizes` and writes with the service role key.
- The service role key belongs only in server-side Netlify/Edge functions alongside `STRIPE_SECRET_KEY`.
