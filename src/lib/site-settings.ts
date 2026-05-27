import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const siteSettingsQuery = queryOptions({
  queryKey: ["site_settings"],
  staleTime: 60_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("key,value");
    if (error) return {} as Record<string, string>;
    const map: Record<string, string> = {};
    for (const r of data ?? []) map[r.key] = r.value ?? "";
    return map;
  },
});

export const offerBannerQuery = queryOptions({
  queryKey: ["offer_banner_first"],
  staleTime: 60_000,
  queryFn: async () => {
    const { data } = await supabase
      .from("offer_slides")
      .select("image_url,link_url,alt_text")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    return data;
  },
});

export const offerSlidesQuery = queryOptions({
  queryKey: ["offer_slides_active"],
  staleTime: 60_000,
  queryFn: async () => {
    const { data } = await supabase
      .from("offer_slides")
      .select("id,image_url,link_url,alt_text")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return data ?? [];
  },
});

export const HOMEPAGE_KEYS = {
  hero_badge: "hero_badge",
  hero_tagline: "hero_tagline",
  hero_cta_primary: "hero_cta_primary",
  hero_cta_secondary: "hero_cta_secondary",
  hero_cta_secondary_link: "hero_cta_secondary_link",
  announcement: "announcement_text",
  trust_bar: "trust_bar_json",
  promo_section: "promo_section_json",
  footer_about: "footer_about",
  footer_copyright: "footer_copyright",
  footer_logo_url: "footer_logo_url",
  newsletter_heading: "newsletter_heading",
  newsletter_sub: "newsletter_sub",
  newsletter_enabled: "newsletter_enabled",
  social_facebook: "facebook_url",
  social_instagram: "instagram_url",
  social_youtube: "youtube_url",
  social_telegram: "telegram_url",
  social_whatsapp: "whatsapp_url",
  payment_bkash: "payment_bkash_enabled",
  payment_nagad: "payment_nagad_enabled",
  payment_rocket: "payment_rocket_enabled",
  payment_upay: "payment_upay_enabled",
  how_to_buy_video: "how_to_buy_video_url",
} as const;

export function toYouTubeEmbed(url: string | undefined | null): string {
  if (!url) return "https://www.youtube.com/embed/dQw4w9WgXcQ";
  const u = url.trim();
  // youtu.be/<id>
  let m = u.match(/youtu\.be\/([\w-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  // youtube.com/watch?v=<id>
  m = u.match(/[?&]v=([\w-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  // youtube.com/shorts/<id>
  m = u.match(/youtube\.com\/shorts\/([\w-]{6,})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  // already embed or any other URL
  if (u.includes("/embed/")) return u;
  return u;
}


export type TrustItem = { icon: string; label: string; sub: string };

export function parseTrustBar(value: string | undefined): TrustItem[] {
  if (!value) return [];
  try {
    const v = JSON.parse(value);
    if (!Array.isArray(v)) return [];
    return v.filter((x) => x && typeof x.label === "string");
  } catch {
    return [];
  }
}

export type PromoStat = { value: string; label: string };
export type PromoSection = {
  enabled: boolean;
  badge: string;
  heading: string;
  description: string;
  coupon_code: string;
  button_text: string;
  button_link: string;
  stats: PromoStat[];
};

export const DEFAULT_PROMO: PromoSection = {
  enabled: true,
  badge: "🔥 লিমিটেড টাইম অফার",
  heading: "সব প্রোডাক্টে ১৫% পর্যন্ত ছাড় চলছে!",
  description: "কুপন কোড {coupon} ব্যবহার করে এখনই কিনুন।",
  coupon_code: "DDS15",
  button_text: "অফার দেখুন →",
  button_link: "/shop",
  stats: [
    { value: "১৫%", label: "ডিসকাউন্ট" },
    { value: "৫০০+", label: "প্রোডাক্ট" },
    { value: "২৪/৭", label: "সাপোর্ট" },
  ],
};

export function parsePromoSection(value: string | undefined): PromoSection {
  if (!value) return DEFAULT_PROMO;
  try {
    const v = JSON.parse(value);
    return {
      enabled: v.enabled !== false,
      badge: v.badge ?? DEFAULT_PROMO.badge,
      heading: v.heading ?? DEFAULT_PROMO.heading,
      description: v.description ?? DEFAULT_PROMO.description,
      coupon_code: v.coupon_code ?? DEFAULT_PROMO.coupon_code,
      button_text: v.button_text ?? DEFAULT_PROMO.button_text,
      button_link: v.button_link ?? DEFAULT_PROMO.button_link,
      stats: Array.isArray(v.stats) && v.stats.length > 0
        ? v.stats.filter((s: any) => s && typeof s.label === "string")
        : DEFAULT_PROMO.stats,
    };
  } catch {
    return DEFAULT_PROMO;
  }
}
