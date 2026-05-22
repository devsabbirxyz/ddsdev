# Admin Panel — Full CMS Plan

আপনার পুরো স্পেক একটা complete CMS — এটা একসাথে এক turn-এ বানানো সম্ভব না (কয়েক হাজার লাইন কোড, ২৫+ নতুন route, ১৫+ নতুন DB টেবিল)। তাই আমি **phase করে** বানাবো। আগে loading bug fix + foundation, তারপর প্রতি phase-এ আপনি confirm করলে এগোবো।

## Phase 0 — Loading Bug Fix (এই turn-এ)
- `src/routes/admin.tsx` এর `beforeLoad` সম্পূর্ণ remove করে component-এ auth check সরাবো (React Query দিয়ে cached)। এতে প্রতি navigation-এ re-check হবে না, sidebar click instant হবে।
- প্রতিটা admin sub-route এর query-তে `staleTime` দেবো।

## Phase 1 — Homepage Content CMS (Navbar/Hero/Trust/Offer/HowToBuy/Reviews/Newsletter/Footer)
নতুন টেবিল: `site_content` (key-value JSON), `trust_items`, `review_slides`, `how_to_buy`, `newsletter_subscribers`, `footer_links`, `payment_logos`।
Admin pages: `/admin/homepage` (tabs: Hero, Trust Bar, Offer Slider, How to Buy, Reviews, Newsletter, Footer)।
Frontend `index.tsx` এই tables থেকে data fetch করবে।

## Phase 2 — Products full CRUD
- Media: multi-image upload + main image checkbox + video URL
- Variants toggle (regular vs variant pricing)
- 5 delivery types: subscription / downloadable / method / account stock / text-link / **invite link (২ বার ব্যবহার)**
- Featured star (max 12), publish/hide, discount auto-calc
- Storage bucket: `product-media`
- নতুন টেবিল: `product_variants`, `product_media`, `product_delivery_config`, `product_account_stock`, `invite_link_usage`

## Phase 3 — Orders + Customers + Payments
- Order management (filter/search/CSV/status change/manual approve-reject)
- Customer list (ban/unban/CSV/order history)
- Payment settings: Bkash/Nagad/Rocket/Upay — Automatic API key + Manual (account number, type, instruction)
- Customer checkout flow with method picker + manual TxID submit
- নতুন টেবিল: `payment_methods`, `manual_payments`, `customer_bans`

## Phase 4 — Coupons + Categories + General Settings + Pages
- Coupon CRUD with scope (all/product/category), usage limits, dates, auto-generate
- Category CRUD with drag-drop order, navbar auto-sync
- General settings (site name/logo/favicon/SEO/currency/maintenance mode/social)
- Page Manager: About/Privacy/Refund/Terms/FAQ/Contact/Developer — rich text editor

## Phase 5 — Dashboard + Reports + Notifications
- Dashboard: time filter, 8 stats cards, 4 charts, recent orders, pending manual, top products
- Notification bell (orders/payments/affiliates/withdrawals/stock alerts)
- Reports: sales/orders/products/customers/affiliates/coupons + CSV/PDF export

## Phase 6 — Emails (Resend) + Support Tickets + Admin Profile
- 8 email templates with admin-editable subject/body, Resend API key field
- Support ticket system (customer side + admin reply)
- Admin profile + password change + login history

---

## What I'll do **right now** in this reply:
**শুধু Phase 0 (loading fix)।** এটা confirm হলে আপনি বলবেন কোন Phase আগে চান — আমি একটা একটা করে বানাবো। সব phase একসাথে চাইলে এটা **৬-৮টা আলাদা request** হিসেবে আসবে কারণ প্রতি phase-এ অনেক files + migrations লাগবে।

## প্রশ্ন
1. Phase 0 (just loading fix) এখন apply করি?
2. তারপর কোন Phase দিয়ে শুরু করব — **Phase 2 (Products)** নাকি **Phase 1 (Homepage CMS)**?
