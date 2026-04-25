import { useEffect } from "react";

// Force the service worker to check for a new build whenever the user returns to
// the PWA — the moment installed-PWA users would otherwise miss updates entirely.
// `registerType: "autoUpdate"` in vite-plugin-pwa already handles activation +
// reload once a new SW is found; this just makes sure the check actually runs.
export const useServiceWorkerUpdater = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const check = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {
          /* offline or registration not ready — try again next focus */
        });
      });
    };

    // Check on first mount (covers cold-launch from home screen).
    check();

    // Check whenever the page becomes visible again (returning to the app).
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    // Also re-check periodically while the app is open and active.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, []);
};
