## Upsell/Cross-sell Engine — Checkout Suggestions

Checkout page-এ cart items-এর সাথে relevant product suggest করবো, এক-ক্লিকে cart-এ add করা যাবে।

### কী বানাবো

**1. Suggestion Logic (server-side)**
নতুন server function `getCheckoutSuggestions` in `src/lib/product-extras.functions.ts`:
- Input: cart-এ থাকা `productIds[]`
- Rules (priority order):
  1. **Same category, cheaper products** — cart items-এর category থেকে top-selling (by `sold_count` / recent orders), যেগুলো cart-এ নেই
  2. **Frequently bought together** — যে products একই order-এ বেশি এসেছে (query `orders` table, group by user, find co-occurrence)
  3. **Fallback: Best sellers** — যদি কম হয়, best-selling active products দিয়ে fill করবো
- Return max 4 products (id, title, slug, offer_price, regular_price, image, category)
- Only active + in-stock products

**2. UI Component**
নতুন file `src/components/storefront/CheckoutUpsell.tsx`:
- Section title: "🎁 আপনি এটাও কিনতে পারেন" 
- Horizontal scroll (mobile) / 4-column grid (desktop)
- Each card: image, title (2 lines), price (offer + regular strikethrough), **"+ Add"** button
- Click → `addItem()` from `useCart()` + toast "কার্টে যোগ হয়েছে" + card-এ checkmark animation
- Discount badge if `offer_price < regular_price`
- Glassmorphism card style (site theme match)

**3. Integration**
`src/routes/_authenticated/checkout.tsx`:
- Order Summary section-এর ঠিক নিচে `<CheckoutUpsell cartProductIds={...} />` mount
- Cart items change হলে suggestions auto-refresh (react-query)
- Hide if suggestions.length === 0

### Technical

```text
checkout.tsx
  └── Order Summary
  └── CheckoutUpsell (NEW)      ← useQuery(['upsell', cartIds])
        └── getCheckoutSuggestions (server fn)
              ├── query products in cart category (exclude cart ids)
              ├── query co-purchase from orders
              └── fallback best sellers
  └── Payment Section
```

- Query cached 5 min; invalidate when cart changes
- Add-to-cart optimistic (instant UI update)
- No schema/migration needed — uses existing `products`, `orders`, `product_images` tables

### Files
- **New:** `src/components/storefront/CheckoutUpsell.tsx`
- **Modified:** `src/lib/product-extras.functions.ts` (add `getCheckoutSuggestions`)
- **Modified:** `src/routes/_authenticated/checkout.tsx` (mount component)
