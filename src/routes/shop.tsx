import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "শপ — DDS-Digital" },
      { name: "description", content: "DDS-Digital এর সব ডিজিটাল প্রোডাক্ট ব্রাউজ করুন।" },
      { property: "og:title", content: "শপ — DDS-Digital" },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: () => <ComingSoon title="Shop Page" phase="Phase 2" />,
});
