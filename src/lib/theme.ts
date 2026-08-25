export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "mxds.theme";
export const SIDEBAR_STORAGE_KEY = "mxds.sidebar";

/** Default when nothing is stored — this is a media app, dark reads better. */
export const DEFAULT_THEME: Theme = "dark";

/**
 * Runs before first paint to stamp `data-theme` on <html>, so the page never flashes the
 * wrong palette. Inlined into <head> by the root layout — keep it dependency-free ES5.
 */
export const themeBootstrapScript = `(function(){try{var v=localStorage.getItem("${THEME_STORAGE_KEY}");var t=(v==="light"||v==="dark")?v:"${DEFAULT_THEME}";document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}");}})();`;

export function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

let crossfadeTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Applies a theme to <html> and persists it. Enables a brief color crossfade so the switch
 * doesn't snap, then removes it — otherwise every hover would animate too.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const previous = root.getAttribute("data-theme");
  if (previous && previous !== theme) {
    root.classList.add("mx-theme-switching");
    if (crossfadeTimer !== undefined) clearTimeout(crossfadeTimer);
    crossfadeTimer = setTimeout(() => {
      root.classList.remove("mx-theme-switching");
      crossfadeTimer = undefined;
    }, 260);
  }
  root.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode — the theme still applies for this page view */
  }
}
