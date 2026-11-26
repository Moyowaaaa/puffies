# Puffies — POS system scope & wireframe reference

Wireframe file: `puffies-restore.html` (combined, all 5 apps in one file)
Deploy with `?app=kiosk`, `?app=till`, `?app=kitchen`, `?app=preorder`, `?app=admin` to hide nav and load a single screen
Last updated: 2026-11-20

---

## Context

Building the till/kitchen/pre-order/kiosk/admin system for a **30-day daily Puffies pop-up**. The old Airtable-based till broke on 14 Nov 2026 (rate limiting), losing orders #52, #54, #57, #58; total day revenue was £705 (40 walk-in + 33 pre-orders). Moving to a **Supabase + Stripe backend**.

There are **five surfaces:**

1. Customer Kiosk (tablet on counter)
2. Staff Till
3. Kitchen Display
4. Pre-Order site
5. Admin panel

The interactive wireframe covers all five as a clickable prototype before build.

---

## Product & menu

Box names: **Small Box** (4 slots, £5) and **Large Box** (8 slots, £9).

**Sweet:** Biscoff, Cinnamon Sugar, Tiramisu, Ube Cream, Strawberry Shortcake, Pistachio
**Savoury:** Beef Brisket, Katsu Curry, Cheesy Melt

Menu will grow; these 9 flavours are the launch set only.

---

## Decisions locked

### Kiosk payment — pay at counter

Customer builds box on kiosk, gets a number. They come to the counter, staff take payment, tap confirm on till — order enters kitchen queue. Pending kiosk orders expire after 10 minutes unpaid. Staff can edit the order at the till if the customer changes their mind. A countdown shows orders nearing expiry.

### Box names — Small Box and Large Box

No numbers in the name. Flavour count shown visually through the slot mechanic. Removes the "is a 4-box 4 puffies or 4 flavours?" confusion.

### Admin — one page, one login, phone-friendly

Single password-protected URL. Full feature set:

- Add/edit/remove flavours; toggle on/off live; stock quantities with auto sold-out
- Manage box sizes and prices
- Full order history filterable by day/week/month/custom range, by walk-in/pre-order/kiosk; CSV export
- Revenue dashboard: today's total, revenue over time, units sold per flavour, average order value, busiest hours, pre-order vs walk-in split
- Customer list with repeat customer flagging and pre-order emails
- Live ops view: queue length, waiting/ready/collected counts, manual order pull-forward
- Automated emails: welcome, loyalty nudge (order 4), free box (order 5)
- Settings: slot capacity, auto-push window, popup dates

### Loyalty — email-based, carries across all popups

Optional email field at till and kiosk. Every order stamps against that email. At 4 orders: automated email sends "one more to go." At 5 orders: free small box, visible on the till when staff enter the customer's email. Stamps carry across all popups, not per-event.

### Kiosk orders appear on the till

Kiosk orders sit in a "pending" section. Staff see the full order and price before charging. One tap confirms payment and sends the order to the kitchen.

### Pre-order timing — auto-push 15 mins before slot

Pre-orders auto-enter the kitchen queue 15 minutes before their collection time. Search bar on kitchen/pre-order views lets staff manually pull forward an early arrival.

---

## Core ordering features (all surfaces)

- Visual box builder — pick size first, slots appear, tap slot, tap flavour to fill
- Flavour picker with live availability — sold out flavours grey out in real time
- Sweet + savoury mix freely within slots
- Running total updates as they build
- Add another box — multi-box orders in one transaction

---

## Wireframe screens

### 1. Kiosk (customer-facing self-service)

- Attract screen with idle auto-reset after 60 seconds
- Step 1 — choose box size (Small / Large)
- Step 2 — pick flavours by filling slots
- Step 3 — enter email for loyalty tracking (optional); on 5th order shows free box banner telling the customer to mention it at the counter
- Step 4 — order summary + "Place order →" CTA

### 2. Till (staff-facing POS)

**Tab bar:** Live queue / + New order tabs + search bar filtering queue cards in real time.

**Live queue — 3 columns:**

| Column | Meaning |
|---|---|
| Awaiting payment | Placed on kiosk; payment still needed |
| In Queue | Paid; waiting for kitchen |
| Ready to collect | Kitchen done; waiting for pickup |

Each queue card shows order number + customer name, box breakdown, 🎁 badge if a free box is owed, 📝 amber notes callout, and action buttons.

**New order — 5 steps:**

| Step | Content |
|---|---|
| 1 | Walk-in vs pre-order toggle |
| 2 | Box size |
| 3 | Flavour picker |
| 4 | Customer name + email + notes (optional) |
| 5 | Confirm & done screen |

### 3. Kitchen app

- Order number in large bold font next to customer name
- Box type and flavour list
- Amber notes callout when present
- Status buttons: In progress → Ready

### 4. Pre-order site

- 5-step flow: date → time slot → box size → flavours → confirm
- Shows upcoming slot availability

### 5. Admin panel

- Login screen (password: `puffies2024`)
- Overview: revenue charts, units sold, avg order value, peak hours
- Orders: full history with filters and CSV export
- Customers: repeat customer list with loyalty status
- Live Ops: real-time queue view
- Menu: flavour and box size management
- Emails: automated email templates (welcome, nudge, free box)
- Settings: capacity, dates, slot config

---

## Database schema (Supabase)

8 tables: `flavours`, `box_sizes`, `customers`, `orders`, `order_boxes`, `order_box_slots`, `email_templates`, `email_sends`

Full schema doc: `puffies-schema.md` (in scratchpad)

Enable Supabase Realtime on the `orders` table — powers live kitchen and till updates.

---

## Tech stack

- **Frontend:** Vanilla HTML/CSS/JS (no framework — wireframe-compatible)
- **Backend:** Supabase (Postgres + Realtime + Auth)
- **Payments:** Stripe (secret key in Netlify env as `STRIPE_SECRET_KEY`)
- **Email:** Supabase triggers → email provider (Resend or Postmark recommended)
- **Deploy:** Netlify — one file, `?app=` param routes to each screen

---

## Build phases

| Phase | Est. time | Scope |
|---|---|---|
| 1 | ~3 days | Supabase schema setup, Stripe integration, offline queue on till, real-time kitchen |
| 2 | ~4 days | Visual box builder wired to real data across all surfaces |
| 3 | ~3 days | Kiosk app + loyalty flow |
| 4 | ~2 days | Admin panel wired to real data + email triggers |
| 5 | ~2 days | Test week — stress test, team training, fixes |

---

## What's not built yet (wireframe → real build)

- Real Supabase backend (all wireframe state is in-memory JS)
- Stripe payment integration
- Loyalty data persistence
- Pre-order QR scan flow
- Kitchen ticket printer output
- Multi-device sync
- Offline-first local queue with sync status indicator
- End-of-day summary on till
