// DDS-Digital push notification service worker
// This worker only handles push messaging — no app-shell caching.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "DDS-Digital", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "DDS-Digital";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    image: payload.image,
    tag: payload.tag || "dds-notification",
    data: { url: payload.url || "/", ...(payload.data || {}) },
    requireInteraction: payload.requireInteraction || false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin) {
            client.focus();
            return client.navigate(targetUrl);
          }
        } catch (e) {}
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
