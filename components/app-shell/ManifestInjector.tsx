"use client";

import { useEffect } from "react";

export default function ManifestInjector() {
  useEffect(() => {
    const existingLink = document.querySelector('link[rel="manifest"]');
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/manifest.json";
      document.head.appendChild(link);
    }

    const appleTouch = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouch) {
      const link = document.createElement("link");
      link.rel = "apple-touch-icon";
      link.href = "/icons/ri-apple-touch.png";
      link.setAttribute("sizes", "180x180");
      document.head.appendChild(link);
    } else {
      (appleTouch as HTMLLinkElement).href = "/icons/ri-apple-touch.png";
    }

    const metaTags = [
      { name: "theme-color", content: "#3A3A3A" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Recruta Indústria" },
    ];

    metaTags.forEach((tag) => {
      const existing = document.querySelector(`meta[name="${tag.name}"]`);
      if (!existing) {
        const meta = document.createElement("meta");
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });
  }, []);

  return null;
}
