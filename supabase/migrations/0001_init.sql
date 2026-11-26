-- Puffies POS — initial schema
-- Run once in the Supabase SQL Editor (or via `supabase db push`).
-- Safe to re-run: everything is IF NOT EXISTS.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────

create table if not exists public.flavours (
  id          text primary key,                    -- slug: biscoff, ube, brisket
  name        text not null,
  type        text not null check (type in ('sweet', 'savoury')),
  note        text not null default '',
  emoji       text not null default '',
  hex         text not null default '#1A4FA0',
  sold_out    boolean not null default false,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  -- Extension to the scope doc: the wireframe Admin → Menu edits quantities
  -- and auto-sold-outs them. The schema doc only had a sold_out flag.
  stock_qty   integer not null default 0 check (stock_qty >= 0),
  created_at  timestamptz not null default now()
);

create table if not exists public.box_sizes (
  id           text primary key,                   -- small | large
  name         text not null,
  slots        integer not null check (slots > 0),
  price_gbp    numeric(6,2) not null,
  max_flavours integer not null check (max_flavours > 0),
  active       boolean not null default true
);

create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null default '',
  email           text unique,
  phone           text,
  loyalty_stamps  integer not null default 0 check (loyalty_stamps between 0 and 4),
  free_box_owed   boolean not null default false,
  notes           text,
  joined_at       timestamptz not null default now(),
  last_order_at   timestamptz
);

create table if not exists public.orders (
  id                  bigint generated always as identity primary key, -- order # shown on receipts
  source              text not null check (source in ('kiosk', 'till', 'preorder')),
  customer_id         uuid references public.customers(id) on delete set null,
  customer_name       text not null default '',
  customer_email      text,
  status              text not null default 'pending'
                        check (status in ('pending', 'in_queue', 'ready', 'collected', 'cancelled')),
  total_gbp           numeric(6,2) not null default 0,
  payment_method      text check (payment_method in ('card', 'cash', 'free')),
  stripe_payment_id   text,
  loyalty_stamp_added boolean not null default false,
  loyalty_redeemed    boolean not null default false,
  note                text,
  pickup_slot         text,
  pickup_date         date,
  -- Kiosk orders expire 10 minutes after placement; set by the client.
  expires_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.order_boxes (
  id          uuid primary key default gen_random_uuid(),
  order_id    bigint not null references public.orders(id) on delete cascade,
  box_size_id text not null references public.box_sizes(id),
  price_gbp   numeric(6,2) not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.order_box_slots (
  id           uuid primary key default gen_random_uuid(),
  order_box_id uuid not null references public.order_boxes(id) on delete cascade,
  slot_index   integer not null check (slot_index >= 0),
  flavour_id   text not null references public.flavours(id),
  unique (order_box_id, slot_index)
);

create table if not exists public.email_templates (
  id          text primary key,                    -- welcome | nudge | free_box
  title       text not null,
  trigger     text not null,
  subject     text not null,
  body        text not null,
  delay_hours integer not null default 0,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table if not exists public.email_sends (
  id          uuid primary key default gen_random_uuid(),
  template_id text not null references public.email_templates(id),
  customer_id uuid not null references public.customers(id) on delete cascade,
  sent_at     timestamptz not null default now(),
  status      text not null default 'sent' check (status in ('sent', 'failed'))
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES + TRIGGERS
-- ─────────────────────────────────────────────────────────────

create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists orders_email_idx on public.orders (customer_email);
create index if not exists order_boxes_order_idx on public.order_boxes (order_id);
create index if not exists order_box_slots_box_idx on public.order_box_slots (order_box_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Public (anon) can read the menu and *place* orders, but cannot read
-- orders, customers, or emails. Staff (authenticated) can do everything.
-- The service role key bypasses RLS and stays server-side only.
-- ─────────────────────────────────────────────────────────────

alter table public.flavours          enable row level security;
alter table public.box_sizes         enable row level security;
alter table public.customers         enable row level security;
alter table public.orders            enable row level security;
alter table public.order_boxes       enable row level security;
alter table public.order_box_slots   enable row level security;
alter table public.email_templates   enable row level security;
alter table public.email_sends       enable row level security;

-- Menu: public read, staff write
drop policy if exists "menu public read" on public.flavours;
create policy "menu public read" on public.flavours for select to anon, authenticated using (true);
drop policy if exists "menu staff write" on public.flavours;
create policy "menu staff write" on public.flavours for all to authenticated using (true) with check (true);

drop policy if exists "sizes public read" on public.box_sizes;
create policy "sizes public read" on public.box_sizes for select to anon, authenticated using (true);
drop policy if exists "sizes staff write" on public.box_sizes;
create policy "sizes staff write" on public.box_sizes for all to authenticated using (true) with check (true);

-- Order placement: anon INSERT only. No anon SELECT/UPDATE — the till and
-- kitchen need an authenticated (staff) session.
drop policy if exists "orders public insert" on public.orders;
create policy "orders public insert" on public.orders for insert to anon, authenticated with check (true);
drop policy if exists "orders staff read" on public.orders;
create policy "orders staff read" on public.orders for select to authenticated using (true);
drop policy if exists "orders staff update" on public.orders;
create policy "orders staff update" on public.orders for update to authenticated using (true) with check (true);
drop policy if exists "orders staff delete" on public.orders;
create policy "orders staff delete" on public.orders for delete to authenticated using (true);

drop policy if exists "boxes public insert" on public.order_boxes;
create policy "boxes public insert" on public.order_boxes for insert to anon, authenticated with check (true);
drop policy if exists "boxes staff all" on public.order_boxes;
create policy "boxes staff all" on public.order_boxes for all to authenticated using (true) with check (true);

drop policy if exists "slots public insert" on public.order_box_slots;
create policy "slots public insert" on public.order_box_slots for insert to anon, authenticated with check (true);
drop policy if exists "slots staff all" on public.order_box_slots;
create policy "slots staff all" on public.order_box_slots for all to authenticated using (true) with check (true);

-- Customers + email: staff only
drop policy if exists "customers staff all" on public.customers;
create policy "customers staff all" on public.customers for all to authenticated using (true) with check (true);
drop policy if exists "templates staff all" on public.email_templates;
create policy "templates staff all" on public.email_templates for all to authenticated using (true) with check (true);
drop policy if exists "sends staff all" on public.email_sends;
create policy "sends staff all" on public.email_sends for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- REALTIME — powers the live till + kitchen
-- ─────────────────────────────────────────────────────────────

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
end $$;

-- ─────────────────────────────────────────────────────────────
-- SEED — launch menu, box sizes, email templates
-- ─────────────────────────────────────────────────────────────

insert into public.flavours (id, name, type, note, emoji, hex, sort_order, stock_qty) values
  ('biscoff',    'Biscoff',               'sweet',   'Biscoff syrup + crumbs',        '🍪', '#B5651D', 1, 12),
  ('cinnamon',   'Cinnamon Sugar',        'sweet',   'Inject syrup · cinnamon coat',  '🍂', '#C4882D', 2, 20),
  ('tiramisu',   'Tiramisu',              'sweet',   'Coffee + mascarpone',           '🍦', '#4A2C2A', 3, 8),
  ('ube',        'Ube Cream',             'sweet',   'Ube injection · piped cream',   '💜', '#7B3F6E', 4, 15),
  ('strawberry', 'Strawberry Shortcake',  'sweet',   'White choc · shortbread · berry','🍓', '#D4697A', 5, 6),
  ('pistachio',  'Pistachio',             'sweet',   'Pistachio drizzle + crumble',   '🌰', '#5C7A5C', 6, 18),
  ('brisket',    'Beef Brisket',          'savoury', 'Slow-cooked beef · jus',        '🥩', '#6B2D1A', 7, 0),
  ('katsu',      'Katsu Curry',           'savoury', 'Japanese curry sauce',          '🍛', '#C4882D', 8, 14),
  ('cheesy',     'Cheesy Melt',           'savoury', 'Melted cheese filling',         '🧀', '#D4A017', 9, 4)
on conflict (id) do nothing;

update public.flavours set sold_out = true where id = 'brisket' and stock_qty = 0;

insert into public.box_sizes (id, name, slots, price_gbp, max_flavours) values
  ('small', 'Small Box', 4, 5.00, 2),
  ('large', 'Large Box', 8, 9.00, 4)
on conflict (id) do nothing;

insert into public.email_templates (id, title, trigger, subject, body, delay_hours) values
  ('welcome',  'Welcome',       'On first order', 'Welcome to Puffies 🍡',
   'Hey {{first_name}} — thanks for your first box! You can grab another box at any of our pop-ups.', 0),
  ('nudge',    'Loyalty nudge', 'After order 4',  'One more box to go 👀',
   'Hey {{first_name}} — you’re one box away from a free Small Box. See you at the next pop-up.', 24),
  ('free_box', 'Free box',      'After order 5',  'Your free box is ready 🎁',
   'Hey {{first_name}} — your free Small Box is ready. Just mention this email at the counter.', 0)
on conflict (id) do nothing;
