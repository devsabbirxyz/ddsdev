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
  trust_bar: "trust_bar_json", // JSON array
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
} as const;

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
