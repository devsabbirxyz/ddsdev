import { useEffect } from "react";

const KEY = "dds_ref_code";

// Reads ?ref=CODE from URL on any page load and stashes it in localStorage
// for the next 30 days, so signup can attribute the new user to the referrer.
export function ReferralCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;
    const clean = ref.trim().toUpperCase().slice(0, 20);
    if (!/^[A-Z0-9]+$/.test(clean)) return;
    try {
      const payload = { code: clean, ts: Date.now() };
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {}
  }, []);
  return null;
}

export function getPendingReferralCode(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.code) return null;
    // Expire after 30 days
    if (Date.now() - Number(parsed.ts || 0) > 30 * 86400_000) {
      localStorage.removeItem(KEY);
      return null;
    }
    return String(parsed.code);
  } catch {
    return null;
  }
}

export function clearPendingReferralCode() {
  try { localStorage.removeItem(KEY); } catch {}
}
