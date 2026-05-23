import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { offerSlidesQuery } from "@/lib/site-settings";

export function OfferBannerSlider() {
  const { data: slides = [] } = useQuery(offerSlidesQuery);
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [autoplay.current]);

  if (slides.length === 0) {
    return (
      <div className="mt-8 w-full rounded-3xl overflow-hidden bg-muted/40 border border-glass-border aspect-[16/6] grid place-items-center">
        <span className="text-xs text-muted-foreground">Offer Banner — admin panel থেকে ইমেজ আপলোড করুন</span>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full overflow-hidden rounded-3xl border border-glass-border" ref={emblaRef}>
      <div className="flex">
        {slides.map((s) => {
          const img = (
            <img
              src={s.image_url}
              alt={s.alt_text ?? "offer banner"}
              className="w-full h-full object-cover"
              loading="lazy"
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
