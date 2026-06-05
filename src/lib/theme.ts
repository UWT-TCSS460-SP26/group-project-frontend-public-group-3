export const THEME_STORAGE_KEY = "theme";
export const THEME_TOGGLE_SELECTOR = "[data-theme-toggle]";

export function readStoredTheme(): "dark" | "light" | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored =
      window.localStorage.getItem(THEME_STORAGE_KEY) ??
      window.sessionStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch {
    // Private browsing on mobile can block storage.
  }

  return null;
}

export function persistTheme(theme: "dark" | "light") {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore and fall back to session storage.
  }

  try {
    window.sessionStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme still applies visually for this session.
  }
}

export function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

export function getThemeFromDom(): boolean {
  return (
    document.documentElement.classList.contains("dark") ||
    document.documentElement.dataset.theme === "dark"
  );
}

export function toggleTheme() {
  const next = !getThemeFromDom();
  applyTheme(next);
  persistTheme(next ? "dark" : "light");
  window.dispatchEvent(
    new CustomEvent("themechange", { detail: { isDark: next } }),
  );
  return next;
}

declare global {
  interface Window {
    __toggleTheme?: () => boolean;
  }
}

export const themeInitScript = `
(function () {
  var STORAGE_KEY = "${THEME_STORAGE_KEY}";
  var TOGGLE_SELECTOR = "${THEME_TOGGLE_SELECTOR}";

  function applyTheme(isDark) {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }

  function persistTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    try { sessionStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  function isDarkTheme() {
    return document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
  }

  function toggleTheme() {
    var next = !isDarkTheme();
    applyTheme(next);
    persistTheme(next ? "dark" : "light");
    window.dispatchEvent(new CustomEvent("themechange", { detail: { isDark: next } }));
    return next;
  }

  try {
    var stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(stored === "dark" || (stored !== "light" && prefersDark));
  } catch (e) {}

  window.__toggleTheme = toggleTheme;

  function handleToggleEvent(event) {
    var target = event.target;
    if (!target || !target.closest) return;
    if (!target.closest(TOGGLE_SELECTOR)) return;
    event.preventDefault();
    toggleTheme();
  }

  document.addEventListener("click", handleToggleEvent, true);
})();
`;
