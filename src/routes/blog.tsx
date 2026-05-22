import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "ব্লগ — DDS-Digital" },
      { name: "description", content: "DDS-Digital ব্লগ — টিপস, গাইড ও নতুন আপডেট।" },
      { property: "og:title", content: "ব্লগ — DDS-Digital" },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: () => <ComingSoon title="Blog" phase="Phase 2" />,
});
