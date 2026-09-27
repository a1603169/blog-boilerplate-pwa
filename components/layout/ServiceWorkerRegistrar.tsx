"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that makes the site installable and gives it an
 * offline shell.
 *
 * `next-pwa` used to do this, but it is unmaintained and does not support
 * Next 15 / App Router, so the worker in `public/sw.js` is hand-written and
 * registered here instead.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    };

    // Registering after load keeps the worker off the critical path.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
