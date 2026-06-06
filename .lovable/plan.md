Problem: On mobile, the homepage hero offer banner is too short (aspect 16/6 = ~146px tall on 390px width), while the headline text already takes up significant vertical space.

Changes:
1. **src/components/storefront/OfferBannerSlider.tsx**
   - Make the banner aspect ratio responsive: use a taller ratio on mobile (`aspect-[16/9]` or `aspect-[4/3]`) and keep the existing wide `aspect-[16/6]` on `sm:` breakpoints and up.
   - Apply this to all three places where `aspect-[16/6]` is hardcoded (loading skeleton, empty state, and slide container).

2. **src/routes/index.tsx**
   - Keep the hero headline "DDS-Digital — বাংলাদেশের ১ নম্বর ডিজিটাল প্রোডাক্ট মার্কেটপ্লেস" small on mobile by reducing from `text-3xl` to `text-2xl` (or `text-xl`) for the base size, keeping `sm:text-5xl`.

No backend changes. Purely Tailwind responsive class adjustments.