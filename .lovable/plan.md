এত বড় scope একসাথে করলে quality drop হবে। আমি ৪টা phase এ ভাগ করেছি — প্রতিটা phase শেষে test করে পরেরটায় যাব।

## Phase 1 — Dashboard + Hero/Offer/Review Save & Toast (#1, #3, #4, #5)

- **Overview filter**: 7d/30d/90d + **Lifetime** option যোগ। `overviewQuery` কে time range এর সাথে react করাবো।
- **Hero / Offer / Review CMS**:
  - প্রতিটা form এর নিচে explicit **Save** button (already mutation আছে, শুধু UI feedback polish)
  - Save → `toast.success("✅ Saved Successfully")` (২ সেকেন্ড)
  - Delete → confirmation dialog (shadcn `AlertDialog`) → `toast.success("⚠️ Deleted")`
  - Add → `toast.success("✅ Added Successfully")`
  - Error → `toast.error("❌ Something went wrong")`
- **Offer Banner auto-slide**: সাইটের homepage এ Offer Banner section এ ৫ সেকেন্ডে auto-slide (embla autoplay), multiple offer support।

## Phase 2 — Homepage CMS Polish + Footer/Newsletter Split (#2, #6)

- **Hero Secondary CTA**: site_settings এ `hero_cta_secondary_text` + `hero_cta_secondary_link` field যোগ। CMS এ দুটো input।
- **Footer ও Newsletter আলাদা section**:
  - `/admin/newsletter` — heading edit, subscriber list, CSV export, show/hide toggle
  - `/admin/footer` — logo upload, description, social links (Facebook/Instagram/WhatsApp/Telegram/YouTube), My Account links (JSON list), Useful Links (JSON list), payment logos (bKash/Nagad/Rocket/Upay), copyright
  - Settings থেকে social links remove করে Footer এ move
  - প্রতিটা subsection এ আলাদা Save button

## Phase 3 — Product Type Flow + Offer Popup (#7, #8)

- **Product Add flow**: `/admin/products/new` এ প্রথমে **type selection screen** (Regular vs Variant card)
  - Regular → existing form (Regular Price + Offer Price)
  - Variant → Price fields hide, dynamic variant rows (Name, Regular Price, Offer Price, Delivery Info per variant), Add/Delete variant
  - DB তে `products.product_type` enum + `product_variants` table extend (already আছে কিনা check করব)
- **Offer Popup System**:
  - `site_settings` এ `offer_popup_enabled` (boolean) + `offer_popup_image` + `offer_popup_link`
  - Frontend এ ৫ সেকেন্ড delay এর পর center modal, close button, একবার দেখানোর জন্য `sessionStorage` flag
  - Admin এ big toggle + image upload + link

## Phase 4 — Customer List + UI Redesign Pass (#9, #10, #11)

- **Customer List** (`/admin/customers`): users table থেকে list, search, ban toggle (`users.is_banned` column)
- **Admin Management**: already shipped at `/admin/admins` ✅ — শুধু Settings থেকে link verify
- **UI Redesign pass** (reference image অনুযায়ী):
  - Sidebar polish (cleaner spacing, section labels)
  - Top bar এ search + notification bell + profile dropdown
  - Stat cards এ percentage change indicator (↑ green / ↓ red)
  - Dark theme contrast audit — সব form/modal/dropdown visibility fix
  - Mobile responsive sidebar (drawer on small screens)
  - Skeleton loading states

## Technical Details

- DB migrations: 2-3 migration (popup settings, footer settings keys, product_type enum if missing, users.is_banned)
- New files: ~6 (newsletter route, footer route, customers route, popup component, ProductTypeSelector, ConfirmDialog helper)
- Reusable: একটা `<ConfirmDialog>` helper বানাবো যাতে সব delete-confirmation একই UX পায়
- সব toast Bengali তে: "✅ সফলভাবে সংরক্ষিত হয়েছে" — নাকি English রাখব? (তুমি যেটা চাও)

---

**আমি Phase 1 দিয়ে শুরু করব?** নাকি অন্য কোনো phase আগে চাও (যেমন Product Type Flow #7 priority high মনে হচ্ছে)?