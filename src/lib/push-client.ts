// Browser-only helpers for enabling / disabling push notifications.
import { savePushSubscription, removePushSubscription, getVapidPublicKey } from "@/lib/push.functions";

const SW_PATH = "/push-sw.js";
const SW_SCOPE = "/";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

function subToJson(sub: PushSubscription) {
  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  return {
    endpoint: json.endpoint || sub.endpoint,
    p256dh: json.keys?.p256dh || "",
    auth: json.keys?.auth || "",
  };
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function getPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "denied" };

  // Register the push service worker (separate from any app-shell PWA worker)
  const reg = await navigator.serviceWorker.register(SW_PATH, { scope: SW_SCOPE });
  await navigator.serviceWorker.ready;

  const { publicKey } = await getVapidPublicKey();
  if (!publicKey) return { ok: false, reason: "no_vapid_key" };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const payload = subToJson(sub);
  if (!payload.p256dh || !payload.auth) return { ok: false, reason: "invalid_sub" };

  await savePushSubscription({
    data: {
      endpoint: payload.endpoint,
      p256dh: payload.p256dh,
      auth: payload.auth,
      userAgent: navigator.userAgent,
    },
  });
  return { ok: true };
}

export async function disablePush(): Promise<{ ok: boolean }> {
  if (!isPushSupported()) return { ok: false };
  const reg = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (!reg) return { ok: true };
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { ok: true };
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  try { await removePushSubscription({ data: { endpoint } }); } catch {}
  return { ok: true };
}
