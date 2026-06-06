# Homepage এ 3টা নতুন ফিচার যোগ করা

## 1. 🎁 Free Gift Banner
একটা সুন্দর gradient banner হোমপেজে দেখাবে — যেমন: **"৫০০৳+ অর্ডারে ফ্রি গিফট! 🎁"**

- Position: Hero এর নিচে / Flash Deals এর আগে
- Design: Glassmorphism + gradient + animated gift icon
- Progress bar: কার্টে কত টাকা আছে সেটার উপর ভিত্তি করে দেখাবে "আর মাত্র ৳XXX বাকি ফ্রি গিফট পেতে"
- কার্টে threshold পার করলে: "🎉 অভিনন্দন! আপনি ফ্রি গিফট পেয়েছেন"
- Static data দিয়ে শুরু (threshold = ৫০০৳, gift name customizable)

## 2. ⚖️ Compare Products
২-৩টা প্রোডাক্ট সাইড-বাই-সাইড তুলনা করার ফিচার।

- প্রতিটা ProductCard এ একটা ছোট "Compare" icon button যোগ হবে
- Compare list localStorage এ save হবে (max ৩টা)
- নিচে একটা floating "Compare (২)" pill button দেখাবে যখন items থাকবে
- Click করলে modal/drawer খুলবে — পাশাপাশি দেখাবে:
  - Image, title, price, rating, stock, key features
  - Add to Cart button প্রতিটার জন্য
- Remove/Clear button থাকবে

## 3. 🛒 Sticky Cart Bar
Mobile + Desktop এ স্ক্রল করলে নিচে একটা slim bar দেখাবে।

- Show condition: কার্টে item থাকলে + user স্ক্রল করলে (>৩০০px down)
- Content: "🛒 ৩ items • ৳১,২০০" + **"চেকআউট →"** button
- Mobile এ bottom nav এর উপরে position
- Smooth slide-in animation
- কার্ট/চেকআউট পেজে hide হবে

---

## Technical Plan

### New files
- `src/lib/compare.tsx` — CompareContext (add/remove/clear, localStorage persistence)
- `src/components/storefront/FreeGiftBanner.tsx` — banner + progress bar (useCart subtotal পড়বে)
- `src/components/storefront/CompareDrawer.tsx` — floating pill + comparison modal
- `src/components/storefront/StickyCartBar.tsx` — scroll-aware sticky bar

### Edited files
- `src/components/providers/AppProviders.tsx` — CompareProvider wrap করা
- `src/routes/index.tsx` — FreeGiftBanner বসানো
- `src/routes/__root.tsx` — StickyCartBar + CompareDrawer globally mount
- `src/components/storefront/ProductCard.tsx` — Compare toggle icon button

### Design
- সব semantic tokens (`bg-gradient-brand`, `glass-card`, `text-gradient-brand`) থেকে — existing design system এর সাথে মিল রেখে
- Framer Motion দিয়ে enter/exit animations
- Bengali copy throughout

### No backend changes
সব 3টা ফিচার pure frontend — কোন migration বা database change লাগবে না। Free gift threshold এবং gift name আপাতত const হিসেবে থাকবে; পরে চাইলে `site_settings` এ যোগ করা যাবে।
