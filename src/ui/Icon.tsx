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
  | "signal"
  | "broadcast";

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
