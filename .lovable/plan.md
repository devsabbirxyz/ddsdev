# Refined Dark Theme (Option A)

DDS-Digital সাইটের color scheme আরো clean, trustworthy আর marketplace-friendly করা হবে। শুধু `src/styles.css`-এর color tokens বদলাবো — component code-এ কোনো হাত দিতে হবে না, কারণ সব জায়গায় semantic tokens (`bg-primary`, `text-secondary` ইত্যাদি) use করা আছে।

## যা বদলাবে

**Dark theme (default):**
- Background: `#050014` (heavy purple tint) → `#0A0A15` (neutral deep dark)
- Card/surface: purple tint বাদ দিয়ে neutral slate
- Primary: neon purple `#8A2BE2` → **Electric Blue `#3B82F6`** (Stripe/Linear/Vercel-এর মত trust color)
- Primary glow: brighter blue `#60A5FA`
- Secondary: pink `#E056FD` → **Cyan `#06B6D4`** (subtle accent, শুধু hover/CTA-তে pop করবে)
- Border/ring: blue-tinted, purple না
- Gradient brand: blue → cyan (আগে ছিল purple → pink)

**Light theme:**
- একই দিকে সরানো হবে — blue primary, cyan secondary, neutral background

**Admin theme:**
- অপরিবর্তিত (teal/emerald ঠিক আছে, admin-এর আলাদা identity)

## যা বদলাবে না

- কোনো component file
- Typography, spacing, radius, shadow structure
- Glassmorphism utilities (`.glass`, `.glass-card`) — শুধু ভিতরের কালার নতুন tokens থেকে নেবে
- Animation, marquee, float, pulse-glow ইত্যাদি
- Logo/branding assets

## Technical details

File edited: `src/styles.css` only

নতুন token values (approximate oklch):
- `--background`: `oklch(0.08 0.02 260)` — neutral dark with slight cool tint
- `--primary`: `oklch(0.62 0.20 255)` — electric blue #3B82F6
- `--primary-glow`: `oklch(0.72 0.17 250)` — lighter blue
- `--secondary`: `oklch(0.68 0.14 205)` — cyan #06B6D4
- `--secondary-glow`: `oklch(0.78 0.13 200)`
- `--border`: `oklch(0.62 0.20 255 / 18%)` — blue-tinted glass border
- `--gradient-brand`: `linear-gradient(135deg, var(--primary), var(--secondary))` (structure same, colors auto-update)

Scrollbar gradient, selection color, focus ring — সব auto-update হবে কারণ tokens থেকে derive করা।

## Verification

Preview-তে homepage, product page, dashboard, admin panel — সব check করে confirm করবো কোথাও readability issue নেই।
