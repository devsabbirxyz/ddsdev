import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { Sparkles } from "lucide-react";
import { offerSlidesQuery } from "@/lib/site-settings";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartImage } from "./SmartImage";

export function OfferBannerSlider() {
  const { data: slides = [], isLoading } = useQuery(offerSlidesQuery);
  const autoplay = useRef(Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [autoplay.current]);

  if (isLoading) {
    return (
      <div className="mt-8 w-full rounded-3xl overflow-hidden border border-glass-border aspect-[16/6]">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="mt-8 w-full rounded-3xl overflow-hidden border border-glass-border aspect-[16/6] relative bg-gradient-to-br from-primary/30 via-primary/10 to-accent/30">
        <div className="absolute inset-0 grid place-items-center text-center px-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/40 backdrop-blur-sm border border-glass-border text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> বিশেষ অফার
            </div>
            <h3 className="font-display font-bold text-2xl md:text-4xl">সেরা ডিল ও অফার</h3>
            <p className="text-sm md:text-base text-muted-foreground">আপনার পছন্দের প্রোডাক্টে বিশাল ছাড়</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full overflow-hidden rounded-3xl border border-glass-border" ref={emblaRef}>
      <div className="flex">
        {slides.map((s, idx) => {
          const img = (
            <SmartImage
              src={s.image_url}
              alt={s.alt_text ?? "offer banner"}
              className="w-full h-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "auto"}
            />
          );
          return (
            <div key={s.id} className="min-w-0 flex-[0_0_100%] aspect-[16/6] bg-muted/40">
              {s.link_url ? (
                <a href={s.link_url} className="block w-full h-full">{img}</a>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
