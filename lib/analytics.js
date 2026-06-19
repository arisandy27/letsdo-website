export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }

  if (typeof window.va === "function") {
    window.va("event", { name: eventName, ...params });
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[trackEvent]", eventName, params);
  }
}