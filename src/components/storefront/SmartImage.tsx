import { useState, type ImgHTMLAttributes } from "react";

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
}

/**
 * Image with graceful fallback + lightweight retry on transient network failure.
 * Defaults to lazy loading and async decoding.
 */
export function SmartImage({
  src,
  fallback = FALLBACK_DATA_URI,
  maxRetries = 1,
  loading = "lazy",
  decoding = "async",
  alt = "",
  onError,
  ...rest
}: Props) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  const resolvedSrc = !src || failed
    ? fallback
    : attempt > 0
      ? `${src}${src.includes("?") ? "&" : "?"}r=${attempt}`
      : src;

  return (
    <img
      {...rest}
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={(e) => {
        if (attempt < maxRetries && !failed) {
          setAttempt((n) => n + 1);
        } else {
          setFailed(true);
        }
        onError?.(e);
      }}
    />
  );
}
