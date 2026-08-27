import type { ReactNode } from "react";

export type IconName =
  | "share"
  | "rooms"
  | "node"
  | "shield"
  | "users"
  | "link"
  | "logs"
  | "plus"
  | "refresh"
  | "trash"
  | "copy"
  | "check"
  | "eye"
  | "eyeOff"
  | "key"
  | "sun"
  | "moon"
  | "monitor"
  | "globe"
  | "chevronDown"
  | "panelLeft"
  | "panelLeftClose"
  | "menu"
  | "logout"
  | "play"
  | "stop"
  | "x"
  | "alert"
  | "info"
  | "external"
  | "chevronRight"
  | "chevronLeft"
  | "signal"
  | "broadcast"
  | "settings"
  | "film"
  | "ban"
  | "upload"
  | "mail"
  | "github"
  | "google"
  | "image"
  | "sparkle"
  | "user"
  | "maximize";

export interface IconProps {
  name: IconName;
  size?: number;
}

/**
 * In-tree icon set — geometric, stroke-based glyphs on a 24px grid. Kept local so the app
 * pulls no icon font or third-party sprite at runtime.
 */
export function Icon({ name, size = 16 }: IconProps): ReactNode {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "share":
      // A display with an outbound arrow — screen sharing.
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M9 21h6M12 17v4" />
          <path d="M12 13V7.5" />
          <path d="m9.5 10 2.5-2.5L14.5 10" />
        </svg>
      );
    case "rooms":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );
    case "node":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="7" rx="2" />
          <rect x="3" y="14" width="18" height="6" rx="2" />
          <circle cx="7" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="7" cy="17" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6Z" />
          <path d="m9 12 2.2 2.2L15.5 10" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 21v-1a6 6 0 0 1 12 0v1" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M14.5 21v-.5a4.5 4.5 0 0 1 7 0v.5" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M10 13.5a4 4 0 0 0 5.66 0l2.84-2.84a4 4 0 0 0-5.66-5.66L11.5 6.34" />
          <path d="M14 10.5a4 4 0 0 0-5.66 0L5.5 13.34a4 4 0 0 0 5.66 5.66L12.5 17.66" />
        </svg>
      );
    case "logs":
      return (
        <svg {...common}>
          <rect x="4" y="3.5" width="16" height="17" rx="2" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <path d="M20 4v5h-5" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M10 11v6M14 11v6" />
          <path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "copy":
      return (
        <svg {...common}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M6 15H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4.5 4.5L20 7" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "eyeOff":
      return (
        <svg {...common}>
          <path d="M4 4l16 16" />
          <path d="M9.5 5.4A9.6 9.6 0 0 1 12 5c5.8 0 9 6 9 6a15 15 0 0 1-2.3 3" />
          <path d="M6.3 7.5A15.4 15.4 0 0 0 3 11s3.2 6 9 6a9.4 9.4 0 0 0 3.6-.7" />
          <path d="M10.2 10.3a2.5 2.5 0 0 0 3.4 3.5" />
        </svg>
      );
    case "key":
      return (
        <svg {...common}>
          <circle cx="8" cy="16" r="3.5" />
          <path d="m10.5 13.5 8-8" />
          <path d="m15 6 3 3" />
          <path d="m18 3 3 3-2 2" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      );
    case "monitor":
      // A display on a stand — "follow the system theme".
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="12" rx="2" />
          <path d="M9 20.5h6M12 16.5v4" />
        </svg>
      );
    case "globe":
      // Marks the language switcher. A globe rather than a flag: flags stand for
      // countries, and a language is not a country (there is no flag for "English").
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3.2 9.5h17.6M3.2 14.5h17.6" />
          <path d="M12 3c-2.4 2.4-3.6 5.4-3.6 9s1.2 6.6 3.6 9c2.4-2.4 3.6-5.4 3.6-9S14.4 5.4 12 3Z" />
        </svg>
      );
    case "chevronDown":
      return (
        <svg {...common}>
          <path d="m6 9.5 6 6 6-6" />
        </svg>
      );
    case "panelLeft":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M10 4v16" />
        </svg>
      );
    case "panelLeftClose":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M10 4v16M16 9l-3 3 3 3" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
          <path d="M10 8l-4 4 4 4" />
          <path d="M6 12h9" />
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <path d="m7 4 12 8-12 8z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "stop":
      return (
        <svg {...common}>
          <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <path d="M12 4.5 21 20H3Z" />
          <path d="M12 10v4.5" />
          <circle cx="12" cy="17.4" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5.5" />
          <circle cx="12" cy="7.9" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "external":
      return (
        <svg {...common}>
          <path d="M13 4h7v7" />
          <path d="M20 4 11 13" />
          <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
        </svg>
      );
    case "chevronRight":
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case "chevronLeft":
      // The reversed chevron — reads as "back out of here", used by the room's title button.
      return (
        <svg {...common}>
          <path d="m15 6-6 6 6 6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.2M12 18.3v2.2M4.6 7.8l1.9 1.1M17.5 15.1l1.9 1.1M4.6 16.2l1.9-1.1M17.5 8.9l1.9-1.1" />
        </svg>
      );
    case "film":
      // A frame strip — the sync video player.
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="15" rx="2" />
          <path d="M8 4.5v15M16 4.5v15" />
          <path d="M3 12h18M3 8.2h5M3 15.8h5M16 8.2h5M16 15.8h5" />
        </svg>
      );
    case "ban":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m6.4 6.4 11.2 11.2" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V4.5" />
          <path d="m8 8.5 4-4 4 4" />
          <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="m3.6 7 8.4 5.6L20.4 7" />
        </svg>
      );
    case "github":
      // Solid path — brand marks read wrong as thin strokes.
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 1.8a10.2 10.2 0 0 0-3.23 19.89c.51.1.7-.22.7-.49v-1.9c-2.84.62-3.44-1.2-3.44-1.2-.46-1.18-1.13-1.5-1.13-1.5-.93-.63.07-.62.07-.62 1.02.07 1.56 1.05 1.56 1.05.91 1.56 2.39 1.11 2.97.85.09-.66.36-1.11.65-1.37-2.27-.26-4.65-1.14-4.65-5.06 0-1.12.4-2.03 1.05-2.75-.11-.26-.46-1.3.1-2.71 0 0 .85-.27 2.79 1.05a9.6 9.6 0 0 1 5.08 0c1.94-1.32 2.79-1.05 2.79-1.05.56 1.41.21 2.45.1 2.71.65.72 1.05 1.63 1.05 2.75 0 3.93-2.39 4.79-4.67 5.05.37.32.7.94.7 1.9v2.82c0 .27.18.6.71.49A10.2 10.2 0 0 0 12 1.8Z" />
        </svg>
      );
    case "google":
      // Google's four-colour G. Fixed brand colours — it must not inherit currentColor.
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M21.6 12.2c0-.64-.06-1.25-.16-1.84H12v3.49h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.22c1.88-1.73 2.96-4.28 2.96-7.17Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.23-2.5c-.9.6-2.04.96-3.38.96a5.9 5.9 0 0 1-5.54-4.08H3.1v2.58A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.46 13.95a5.99 5.99 0 0 1 0-3.83V7.54H3.1a10.01 10.01 0 0 0 0 8.99l3.36-2.58Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86A9.58 9.58 0 0 0 12 2 10 10 0 0 0 3.1 7.54l3.36 2.58A5.9 5.9 0 0 1 12 5.98Z"
          />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="15" rx="2" />
          <circle cx="8.6" cy="9.8" r="1.6" />
          <path d="m4 17 4.7-4.2a1.8 1.8 0 0 1 2.4 0L16 17" />
          <path d="m13.6 14.6 1.7-1.5a1.8 1.8 0 0 1 2.4 0L20 15.2" />
        </svg>
      );
    case "sparkle":
      // Marks the guided-tour callout.
      return (
        <svg {...common}>
          <path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.6L12 17.7l-1.6-5.5L5 10.6 10.4 9Z" />
          <path d="M18.4 16.2l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6Z" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.4" r="3.6" />
          <path d="M4.8 20.5v-.8a7.2 7.2 0 0 1 14.4 0v.8" />
        </svg>
      );
    case "maximize":
      return (
        <svg {...common}>
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      );
    case "signal":
      return (
        <svg {...common}>
          <path d="M5 18v-4M10 18v-8M15 18v-11M20 18V6" />
        </svg>
      );
    case "broadcast":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
          <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4" />
          <path d="M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2" />
        </svg>
      );
  }
}
