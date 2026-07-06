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
      <div className="mt-8 w-full rounded-2xl overflow-hidden border border-glass-border aspect-[16/6]">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }


  return (
    <div className="mt-8 w-full overflow-hidden rounded-2xl border border-glass-border bg-muted/20" ref={emblaRef}>
      <div className="flex">
        {slides.map((s, idx) => {
          const isFirst = idx === 0;
          const img = (
            <SmartImage
              src={s.image_url}
              alt={s.alt_text ?? "offer banner"}
              className="w-full h-auto max-h-[70vh] object-contain block"
              loading={isFirst ? "eager" : "lazy"}
              fetchPriority={isFirst ? "high" : "auto"}
              decoding={isFirst ? "sync" : "async"}
            />
          );
          return (
            <div key={s.id} className="min-w-0 flex-[0_0_100%]">
              {s.link_url ? (
                <a href={s.link_url} className="block w-full">{img}</a>
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
