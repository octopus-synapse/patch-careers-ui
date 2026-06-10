/**
 * Company logo URLs derived from the stored `companyDomain` — the experience
 * item persists only the domain, so the image URL is rebuilt here on every
 * render (the img.logo.dev publishable token can rotate without a data
 * migration). Without a token the helper returns `undefined` and rows fall
 * back to the monogram chip.
 */
import Constants from "expo-constants";

const LOGO_CDN = "https://img.logo.dev";

export interface LogoDevConfig {
  extraToken?: string | undefined;
  envToken?: string | undefined;
}

export function companyLogoUrlFromConfig(
  domain: string,
  { extraToken, envToken }: LogoDevConfig,
  size = 64,
): string | undefined {
  const token = (extraToken ?? envToken)?.trim();
  const cleaned = domain.trim().toLowerCase();
  if (!token || !cleaned) return undefined;
  return `${LOGO_CDN}/${encodeURIComponent(cleaned)}?token=${token}&size=${size}&format=png&retina=true`;
}

export function companyLogoUrl(domain: string, size = 64): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as { logoDevPublishableKey?: string };
  return companyLogoUrlFromConfig(
    domain,
    {
      extraToken: extra.logoDevPublishableKey,
      envToken: process.env.EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY as string | undefined,
    },
    size,
  );
}
