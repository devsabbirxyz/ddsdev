import { useMemo, useState, type ImgHTMLAttributes } from "react";

const FALLBACK_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff7a18" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.25"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#g)"/>
      <g fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="2">
        <circle cx="200" cy="135" r="36"/>
        <path d="M165 175 L195 145 L220 165 L245 140 L275 175"/>
      </g>
      <text x="200" y="225" text-anchor="middle" font-family="sans-serif"
            font-size="14" fill="#ffffff" fill-opacity="0.7">Image unavailable</text>
    </svg>`,
  );

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallback?: string;
  /** Max number of automatic retries on load failure */
  maxRetries?: number;
  /** Target width for auto WebP transform on Supabase storage URLs */
  targetWidth?: number;
  /** Disable automatic WebP/resize transform */
  noOptimize?: boolean;
}

/**
 * Auto-convert Supabase public storage URL to WebP via the render endpoint.
 * `/storage/v1/object/public/<bucket>/<path>` → `/storage/v1/render/image/public/<bucket>/<path>?width=&format=webp`
 */
function optimizeUrl(url: string, width?: number): string {
  try {
    if (!/\/storage\/v1\/object\/public\//.test(url)) return url;
    const rendered = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const u = new URL(rendered);
    u.searchParams.set("format", "webp");
    u.searchParams.set("quality", "75");
    if (width) u.searchParams.set("width", String(width));
    u.searchParams.set("resize", "contain");
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Image with graceful fallback, blur placeholder, lazy loading (default),
 * async decoding, and automatic WebP conversion for Supabase storage URLs.
 */
export function SmartImage({
  src,
  fallback = FALLBACK_DATA_URI,
  maxRetries = 1,
  loading = "lazy",
  decoding = "async",
  alt = "",
  onError,
  onLoad,
  targetWidth,
  noOptimize,
  className,
  style,
  ...rest
}: Props) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const finalSrc = useMemo(() => {
    if (!src || failed) return fallback;
    const base = noOptimize ? src : optimizeUrl(src, targetWidth);
    return attempt > 0 ? `${base}${base.includes("?") ? "&" : "?"}r=${attempt}` : base;
  }, [src, failed, fallback, noOptimize, targetWidth, attempt]);

  return (
    <img
      {...rest}
      src={finalSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={className}
      style={{
        backgroundColor: loaded ? undefined : "hsl(var(--muted) / 0.4)",
        transition: "opacity 300ms ease",
        opacity: loaded ? 1 : 0.6,
        ...style,
      }}
      onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
      onError={(e) => {
        if (attempt < maxRetries && !failed) {
          setAttempt((n) => n + 1);
        } else {
          setFailed(true);
          setLoaded(true);
        }
        onError?.(e);
      }}
    />
  );
}
