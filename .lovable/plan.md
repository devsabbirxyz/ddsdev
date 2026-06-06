
# হোমপেজে নতুন সেকশন যোগ করার প্ল্যান

আপনার হোমপেজে এখন আছে: Announcement bar, Hero, Offer banner, Categories, Featured products, Recently viewed, Trust bar, Promo section, How-to-buy video, Reviews, Blog.

নিচের ৮ টি নতুন সেকশন যোগ করব — তিনটা ক্যাটাগরিতে ভাগ করা।

## 🔥 Sales / Offers (৩টা)

1. **Flash Deals / Today's Deals** — কাউন্টডাউন টাইমার সহ সর্বোচ্চ ডিসকাউন্টের ৪টা প্রোডাক্ট। Featured products সেকশনের ঠিক উপরে বসবে। লাল/অরেঞ্জ "Hot" badge সহ glassmorphism কার্ড।

2. **Best Sellers** — সবচেয়ে বেশি বিক্রি হওয়া ৮টা প্রোডাক্ট (orders count অনুযায়ী)। "#১ বেস্টসেলার", "#২" এমন র‍্যাঙ্কিং ব্যাজ সহ। Featured এর পরে।

3. **Bundle Offers / Combo Deals** — ২-৩টা প্রোডাক্ট একসাথে discount price এ। Admin CMS theke configure-able। Promo section এর পাশে।

## 🛡️ Trust / Social Proof (৩টা)

4. **Live Stats Counter** — animated counter: "আজ ২৪ অর্ডার ✅", "১৫০০+ হ্যাপি কাস্টমার", "৪.৯★ রেটিং", "১০০% সিকিউর পেমেন্ট"। Hero এর ঠিক নিচে। Real DB data (orders count, customers count, avg rating)।

5. **Featured Testimonials** — কাস্টমার testimonial কার্ড (avatar, name, rating, comment) — Reviews স্লাইডার এর সাথে আলাদাভাবে ৩টা highlight হিসেবে দেখাবে। Admin CMS এ add/edit করা যাবে।

6. **FAQ Accordion (Homepage)** — সবচেয়ে কমন ৫টা প্রশ্ন (delivery time, payment, refund, support) — accordion আকারে। Footer এর আগে। Admin এ edit-able।

## ✨ Engagement / Interactive (২টা)

7. **Newsletter Signup** — gradient brand banner — "নতুন অফার সবার আগে পান!" + email input + subscribe button। Already আছে newsletter table; এটা homepage এ prominent CTA হবে।

8. **Recently Added / Just Arrived** — শেষ ৭ দিনে যোগ হওয়া নতুন প্রোডাক্ট, "NEW" badge সহ। Latest products কে আরো prominent করবে।

## কাঠামো (নতুন order)

```text
Announcement bar
Hero + Offer banner
Live Stats Counter          ← নতুন #4
Categories
Flash Deals (countdown)     ← নতুন #1
Featured Products
Best Sellers                ← নতুন #2
Recently Added              ← নতুন #8
Trust bar
Promo section
Bundle Offers               ← নতুন #3
Testimonials Highlight      ← নতুন #5
How to Buy video
Reviews slider
FAQ Accordion               ← নতুন #6
Newsletter Signup           ← নতুন #7
Blog
```

## টেকনিক্যাল ডিটেইলস

- নতুন সেকশনগুলোর জন্য আলাদা component বানানো হবে: `FlashDeals.tsx`, `BestSellers.tsx`, `LiveStats.tsx`, `BundleOffers.tsx`, `TestimonialsHighlight.tsx`, `HomeFAQ.tsx`, `NewsletterCTA.tsx`, `JustArrived.tsx` — সব `src/components/storefront/` এ।
- ডেটা সোর্স:
  - Flash Deals, Best Sellers, Just Arrived → existing `products` table, নতুন query helpers।
  - Live Stats → server function যা orders/users/reviews aggregate করবে।
  - Bundles, Testimonials, FAQ → নতুন `site_settings` keys (JSON) — admin CMS এ edit করবেন।
- ডিজাইন: existing glassmorphism, electric blue→purple gradient, semantic tokens (`bg-gradient-brand`, `glass-card`, `text-gradient-brand`) — কোনো hardcoded color হবে না।
- Mobile responsive, lazy-loaded images।
- Admin Homepage CMS (`/admin/homepage`) এ Bundles, Testimonials, FAQ tabs যোগ হবে যাতে আপনি content edit করতে পারেন।

কোনো database schema change লাগবে না — শুধু `site_settings` এ নতুন key যোগ হবে (existing pattern)।

Approve করলে build mode এ implement করব।
