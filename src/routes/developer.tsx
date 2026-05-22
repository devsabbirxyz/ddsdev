import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [
      { title: "ডেভেলপার — Dev Sabbir Soft" },
      { name: "description", content: "DDS-Digital এর ডেভেলপার সম্পর্কে জানুন।" },
      { property: "og:title", content: "Meet the Developer — DDS-Digital" },
      { property: "og:url", content: "/developer" },
    ],
    links: [{ rel: "canonical", href: "/developer" }],
  }),
  component: () => <ComingSoon title="Meet the Developer" phase="Phase 2" />,
});
