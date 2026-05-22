# DDS-Digital — Build Plan

**সাইট:** DDS-Digital (Dev Sabbir Soft)
**ট্যাগলাইন:** Bangladesh's Number 1 Digital Product Selling System
**স্ট্যাক:** TanStack Start + Lovable Cloud (Supabase) + Resend + SSLCommerz
**থিম:** Dark default, কালার `#0D0D1A` / `#FF6B35` / `#7B2FBE`, গ্লাসমরফিজম, বাংলা+English

---

## কেন ফেজ-ভিত্তিক?

আপনার PRD-তে ~৫০টা পেজ, ৩০+ টেবিল, ৪ ধরনের user role, পেমেন্ট গেটওয়ে, affiliate, seller, blog, support ticket, multi-language, multi-theme — এত কিছু একসাথে বানালে কোনোটাই ভালোভাবে কাজ করবে না। তাই আমি ৭টা ফেজে ভাগ করছি। প্রত্যেক ফেজ আলাদা message-এ approve করে এগোবো।

---

## Phase 1 — Foundation (এই message এ শুরু করব approve করলে)

**লক্ষ্য:** ডিজাইন সিস্টেম + ডাটাবেস + auth ready।

- Lovable Cloud enable + পুরো `supabase_schema.sql` migration (৩০+ টেবিল, RLS policies সহ)
  - `users` টেবিলের সাথে আলাদা `user_roles` টেবিল যোগ করব (security best-practice — role escalation আটকানোর জন্য)
  - সব টেবিলে RLS policy
- Design system সেটআপ `src/styles.css`-এ:
  - Dark default: bg `#0D0D1A`, primary orange `#FF6B35`, secondary purple `#7B2FBE`
  - Glassmorphism utility tokens (backdrop-blur, glass-card)
  - Gradient tokens (orange→purple)
  - Light mode tokens
- Bangla font (Hind Siliguri / Noto Sans Bengali) + English font pair
- i18n setup (বাংলা default, English toggle) — `react-i18next`
- Theme toggle (dark/light) — localStorage persist
- Root layout: Navbar (glass) + Footer skeleton
- Auth: Email/password signup + login + forgot password পেজ
- Protected route layout (`_authenticated`)

**Deliverable:** সাইট খুললে DDS-Digital branded homepage placeholder + login/signup কাজ করছে, ডাটাবেস পুরোপুরি ready।

---

## Phase 2 — Public Storefront

- Homepage সব section: Announcement bar, Hero slider, Trust bar (marquee mobile), Featured products, Special offer + countdown, How to Buy video, Reviews slider, Newsletter, Blog 3-card, Footer
- Shop page: sidebar category + grid + filter (price slider, new, best-selling) + search + load more + Recommended marquee
- Single Product page: image gallery, variants, wishlist, view count, Pay Now, related products, reviews
- Blog list + single
- FAQ, About, Privacy, Refund, Terms, 404, Developer page
- SEO: প্রতি route-এ আলাদা `head()` meta, JSON-LD

---

## Phase 3 — Customer Account + Cart + Checkout

- Customer dashboard, My Orders, Downloads, Wishlist, Reviews, Notifications, Coupons, Support tickets, Profile
- Cart + Checkout flow
- Coupon apply
- Manual payment flow (Nagad/Rocket/Upay — TrxID submit → pending)
- Order success / pending পেজ
- Resend email integration (order confirm, password reset, delivery)

---

## Phase 4 — Auto Delivery Engine

- ৫ ধরনের delivery handler: subscription, downloadable, method, account (auto username/password pool), text/link
- Order approval → auto delivery trigger
- Email with credentials/download link

---

## Phase 5 — Seller Panel

- Seller apply → admin approve flow
- Seller dashboard, products CRUD (pending → admin approve), orders, earnings, withdrawal request, profile

---

## Phase 6 — Affiliate System

- Apply page, referral code generation, referral link tracking (cookie/URL param)
- Affiliate dashboard, earnings, withdrawal

---

## Phase 7 — Admin Panel + Payment Integration

- Full admin panel: dashboard analytics, product/order/customer/seller/affiliate/coupon/blog/category management
- Payment settings, email templates, page manager, announcement bar, popup, hero slides editor
- Reports & analytics
- Support ticket management
- **SSLCommerz Bkash automatic** integration (webhook → auto verify → auto deliver)

---

## Technical Notes (developer reference)

- Backend: `createServerFn` from `@tanstack/react-start` — NO Supabase Edge Functions
- File-based routing: `src/routes/` flat dot convention (e.g. `shop.tsx`, `product.$slug.tsx`, `dashboard.orders.tsx`)
- Auth: separate `user_roles` table + `has_role()` SECURITY DEFINER function for RLS
- Data fetching: TanStack Query + `ensureQueryData` in loader + `useSuspenseQuery` in component
- Image storage: Supabase storage buckets (products, avatars, blog, hero, reviews)
- Secrets দরকার পরবর্তী phase-এ: `RESEND_API_KEY`, `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`
- Currency: BDT (৳), Bangla numerals optional

---

## এখন আপনি কী করবেন

1. এই plan-টা পড়ে approve করুন (নিচে "Implement plan" button)।
2. Approve করলে আমি **Phase 1 শুরু করব** — schema migration + design system + auth।
3. Phase 1 শেষ হলে preview দেখে confirm করলে Phase 2-এ যাব।

কোনো phase reorder করতে চাইলে বা কিছু বাদ দিতে/যোগ করতে চাইলে এখনই বলুন।
