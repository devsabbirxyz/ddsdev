alter table public.sellers
  add column if not exists total_earnings numeric not null default 0,
  add column if not exists commission_rate numeric not null default 10;

alter table public.affiliates
  add column if not exists total_earnings numeric not null default 0,
  add column if not exists total_referrals integer not null default 0;

alter table public.orders
  add column if not exists seller_earning numeric not null default 0;