## Admin Dashboard Redesign — Reference-Style Purple Dark Theme

রেফারেন্স ইমেজের premium purple-accent dark admin UI-এর মতো করে পুরো `/admin` shell ও overview page রিডিজাইন করব। সব sub-page (orders, products, customers ইত্যাদি) একই ভিজ্যুয়াল ভাষায় আসবে।

### ১. Admin Shell (`src/routes/admin.tsx`)

- **Sidebar**: শীর্ষে স্টোর ব্র্যান্ড ব্লক (logo + "DDS-Digital / Admin Panel"), তারপর section labels (MAIN / COMMERCE / CMS / SETTINGS) ছোট uppercase muted style-এ। Active item: soft purple gradient pill + left glow bar। Inactive: muted, hover-এ subtle `bg-white/5`।
- **Top header**: বাম দিকে hamburger + page title (route-derived); ডান দিকে দুইটা primary action button — **`+ New Product`** (gradient purple) এবং **`New Coupon`** (outline)। Search বার এবং notification/message আইকন থাকবে current-এর মতোই।
- **Ambient**: বর্তমান radial purple glow রাখব, তবে density কমিয়ে reference-এর মতো পরিচ্ছন্ন করব।

### ২. Overview Page (`src/routes/admin/index.tsx`)

শুধু **৪টা stat card** সেকশন — reference-এর হুবহু স্টাইলে:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ TODAY'S SALES│ THIS MONTH   │ TOTAL DUE    │ CUSTOMERS    │
│ purple bar   │ blue bar     │ amber bar    │ green bar    │
│ 💳 icon      │ 📊 icon      │ ⏰ icon       │ 👥 icon       │
│ ৳ big value  │ ৳ big value  │ ৳ big value  │ count        │
│ subtle meta  │ subtle meta  │ subtle meta  │ subtle meta  │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

- Cards: `glass-card` + top colored border-glow (purple/blue/amber/emerald), rounded-2xl, বড় bold ৳ value, নিচে muted meta line (e.g. "36 orders today")।
- বাকি existing sections (charts, recent orders ইত্যাদি যদি থাকে) index page থেকে সরানো হবে — শুধু ৪ কার্ড থাকবে reference-এর মতো focused overview হিসেবে।

### ৩. Sub-pages Consistency

`admin/orders`, `admin/products`, `admin/customers`, `admin/coupons` ইত্যাদি সব page-এর page-header + table/card wrapper একই style-এ ইউনিফাই করব:

- Page header: বড় display heading + muted subtitle + right-aligned primary action button (gradient purple)।
- Table/list cards: `glass-card rounded-2xl`, subtle border, hover glow।
- Status badges: purple/emerald/amber/red pill with soft tinted bg।
- Form inputs: dark glass with purple focus ring।

কোনো business logic, query, বা data flow পরিবর্তন হবে না — শুধু presentation layer।

### ৪. Design Tokens

`src/styles.css`-এ admin-scoped tokens যোগ/আপডেট করব (existing Midnight Indigo palette রেখে):

- `--admin-accent-purple`, `--admin-accent-blue`, `--admin-accent-amber`, `--admin-accent-emerald` — stat card border glow-এর জন্য।
- `--gradient-admin-primary` — purple button gradient।
- `.admin-theme` scope-এই সীমিত রাখব যাতে storefront-এ প্রভাব না পড়ে।

### Technical Notes

- Files touched: `src/routes/admin.tsx` (shell), `src/routes/admin/index.tsx` (overview), `src/styles.css` (admin tokens), এবং sub-page গুলোর page-header + wrapper class (products/orders/customers/coupons/sellers/withdrawals/categories ইত্যাদি — শুধু className ও header markup)।
- কোনো data query, server function, RLS, বা schema পরিবর্তন নেই।
- Mobile: sidebar drawer + stat cards stack single column।