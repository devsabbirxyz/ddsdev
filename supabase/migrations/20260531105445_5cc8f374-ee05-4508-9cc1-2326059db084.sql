-- ============================================================
-- Extensions & helpers
-- ============================================================
create extension if not exists "pgcrypto";

-- Role enum-like via has_role security-definer fn (created later, after user_roles)

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ============================================================
-- USERS (mirrors auth.users)
-- ============================================================
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  phone         text,
  avatar_url    text,
  wallet_points integer not null default 0,
  is_banned     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);
grant select, insert, update on public.users to authenticated;
grant all on public.users to service_role;
alter table public.users enable row level security;
create policy "users read own" on public.users for select to authenticated using (auth.uid() = id);
create policy "users update own" on public.users for update to authenticated using (auth.uid() = id);
create trigger users_updated before update on public.users for each row execute function public.set_updated_at();

-- ============================================================
-- USER_ROLES + has_role()
-- ============================================================
create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin','super_admin','moderator','seller','affiliate')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role and is_active = true);
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin','super_admin') and is_active = true
  );
$$;

-- Admin policies on users / user_roles
create policy "admins read all users" on public.users for select to authenticated using (public.is_admin(auth.uid()));
create policy "admins update all users" on public.users for update to authenticated using (public.is_admin(auth.uid()));
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_en     text,
  slug        text not null unique,
  description text,
  icon_url    text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "public read categories" on public.categories for select using (true);
create policy "admins write categories" on public.categories for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- SELLERS (defined BEFORE products due to FK)
-- ============================================================
create table public.sellers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  store_name        text not null,
  store_description text,
  store_logo_url    text,
  store_cover_url   text,
  status            text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  balance           numeric not null default 0,
  total_withdrawn   numeric not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz
);
grant select on public.sellers to anon, authenticated;
grant insert, update on public.sellers to authenticated;
grant all on public.sellers to service_role;
alter table public.sellers enable row level security;
create policy "public read approved sellers" on public.sellers for select using (status = 'approved' or auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "seller update own" on public.sellers for update to authenticated using (auth.uid() = user_id);
create policy "admins manage sellers" on public.sellers for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger sellers_updated before update on public.sellers for each row execute function public.set_updated_at();

-- ============================================================
-- PRODUCTS
-- ============================================================
create table public.products (
  id                          uuid primary key default gen_random_uuid(),
  seller_id                   uuid references public.sellers(id) on delete set null,
  category_id                 uuid references public.categories(id) on delete set null,
  title                       text not null,
  title_en                    text,
  slug                        text not null unique,
  short_description           text,
  short_description_en        text,
  long_description            text,
  long_description_en         text,
  regular_price               numeric,
  offer_price                 numeric,
  delivery_type               text not null check (delivery_type in ('account','subscription','downloadable','method','text_link')),
  delivery_content            text,
  subscription_input_label    text,
  subscription_input_label_en text,
  video_url                   text,
  seo_title                   text,
  seo_description             text,
  is_variant                  boolean not null default false,
  is_active                   boolean not null default true,
  is_featured                 boolean not null default false,
  is_new_arrival              boolean not null default false,
  is_best_seller              boolean not null default false,
  status                      text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason            text,
  total_sales                 integer not null default 0,
  total_reviews               integer not null default 0,
  average_rating              numeric not null default 0,
  view_count                  integer not null default 0,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read approved products" on public.products for select using (
  (status = 'approved' and is_active = true)
  or exists (select 1 from public.sellers s where s.id = products.seller_id and s.user_id = auth.uid())
  or public.is_admin(auth.uid())
);
create policy "sellers insert own products" on public.products for insert to authenticated with check (
  exists (select 1 from public.sellers s where s.id = products.seller_id and s.user_id = auth.uid())
  or public.is_admin(auth.uid())
);
create policy "sellers update own products" on public.products for update to authenticated using (
  exists (select 1 from public.sellers s where s.id = products.seller_id and s.user_id = auth.uid())
  or public.is_admin(auth.uid())
);
create policy "admins delete products" on public.products for delete to authenticated using (public.is_admin(auth.uid()));
create index on public.products (status, is_active);
create index on public.products (seller_id);
create index on public.products (category_id);
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();

-- ============================================================
-- PRODUCT_IMAGES
-- ============================================================
create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url  text not null,
  is_main    boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;
grant all on public.product_images to service_role;
alter table public.product_images enable row level security;
create policy "public read product_images" on public.product_images for select using (true);
create policy "owners write product_images" on public.product_images for all to authenticated
  using (
    exists (select 1 from public.products p join public.sellers s on s.id = p.seller_id where p.id = product_id and s.user_id = auth.uid())
    or public.is_admin(auth.uid())
  )
  with check (
    exists (select 1 from public.products p join public.sellers s on s.id = p.seller_id where p.id = product_id and s.user_id = auth.uid())
    or public.is_admin(auth.uid())
  );

-- ============================================================
-- PRODUCT_VARIANTS
-- ============================================================
create table public.product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  label         text not null,
  label_en      text,
  regular_price numeric not null,
  offer_price   numeric,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "public read variants" on public.product_variants for select using (true);
create policy "owners write variants" on public.product_variants for all to authenticated
  using (
    exists (select 1 from public.products p join public.sellers s on s.id = p.seller_id where p.id = product_id and s.user_id = auth.uid())
    or public.is_admin(auth.uid())
  )
  with check (
    exists (select 1 from public.products p join public.sellers s on s.id = p.seller_id where p.id = product_id and s.user_id = auth.uid())
    or public.is_admin(auth.uid())
  );

-- ============================================================
-- PRODUCT_ACCOUNTS (sensitive — admin only)
-- ============================================================
create table public.product_accounts (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  username   text,
  password   text,
  extra_info text,
  is_sold    boolean not null default false,
  sold_at    timestamptz,
  order_id   uuid, -- FK added after orders
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.product_accounts to authenticated;
grant all on public.product_accounts to service_role;
alter table public.product_accounts enable row level security;
create policy "admins manage product_accounts" on public.product_accounts for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create index on public.product_accounts (product_id, is_sold);

-- ============================================================
-- PRODUCT_VIEW_LOGS (anyone insert; admin read)
-- ============================================================
create table public.product_view_logs (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  session_id text,
  created_at timestamptz not null default now()
);
grant insert on public.product_view_logs to anon, authenticated;
grant select on public.product_view_logs to authenticated;
grant all on public.product_view_logs to service_role;
alter table public.product_view_logs enable row level security;
create policy "anyone log views" on public.product_view_logs for insert to anon, authenticated with check (true);
create policy "admins read view_logs" on public.product_view_logs for select to authenticated using (public.is_admin(auth.uid()));
create index on public.product_view_logs (product_id);

-- ============================================================
-- ORDERS
-- ============================================================
create table public.orders (
  id                   uuid primary key default gen_random_uuid(),
  order_number         text not null unique,
  user_id              uuid references auth.users(id) on delete set null,
  product_id           uuid references public.products(id) on delete set null,
  variant_id           uuid references public.product_variants(id) on delete set null,
  seller_id            uuid references public.sellers(id) on delete set null,
  product_title        text,
  variant_label        text,
  quantity             integer not null default 1,
  regular_price        numeric,
  offer_price          numeric,
  total_price          numeric not null,
  discount_amount      numeric not null default 0,
  wallet_points_used   integer not null default 0,
  wallet_points_earned integer,
  coupon_code          text,
  customer_name        text not null,
  customer_email       text not null,
  customer_phone       text not null,
  customer_input       text,
  payment_method       text not null,
  payment_type         text,
  transaction_id       text,
  status               text not null default 'pending' check (status in ('pending','approved','rejected')),
  delivery_status      text not null default 'pending' check (delivery_status in ('pending','delivered','rejected')),
  delivery_content     text,
  rejection_reason     text,
  is_reviewed          boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "users read own orders" on public.orders for select to authenticated using (
  auth.uid() = user_id
  or exists (select 1 from public.sellers s where s.id = orders.seller_id and s.user_id = auth.uid())
  or public.is_admin(auth.uid())
);
create policy "users create orders" on public.orders for insert to authenticated with check (auth.uid() = user_id);
create policy "admins update orders" on public.orders for update to authenticated using (
  public.is_admin(auth.uid())
  or exists (select 1 from public.sellers s where s.id = orders.seller_id and s.user_id = auth.uid())
);
create index on public.orders (user_id);
create index on public.orders (seller_id);
create index on public.orders (status);
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();

-- Back-fill FK on product_accounts
alter table public.product_accounts
  add constraint product_accounts_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete set null;

-- ============================================================
-- SELLER_APPLICATIONS
-- ============================================================
create table public.seller_applications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  store_name        text not null,
  store_description text,
  phone             text not null,
  email             text not null,
  product_types     text,
  status            text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason  text,
  created_at        timestamptz not null default now()
);
grant select, insert on public.seller_applications to authenticated;
grant all on public.seller_applications to service_role;
alter table public.seller_applications enable row level security;
create policy "users read own seller_apps" on public.seller_applications for select to authenticated using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "users create seller_apps" on public.seller_applications for insert to authenticated with check (auth.uid() = user_id);
create policy "admins manage seller_apps" on public.seller_applications for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- SELLER_WITHDRAWALS
-- ============================================================
create table public.seller_withdrawals (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid not null references public.sellers(id) on delete cascade,
  amount           numeric not null,
  payment_method   text not null,
  account_number   text not null,
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  processed_at     timestamptz,
  created_at       timestamptz not null default now()
);
grant select, insert on public.seller_withdrawals to authenticated;
grant all on public.seller_withdrawals to service_role;
alter table public.seller_withdrawals enable row level security;
create policy "seller read own withdrawals" on public.seller_withdrawals for select to authenticated using (
  exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid())
  or public.is_admin(auth.uid())
);
create policy "seller create withdrawals" on public.seller_withdrawals for insert to authenticated with check (
  exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid())
);
create policy "admins manage withdrawals" on public.seller_withdrawals for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- AFFILIATE_APPLICATIONS
-- ============================================================
create table public.affiliate_applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  full_name        text not null,
  phone            text not null,
  email            text not null,
  social_links     text,
  reason           text,
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  created_at       timestamptz not null default now()
);
grant select, insert on public.affiliate_applications to authenticated;
grant all on public.affiliate_applications to service_role;
alter table public.affiliate_applications enable row level security;
create policy "users read own aff_apps" on public.affiliate_applications for select to authenticated using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "users create aff_apps" on public.affiliate_applications for insert to authenticated with check (auth.uid() = user_id);
create policy "admins manage aff_apps" on public.affiliate_applications for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- AFFILIATES
-- ============================================================
create table public.affiliates (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  referral_code   text not null unique,
  status          text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  balance         numeric not null default 0,
  total_withdrawn numeric not null default 0,
  commission_rate numeric not null default 5,
  created_at      timestamptz not null default now()
);
grant select on public.affiliates to authenticated;
grant all on public.affiliates to service_role;
alter table public.affiliates enable row level security;
create policy "users read own affiliate" on public.affiliates for select to authenticated using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "admins manage affiliates" on public.affiliates for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- AFFILIATE_REFERRALS
-- ============================================================
create table public.affiliate_referrals (
  id                uuid primary key default gen_random_uuid(),
  affiliate_id      uuid not null references public.affiliates(id) on delete cascade,
  order_id          uuid references public.orders(id) on delete set null,
  commission_amount numeric not null default 0,
  status            text not null default 'pending' check (status in ('pending','approved','paid')),
  created_at        timestamptz not null default now()
);
grant select on public.affiliate_referrals to authenticated;
grant all on public.affiliate_referrals to service_role;
alter table public.affiliate_referrals enable row level security;
create policy "affiliate read own referrals" on public.affiliate_referrals for select to authenticated using (
  exists (select 1 from public.affiliates a where a.id = affiliate_id and a.user_id = auth.uid())
  or public.is_admin(auth.uid())
);
create policy "admins manage referrals" on public.affiliate_referrals for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create index on public.affiliate_referrals (affiliate_id);

-- ============================================================
-- AFFILIATE_WITHDRAWALS
-- ============================================================
create table public.affiliate_withdrawals (
  id               uuid primary key default gen_random_uuid(),
  affiliate_id     uuid not null references public.affiliates(id) on delete cascade,
  amount           numeric not null,
  payment_method   text not null,
  account_number   text not null,
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  processed_at     timestamptz,
  created_at       timestamptz not null default now()
);
grant select, insert on public.affiliate_withdrawals to authenticated;
grant all on public.affiliate_withdrawals to service_role;
alter table public.affiliate_withdrawals enable row level security;
create policy "aff read own withdrawals" on public.affiliate_withdrawals for select to authenticated using (
  exists (select 1 from public.affiliates a where a.id = affiliate_id and a.user_id = auth.uid())
  or public.is_admin(auth.uid())
);
create policy "aff create withdrawals" on public.affiliate_withdrawals for insert to authenticated with check (
  exists (select 1 from public.affiliates a where a.id = affiliate_id and a.user_id = auth.uid())
);
create policy "admins manage aff_withdrawals" on public.affiliate_withdrawals for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- PAYMENT_METHODS
-- ============================================================
create table public.payment_methods (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  name_en             text,
  account_type        text,
  send_type           text,
  account_number      text,
  instructions        text,
  instructions_en     text,
  api_key             text,
  has_automatic       boolean not null default false,
  is_manual_active    boolean not null default true,
  is_automatic_active boolean not null default false,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now()
);
grant select on public.payment_methods to anon, authenticated;
grant insert, update, delete on public.payment_methods to authenticated;
grant all on public.payment_methods to service_role;
alter table public.payment_methods enable row level security;
create policy "public read payment_methods" on public.payment_methods for select using (true);
create policy "admins manage payment_methods" on public.payment_methods for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- WALLET_TRANSACTIONS
-- ============================================================
create table public.wallet_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  points      integer not null,
  type        text not null check (type in ('earn','redeem','bonus','manual','refund','admin_adjust')),
  order_id    uuid references public.orders(id) on delete set null,
  description text,
  created_at  timestamptz not null default now()
);
grant select on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;
create policy "users read own wallet_tx" on public.wallet_transactions for select to authenticated using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "admins manage wallet_tx" on public.wallet_transactions for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create index on public.wallet_transactions (user_id, created_at desc);

-- ============================================================
-- COUPONS
-- ============================================================
create table public.coupons (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  discount_type     text not null check (discount_type in ('percentage','fixed')),
  discount_value    numeric not null,
  minimum_order     numeric not null default 0,
  max_uses          integer,
  max_uses_per_user integer,
  used_count        integer not null default 0,
  applies_to        text not null default 'all' check (applies_to in ('all','categories','products')),
  start_date        timestamptz,
  end_date          timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);
grant select on public.coupons to anon, authenticated;
grant insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "public read active coupons" on public.coupons for select using (is_active = true or public.is_admin(auth.uid()));
create policy "admins manage coupons" on public.coupons for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- COUPON_USAGE
-- ============================================================
create table public.coupon_usage (
  id              uuid primary key default gen_random_uuid(),
  coupon_id       uuid not null references public.coupons(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  order_id        uuid references public.orders(id) on delete set null,
  discount_amount numeric not null default 0,
  created_at      timestamptz not null default now()
);
grant select on public.coupon_usage to authenticated;
grant all on public.coupon_usage to service_role;
alter table public.coupon_usage enable row level security;
create policy "users read own coupon_usage" on public.coupon_usage for select to authenticated using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "admins manage coupon_usage" on public.coupon_usage for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create index on public.coupon_usage (coupon_id, user_id);

-- ============================================================
-- SUPPORT_TICKETS
-- ============================================================
create table public.support_tickets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ticket_number text not null unique,
  subject       text not null,
  category      text not null default 'general',
  status        text not null default 'open' check (status in ('open','closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);
grant select, insert, update on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;
create policy "users read own tickets" on public.support_tickets for select to authenticated using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "users create tickets" on public.support_tickets for insert to authenticated with check (auth.uid() = user_id);
create policy "users/admins update tickets" on public.support_tickets for update to authenticated using (auth.uid() = user_id or public.is_admin(auth.uid()));
create trigger tickets_updated before update on public.support_tickets for each row execute function public.set_updated_at();

-- ============================================================
-- TICKET_MESSAGES (realtime)
-- ============================================================
create table public.ticket_messages (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid not null references public.support_tickets(id) on delete cascade,
  sender_id      uuid not null references auth.users(id) on delete cascade,
  message        text not null,
  is_admin_reply boolean not null default false,
  created_at     timestamptz not null default now()
);
grant select, insert on public.ticket_messages to authenticated;
grant all on public.ticket_messages to service_role;
alter table public.ticket_messages enable row level security;
create policy "ticket owners read messages" on public.ticket_messages for select to authenticated using (
  exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin(auth.uid())))
);
create policy "ticket owners send messages" on public.ticket_messages for insert to authenticated with check (
  auth.uid() = sender_id
  and exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin(auth.uid())))
);
create index on public.ticket_messages (ticket_id);
alter publication supabase_realtime add table public.ticket_messages;

-- ============================================================
-- NOTIFICATIONS (realtime)
-- ============================================================
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  message    text not null,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "users read own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "users mark notifications read" on public.notifications for update to authenticated using (auth.uid() = user_id);
create policy "admins manage notifications" on public.notifications for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create index on public.notifications (user_id, is_read);
alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  review_text text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  unique (order_id, user_id)
);
grant select on public.reviews to anon, authenticated;
grant insert, update on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "public read active reviews" on public.reviews for select using (is_active = true or auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "users insert own reviews" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own reviews" on public.reviews for update to authenticated using (auth.uid() = user_id or public.is_admin(auth.uid()));
create index on public.reviews (product_id, is_active);
create trigger reviews_updated before update on public.reviews for each row execute function public.set_updated_at();

-- ============================================================
-- SITE_SETTINGS
-- ============================================================
create table public.site_settings (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      text,
  group_name text,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "public read site_settings" on public.site_settings for select using (true);
create policy "admins manage site_settings" on public.site_settings for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- HERO_SLIDES / OFFER_SLIDES / REVIEW_SLIDES / OFFERS
-- ============================================================
create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null, link_url text, alt_text text,
  sort_order integer not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.hero_slides to anon, authenticated;
grant insert, update, delete on public.hero_slides to authenticated;
grant all on public.hero_slides to service_role;
alter table public.hero_slides enable row level security;
create policy "public read hero_slides" on public.hero_slides for select using (true);
create policy "admins manage hero_slides" on public.hero_slides for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.offer_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null, link_url text, alt_text text,
  sort_order integer not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.offer_slides to anon, authenticated;
grant insert, update, delete on public.offer_slides to authenticated;
grant all on public.offer_slides to service_role;
alter table public.offer_slides enable row level security;
create policy "public read offer_slides" on public.offer_slides for select using (true);
create policy "admins manage offer_slides" on public.offer_slides for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.review_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  sort_order integer not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.review_slides to anon, authenticated;
grant insert, update, delete on public.review_slides to authenticated;
grant all on public.review_slides to service_role;
alter table public.review_slides enable row level security;
create policy "public read review_slides" on public.review_slides for select using (true);
create policy "admins manage review_slides" on public.review_slides for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null, title_en text,
  image_url text not null, link_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.offers to anon, authenticated;
grant insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;
alter table public.offers enable row level security;
create policy "public read offers" on public.offers for select using (true);
create policy "admins manage offers" on public.offers for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- OFFER_BANNER_TIMER / POPUP_SETTINGS
-- ============================================================
create table public.offer_banner_timer (
  id             uuid primary key default gen_random_uuid(),
  is_active      boolean not null default false,
  end_time       timestamptz not null,
  end_message    text,
  end_message_en text,
  updated_at     timestamptz not null default now()
);
grant select on public.offer_banner_timer to anon, authenticated;
grant insert, update, delete on public.offer_banner_timer to authenticated;
grant all on public.offer_banner_timer to service_role;
alter table public.offer_banner_timer enable row level security;
create policy "public read banner_timer" on public.offer_banner_timer for select using (true);
create policy "admins manage banner_timer" on public.offer_banner_timer for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.popup_settings (
  id                 uuid primary key default gen_random_uuid(),
  is_active          boolean not null default false,
  heading            text, heading_en text,
  sub_text           text, sub_text_en text,
  button_text        text, button_text_en text,
  button_link        text default '/shop',
  image_url          text,
  coupon_code        text,
  show_timer         boolean not null default true,
  timer_minutes      integer not null default 30,
  show_delay_seconds integer not null default 5,
  repeat_after_days  integer not null default 3,
  show_on            text not null default 'all',
  updated_at         timestamptz not null default now()
);
grant select on public.popup_settings to anon, authenticated;
grant insert, update, delete on public.popup_settings to authenticated;
grant all on public.popup_settings to service_role;
alter table public.popup_settings enable row level security;
create policy "public read popup" on public.popup_settings for select using (true);
create policy "admins manage popup" on public.popup_settings for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============================================================
-- NEWSLETTER_SUBSCRIBERS
-- ============================================================
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;
create policy "anyone subscribe" on public.newsletter_subscribers for insert to anon, authenticated with check (true);
create policy "admins read subscribers" on public.newsletter_subscribers for select to authenticated using (public.is_admin(auth.uid()));
create policy "admins delete subscribers" on public.newsletter_subscribers for delete to authenticated using (public.is_admin(auth.uid()));

-- ============================================================
-- CONTENT: BLOG_POSTS / FAQ / PAGES
-- ============================================================
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null, title_en text,
  short_description text, short_description_en text,
  content text, content_en text,
  thumbnail_url text,
  seo_title text, seo_description text,
  is_published boolean not null default false,
  is_featured  boolean not null default false,
  view_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;
alter table public.blog_posts enable row level security;
create policy "public read published posts" on public.blog_posts for select using (is_published = true or public.is_admin(auth.uid()));
create policy "admins manage posts" on public.blog_posts for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger blog_updated before update on public.blog_posts for each row execute function public.set_updated_at();

create table public.faq_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, name_en text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.faq_categories to anon, authenticated;
grant insert, update, delete on public.faq_categories to authenticated;
grant all on public.faq_categories to service_role;
alter table public.faq_categories enable row level security;
create policy "public read faq_cats" on public.faq_categories for select using (true);
create policy "admins manage faq_cats" on public.faq_categories for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.faq_categories(id) on delete set null,
  question text not null, question_en text,
  answer text not null, answer_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.faqs to anon, authenticated;
grant insert, update, delete on public.faqs to authenticated;
grant all on public.faqs to service_role;
alter table public.faqs enable row level security;
create policy "public read active faqs" on public.faqs for select using (is_active = true or public.is_admin(auth.uid()));
create policy "admins manage faqs" on public.faqs for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null, title_en text,
  content text, content_en text,
  seo_title text, seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
grant select on public.pages to anon, authenticated;
grant insert, update, delete on public.pages to authenticated;
grant all on public.pages to service_role;
alter table public.pages enable row level security;
create policy "public read pages" on public.pages for select using (true);
create policy "admins manage pages" on public.pages for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger pages_updated before update on public.pages for each row execute function public.set_updated_at();

-- ============================================================
-- TRIGGER: auto-create public.users row on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),
  ('offer-slides', 'offer-slides', true),
  ('admin-uploads', 'admin-uploads', true)
on conflict (id) do nothing;

create policy "public read product-images" on storage.objects for select using (bucket_id = 'product-images');
create policy "auth upload product-images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');
create policy "auth update product-images" on storage.objects for update to authenticated using (bucket_id = 'product-images');
create policy "auth delete product-images" on storage.objects for delete to authenticated using (bucket_id = 'product-images');

create policy "public read offer-slides" on storage.objects for select using (bucket_id = 'offer-slides');
create policy "admin upload offer-slides" on storage.objects for insert to authenticated with check (bucket_id = 'offer-slides' and public.is_admin(auth.uid()));
create policy "admin update offer-slides" on storage.objects for update to authenticated using (bucket_id = 'offer-slides' and public.is_admin(auth.uid()));
create policy "admin delete offer-slides" on storage.objects for delete to authenticated using (bucket_id = 'offer-slides' and public.is_admin(auth.uid()));

create policy "public read admin-uploads" on storage.objects for select using (bucket_id = 'admin-uploads');
create policy "admin upload admin-uploads" on storage.objects for insert to authenticated with check (bucket_id = 'admin-uploads' and public.is_admin(auth.uid()));
create policy "admin update admin-uploads" on storage.objects for update to authenticated using (bucket_id = 'admin-uploads' and public.is_admin(auth.uid()));
create policy "admin delete admin-uploads" on storage.objects for delete to authenticated using (bucket_id = 'admin-uploads' and public.is_admin(auth.uid()));