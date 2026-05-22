import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমাদের সম্পর্কে — DDS-Digital" },
      { name: "description", content: "DDS-Digital (Dev Sabbir Soft) সম্পর্কে জানুন।" },
      { property: "og:title", content: "আমাদের সম্পর্কে — DDS-Digital" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: () => <ComingSoon title="About Us" phase="Phase 2" />,
});
