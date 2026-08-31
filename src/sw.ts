import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const { title, body, url } = event.data.json() as {
    title: string;
    body: string;
    url?: string;
  };
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [200, 100, 200],
      data: { url: url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url: string = (event.notification.data as any)?.url ?? "/";
  event.waitUntil(
    (self as any).clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients: any[]) => {
        const match = clients.find((c: any) =>
          c.url.startsWith((self as any).location.origin)
        );
        if (match) {
          match.focus();
          return match.navigate(url);
        }
        return (self as any).clients.openWindow(url);
      })
  );
});
