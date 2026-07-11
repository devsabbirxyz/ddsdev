# Growth ও Conversion Features — Implementation Plan

৫টা ফিচার একসাথে অনেক বড় স্কোপ (schema migrations + cron jobs + UI + admin panels)। আমি এগুলো ২ phase-এ ভাগ করছি — যাতে quick wins আগে live হয়, complex ones পরে।

---

## Phase 1 — Quick Wins (এখনই করব, no schema change)

### 1. Flash Sale / Deal of the Day section
- হোমপেজে নতুন section: সবচেয়ে বেশি discount% আছে এমন top 4-6 products
- Countdown timer (আজ রাত ১১:৫৯ পর্যন্ত — daily reset)
- Urgency badge: "🔥 আজকের ডিল", stock left indicator
- **কোনো schema change লাগবে না** — existing `products.compare_price` থেকে auto-detect

### 3. Exit-Intent Popup
- Desktop: mouse cursor top edge cross করলে trigger
- Mobile: fast scroll-up + inactivity timer
- Coupon code offer (existing coupon system থেকে configurable)
- Session-এ ১ বার only, localStorage dismiss
- **কোনো schema change লাগবে না** — admin panel এর existing popup_settings reuse

---

## Phase 2 — Complex Features (Phase 1 approve করার পর)

### 2. Abandoned Cart Recovery
- **New table:** `abandoned_carts` (user_id, cart_snapshot, created_at, notified_at, recovered_at)
- Client: cart-এ item add হওয়ার ৩০ মিনিট পর checkout না করলে row insert
- pg_cron job: প্রতি ঘণ্টায় check → Telegram admin notify + user-কে email (email infra লাগবে)
- Auto-generate discount coupon (৫% off, ২৪ ঘণ্টা valid)

### 4. Bundle / Combo Offer
- **New tables:** `bundles`, `bundle_items` (bundle-এ কোন products, কত% discount)
- Admin panel: bundle CRUD
- Product page-এ "Frequently bought together" widget
- Cart-এ bundle detect → auto-apply discount

### 5. Customer Referral Program
- **New table:** `user_referrals` (referrer_id, referred_id, status, points_awarded)
- Every user গেটে unique referral link (`/?ref=USER_CODE`)
- New user signup + first order complete → both পায় wallet points (existing wallet system reuse)
- Dashboard-এ "Refer & Earn" page: link + earned points + referred users list

---

## আমার Recommendation

**Phase 1 এখনই approve করুন** — ২টা feature, ১ ঘণ্টার কাজ, immediate conversion boost।

Phase 2-এর জন্য email infrastructure setup লাগবে (abandoned cart এর জন্য), bundle-এর জন্য নতুন admin UI, referral-এর জন্য signup flow modify — এগুলো একটা একটা করে আলাদা turn-এ করলে test করাও easy হবে।

**Phase 1 দিয়ে শুরু করি?** নাকি সরাসরি সব ৫টা একসাথে চান (সেক্ষেত্রে ২-৩ turn লাগবে + email setup dialog আসবে)?
