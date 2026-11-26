# Puffies — Supabase Schema

## Tables

---

### `flavours`

One row per flavour. Managed from the Admin → Menu tab.

| column | type | notes |
|---|---|---|
| `id` | text (PK) | slug e.g. `biscoff`, `ube`, `brisket` |
| `name` | text | Display name e.g. "Biscoff" |
| `type` | text | `sweet` or `savoury` |
| `note` | text | Short description e.g. "Biscoff syrup + crumbs" |
| `emoji` | text | Single emoji |
| `hex` | text | Brand hex colour e.g. `#B5651D` |
| `sold_out` | boolean | default `false` |
| `active` | boolean | default `true` — hide from menu without deleting |
| `sort_order` | integer | controls display order |
| `created_at` | timestamptz | auto |

---

### `box_sizes`

The size options available for purchase. Managed from Admin.

| column | type | notes |
|---|---|---|
| `id` | text (PK) | `small`, `large` |
| `name` | text | "Small Box", "Large Box" |
| `slots` | integer | number of puffie slots (4 or 8) |
| `price_gbp` | numeric(6,2) | e.g. `5.00`, `9.00` |
| `max_flavours` | integer | max distinct flavours allowed (2 for small, 4 for large) |
| `active` | boolean | default `true` |

---

### `customers`

Everyone who has ever ordered. Created on first order.

| column | type | notes |
|---|---|---|
| `id` | uuid (PK) | auto |
| `name` | text | first name or full name |
| `email` | text | unique |
| `phone` | text | optional |
| `loyalty_stamps` | integer | default `0` |
| `free_box_owed` | boolean | default `false` — set true when stamps hit 5 |
| `notes` | text | staff notes e.g. allergies |
| `joined_at` | timestamptz | auto |
| `last_order_at` | timestamptz | updated on each order |

---

### `orders`

One row per transaction (a customer may have multiple boxes in one order).

| column | type | notes |
|---|---|---|
| `id` | serial (PK) | the order number shown on receipts e.g. #67 |
| `source` | text | `kiosk`, `till`, `preorder` |
| `customer_id` | uuid (FK → customers) | nullable for anonymous walk-ins |
| `customer_name` | text | captured at checkout even if no account |
| `customer_email` | text | captured at checkout |
| `status` | text | `pending`, `in_queue`, `ready`, `collected`, `cancelled` |
| `total_gbp` | numeric(6,2) | sum of all boxes |
| `payment_method` | text | `card`, `cash`, `free` (loyalty redemption) |
| `stripe_payment_id` | text | Stripe PaymentIntent ID — nullable for cash |
| `loyalty_stamp_added` | boolean | default `false` — prevent double-stamping |
| `loyalty_redeemed` | boolean | default `false` — was this a free loyalty box |
| `note` | text | customer note e.g. "extra sauce on the side" |
| `pickup_slot` | text | pre-orders only e.g. `2:00pm` |
| `pickup_date` | date | pre-orders only |
| `created_at` | timestamptz | auto |
| `updated_at` | timestamptz | auto |

---

### `order_boxes`

Each box within an order. One order can have multiple boxes.

| column | type | notes |
|---|---|---|
| `id` | uuid (PK) | auto |
| `order_id` | integer (FK → orders) | |
| `box_size_id` | text (FK → box_sizes) | `small` or `large` |
| `price_gbp` | numeric(6,2) | snapshot of price at time of order |
| `created_at` | timestamptz | auto |

---

### `order_box_slots`

Each individual puffie slot within a box. 4 rows for a small box, 8 for a large.

| column | type | notes |
|---|---|---|
| `id` | uuid (PK) | auto |
| `order_box_id` | uuid (FK → order_boxes) | |
| `slot_index` | integer | 0-based position in the box |
| `flavour_id` | text (FK → flavours) | |

---

### `email_templates`

The automated emails managed from Admin → Emails tab.

| column | type | notes |
|---|---|---|
| `id` | text (PK) | `welcome`, `nudge`, `free_box` |
| `title` | text | e.g. "Loyalty nudge" |
| `trigger` | text | e.g. "After order 4" |
| `subject` | text | email subject line |
| `body` | text | email body — supports `{{first_name}}` |
| `delay_hours` | integer | hours after trigger before sending |
| `active` | boolean | default `true` |
| `updated_at` | timestamptz | auto |

---

### `email_sends`

Log of every automated email sent.

| column | type | notes |
|---|---|---|
| `id` | uuid (PK) | auto |
| `template_id` | text (FK → email_templates) | |
| `customer_id` | uuid (FK → customers) | |
| `sent_at` | timestamptz | auto |
| `status` | text | `sent`, `failed` |

---

## Key relationships

```
customers ──< orders ──< order_boxes ──< order_box_slots >── flavours
                              |
                          box_sizes
```

---

## Supabase Realtime — which tables to subscribe to

| Screen | Table | Why |
|---|---|---|
| Kitchen | `orders` | New tickets appear instantly |
| Kitchen | `orders` | Status changes (in_queue → ready → collected) |
| Till | `orders` | See when kiosk orders come in |
| Admin | `orders` | Live order count / revenue |

Enable Realtime on the `orders` table in Supabase dashboard.

---

## Row Level Security (RLS)

For the wireframe → real build, keep it simple:

- `flavours`, `box_sizes` — public read, authenticated write
- `orders`, `order_boxes`, `order_box_slots` — authenticated read/write (staff only)
- `customers` — authenticated read/write (staff only)
- `email_templates`, `email_sends` — authenticated read/write (admin only)

Use Supabase service role key on the backend only. Never expose it client-side.

---

## Notes for devs

- Stripe secret key is already in Netlify env as `STRIPE_SECRET_KEY` — do not hardcode
- Loyalty rule: every completed order adds 1 stamp. When `loyalty_stamps` hits 5, set `free_box_owed = true` and reset stamps to 0
- Pre-orders: `source = 'preorder'`, status starts as `pending` until pickup date, then moves to `in_queue` automatically
