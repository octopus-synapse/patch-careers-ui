/**
 * Shadow tokens — platform-agnostic representation.
 *
 * Each token exposes:
 *   - `web`: CSS `box-shadow` string
 *   - `mobile`: React Native shadow props
 *
 * The Tamagui wrapper (PR #8) reads the appropriate slice per platform.
 */

export type MobileShadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  /** Android-only */
  elevation: number;
};

export type ShadowToken = {
  web: string;
  mobile: MobileShadow;
};

export const shadows = {
  none: {
    web: "none",
    mobile: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  },
  sm: {
    web: "0 1px 2px rgba(0,0,0,0.05)",
    mobile: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  },
  md: {
    web: "0 2px 4px rgba(0,0,0,0.1)",
    mobile: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  },
  lg: {
    web: "0 4px 8px rgba(0,0,0,0.12)",
    mobile: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  xl: {
    web: "0 8px 16px rgba(0,0,0,0.15)",
    mobile: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
} as const satisfies Record<string, ShadowToken>;

export type Shadows = typeof shadows;
export type ShadowKey = keyof Shadows;
