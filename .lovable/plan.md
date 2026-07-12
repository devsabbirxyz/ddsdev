# One-Page Checkout Plan

Goal: এক পেজেই সব — Order Summary, Quantity, Coupon, Customer Info, Price Total, Pay Now, Payment Method + TrxID form। কোনো নতুন ফিচার/পেমেন্ট মেথড যোগ হবে না, শুধু existing multi-page flow এক পেজে সাজানো হবে।

## Scope

- Product page (`src/routes/product.$slug.tsx`) হবে primary one-page checkout entry: "এখনই কিনুন" ক্লিকে একই পেজে নিচে full checkout section expand হবে (route change হবে না)।
- `/cart` এবং `/checkout` routes থাকবে (backward compatibility — direct link/history), কিন্তু default flow product page থেকেই complete হবে।
- Payment methods, coupon validation, wallet redeem, `placeOrder` server fn, telegram notify — সব existing logic reuse হবে।

## Layout

Desktop (≥lg): 2-column grid inside product page's new `<OnePageCheckout>` section
```text
┌──────────────── 60% ────────────────┬──────── 40% ────────┐
│ 1. Order Summary (thumb+title+var)  │ 4. Customer Info    │
│ 2. Quantity (digital=fixed 1)       │ 5. Price Summary    │
│ 3. Coupon input                     │ 6. Pay Now button   │
└─────────────────────────────────────┴─────────────────────┘
             ↓ Pay Now click ↓ (same page, slide-down)
┌────────────── Payment Section (full width) ──────────────┐
│  bKash │ Nagad │ Rocket │ Upay  (2×2 grid)               │
│  → selected method এর নিচে TrxID form fade-in            │
│  → "অর্ডার কনফার্ম করুন" submit                          │
└──────────────────────────────────────────────────────────┘
```
Mobile: সব section stacked top→bottom, same order।

## Files to change

1. **`src/components/storefront/OnePageCheckout.tsx`** (new)
   - Self-contained component: props `{ product, selectedVariant, selectedPlan, quantity, setQuantity }`.
   - Internal state: `name, email, phone, customerInput, couponCode, coupon, redeemPoints, methodId, trxId, step (info|payment), submitting`.
   - Reuses: `useCart` for adding+`clear`, `useAuth`, `walletQuery`, `paymentMethodsQuery` (moved from checkout.tsx into shared spot or duplicated here), `placeOrder`, `notify`, coupon lookup logic (copied from checkout.tsx verbatim — same Supabase query + validation)।
   - "Pay Now" click → validates info → `setStep('payment')` → smooth `max-height` transition reveals payment cards।
   - Method select → renders existing bKash/Nagad/Rocket/Upay card grid (extracted from current `PaymentSelect` in checkout.tsx) + copy-number button + TrxID input।
   - Submit → calls `placeOrder` directly with single-item payload (product+variant+plan+quantity), fires telegram, shows success modal, then routes to `/dashboard/orders`।
   - Guest handling: if `!user`, show "লগইন করুন" button linking to `/login?redirect=/product/<slug>` (existing behaviour — no new guest checkout logic)।

2. **`src/routes/product.$slug.tsx`**
   - Replace current "কার্টে যোগ করুন / এখনই কিনুন" block: keep "কার্টে যোগ করুন" as secondary, and make "এখনই কিনুন" scroll to / mount `<OnePageCheckout>` section directly below product details।
   - Pass current `product`, `selectedVariant`, `selectedPlan`, `quantity` down।
   - `ProductStickyBar` "এখনই কিনুন" also scrolls to same section।

3. **`src/routes/cart.tsx`** — keep as-is (still reachable via `/cart` link); its "চেকআউট" button still goes to `/checkout` for multi-item carts।

4. **`src/routes/_authenticated/checkout.tsx`** — keep as-is (multi-item fallback / direct navigation)। No deletion।

5. **`src/lib/payment-methods.query.ts`** (new small module)
   - Extract `paymentMethodsQuery` + `METHOD_BRAND`/`METHOD_THEME` maps so both `checkout.tsx` and `OnePageCheckout.tsx` import from one place (avoid duplication)।

## Animations (Tailwind + inline style)
- Payment section reveal: wrapper with `overflow-hidden transition-[max-height] duration-300 ease-out`, toggled between `max-h-0` and `max-h-[2000px]`.
- Method form: `animate-fade-in` (existing keyframe)।
- Submit button: `Loader2` spinner while `submitting`।
- Success: existing `toast.success` + navigate after 800ms (matches current behaviour)।

## Explicitly NOT changing
- No new payment methods, no new DB tables, no schema migration।
- No changes to `placeOrder` server fn, coupon rules, wallet logic, telegram notify।
- No color/font changes — reuses existing `glass-card`, `bg-gradient-brand`, `text-gradient-brand`, `shadow-glow`।
- Multi-item cart flow (add multiple products then `/cart` → `/checkout`) remains functional untouched।

## Open question
Digital-only site — quantity by default fixed at 1 across all products, OR only fixed when `product.type === 'digital'` (physical/other শো করলে −/+ button)? Current product page already has a quantity stepper for every product; আমি default রাখব "সব product-এ stepper (stock limit-এ + disabled)" যদি অন্য কিছু না বলেন।
