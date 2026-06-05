"use client";

import { useLayoutEffect, useState } from "react";

import { getThemeFromDom } from "@/src/lib/theme";
import { ui } from "@/src/lib/ui";

function syncIcon(isDark: boolean) {
  return isDark ? "☀" : "☾";
}

export default function ThemeToggle() {
  const [icon, setIcon] = useState("☾");

  useLayoutEffect(() => {
    const sync = () => setIcon(syncIcon(getThemeFromDom()));

    sync();

    const onThemeChange = () => sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    window.addEventListener("themechange", onThemeChange);
    return () => {
      observer.disconnect();
      window.removeEventListener("themechange", onThemeChange);
    };
  }, []);

  return (
    <button
      type="button"
      data-theme-toggle
      className={ui.themeToggle}
      style={{ WebkitTapHighlightColor: "transparent" }}
      aria-label={icon === "☀" ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={icon === "☀"}
      title={icon === "☀" ? "Light mode" : "Dark mode"}
    >
      <span aria-hidden="true" className="pointer-events-none select-none">
        {icon}
      </span>
    </button>
  );
}
