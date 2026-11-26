# Puffies POS — Dev Handover Brief

Last updated: 2026-11-20

---

## What you're building

A point-of-sale system for **Puffies**, a pop-up dessert brand. The interactive wireframe (`puffies-restore.html`) covers all five screens — treat it as the spec. Your job is to wire the existing UI to a real Supabase backend and Stripe for payments.

No framework is required. The wireframe is vanilla HTML/CSS/JS and all the UI is already built. You're swapping hardcoded JS state for real Supabase calls.

---

## The 5 apps

| App | URL param | Who uses it | What it does |
|---|---|---|---|
| **Kiosk** | `?app=kiosk` | Customer | Self-service box builder on counter tablet. Customer picks size + flavours, enters optional email, places order. Order lands on till as "awaiting payment". |
| **Till** | `?app=till` | Staff | Main POS. Sees live queue in 3 columns (awaiting payment / in queue / ready to collect). Takes payment, confirms kiosk orders, creates walk-in orders, marks orders ready. |
| **Kitchen** | `?app=kitchen` | Kitchen staff | Incoming order tickets. Sees box + flavours per order, marks each as in progress → ready. |
| **Pre-Order** | `?app=preorder` | Customer (web) | Advance ordering with date/time slot selection. Orders auto-enter kitchen queue 15 mins before slot. |
| **Admin** | `?app=admin` | Owner | Password-protected dashboard. Revenue charts, order history, customer list, menu management (flavours on/off, stock), email templates, settings. |

---

## How they connect

```
Customer (Kiosk / Pre-Order)
        |
        v
   orders table (Supabase)
        |
   +----+----+
   v         v
 Till      Kitchen
(payment) (fulfillment)
   |
   v
 status: collected
   |
   v
 Admin (reporting)
```

1. **Kiosk / Pre-Order** → inserts row into `orders` with `status: 'pending'`
2. **Till** → sees pending kiosk orders; on payment confirmation sets `status: 'in_queue'`
3. **Kitchen** → subscribes to `orders` via Supabase Realtime; sees `in_queue` orders; sets `status: 'ready'`
4. **Till** → sees ready orders; staff calls customer; sets `status: 'collected'`
5. **Admin** → reads all order history for reporting

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (no framework) |
| Database | Supabase (Postgres) |
| Realtime | Supabase Realtime — subscribe to `orders` table on kitchen + till |
| Payments | Stripe — card payments via PaymentIntent API |
| Email | Supabase Edge Functions → Resend or Postmark |
| Hosting | Netlify — one HTML file, `?app=` param routes to each screen |

---

## Deployment

One HTML file. Each screen is deployed as a separate URL using the `?app=` URL param — this hides the nav and jumps straight to that screen on load.

| Screen | URL |
|---|---|
| Kiosk | `https://puffies.netlify.app/?app=kiosk` |
| Till | `https://puffies.netlify.app/?app=till` |
| Kitchen | `https://puffies.netlify.app/?app=kitchen` |
| Pre-Order | `https://puffies.netlify.app/?app=preorder` |
| Admin | `https://puffies.netlify.app/?app=admin` |

---

## Stripe

The **live Stripe secret key is already in Netlify** as the env var `STRIPE_SECRET_KEY`.

- Never hardcode it in any file
- Use it server-side only (Netlify Function or Edge Function)
- Flow: frontend creates PaymentIntent → Netlify Function calls Stripe with the secret key → returns `client_secret` → frontend confirms with `stripe.confirmCardPayment()`

---

## Schema

Full Supabase schema is in `puffies-schema.md`. Key points:

- 8 tables: `flavours`, `box_sizes`, `customers`, `orders`, `order_boxes`, `order_box_slots`, `email_templates`, `email_sends`
- Enable Realtime on the `orders` table
- Use Supabase service role key on backend only — never client-side

---

## Loyalty system

- Email is optional at checkout (till + kiosk)
- Every completed order stamps against that email (1 stamp per order in `customers.loyalty_stamps`)
- At 5 stamps: `free_box_owed = true`, stamps reset to 0
- When staff enter an email at the till and `free_box_owed = true`, a 🎁 banner shows — staff give a free small box, then clear the flag
- Automated emails fire at order 4 (nudge) and order 5 (free box notification) — triggered from Supabase Edge Functions

---

## Admin password

For the wireframe and initial build: `puffies2024`

Replace with Supabase Auth before go-live.

---

## Handover checklist

- [ ] `puffies-restore.html` — the full interactive wireframe (all 5 screens)
- [ ] `puffies-schema.md` — Supabase schema with all 8 tables, relationships, RLS rules, Realtime setup
- [ ] `puffies-scope.md` — full project scope and decisions
- [ ] This doc
