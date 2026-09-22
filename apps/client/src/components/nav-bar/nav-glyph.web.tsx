import type { ReactElement } from "react";

type NavGlyphName =
  | "jobs"
  | "applications"
  | "curriculos"
  | "messages"
  | "notifications"
  | "account";

/** Compact desktop navigation glyphs with outlined and solid active states. */
export function NavGlyph({
  name,
  color,
  filled = false,
  size = 19,
}: {
  readonly name: NavGlyphName;
  readonly color: string;
  readonly filled?: boolean;
  readonly size?: number;
}): ReactElement {
  const shapes = {
    jobs: (
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm-2 5 9 4h2l9-4" />
    ),
    applications: filled ? (
      <path d="M12 2 3 21l9-4 9 4-9-19Z" />
    ) : (
      <path d="M12 2 3 21l9-4 9 4-9-19ZM12 17v-6" />
    ),
    curriculos: filled ? (
      <path
        fillRule="evenodd"
        d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10h-5a2 2 0 0 1-2-2V2Zm1 10h10v1.5H7Zm0 4h10v1.5H7ZM15 2.5V8h5.5Z"
      />
    ) : (
      <path d="M14 3H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM14 3v6h6M8 13h8M8 17h5" />
    ),
    messages: filled ? (
      <path
        fillRule="evenodd"
        d="M12 1C5.9 1 1 5 1 10c0 3.2 1.9 6 5 7.6V22a1 1 0 0 0 1.6.8l4.8-3.8C18.3 18.8 23 14.9 23 10c0-5-4.9-9-11-9ZM8.4 10a1.4 1.4 0 1 0-2.8 0 1.4 1.4 0 0 0 2.8 0Zm5 0a1.4 1.4 0 1 0-2.8 0 1.4 1.4 0 0 0 2.8 0Zm5 0a1.4 1.4 0 1 0-2.8 0 1.4 1.4 0 0 0 2.8 0Z"
      />
    ) : (
      <>
        <path
          d="M12 2C6.5 2 2 5.6 2 10c0 3 2 5.6 5 7v5l5-4c5.5 0 10-3.6 10-8S17.5 2 12 2Z"
          strokeLinejoin="miter"
        />
        <g fill={color} stroke="none">
          <circle cx="7" cy="10" r="1.4" />
          <circle cx="12" cy="10" r="1.4" />
          <circle cx="17" cy="10" r="1.4" />
        </g>
      </>
    ),
    notifications: filled ? (
      <path d="M12 1a7 7 0 0 0-7 7c0 3.8-.9 5.3-1.8 6.5C2.6 15.3 2 16 2 17a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1c0-1-.6-1.7-1.2-2.5C19.9 13.3 19 11.8 19 8a7 7 0 0 0-7-7ZM9 20a3 3 0 0 0 6 0Z" />
    ) : (
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    ),
    account: (
      <path d="M12 3.7a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8ZM12 15.2c-5.4 0-9.8 3.6-10.4 8.2-.1.9.6 1.6 1.5 1.6h17.8c.9 0 1.6-.7 1.5-1.6-.6-4.6-5-8.2-10.4-8.2Z" />
    ),
  };
  const outlined = !filled || name === "jobs";
  let strokeWidth = 2.5;
  if (name === "jobs" || name === "curriculos" || name === "applications") strokeWidth = 1.8;
  if (name === "jobs" && filled) strokeWidth = 2.1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill={outlined ? "none" : color}
      stroke={outlined ? color : "none"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes[name]}
    </svg>
  );
}
