import Constants from "expo-constants";
import { Platform } from "react-native";

const PRODUCTION_API_BASE_URL = "https://backend.patchcareers.org";
const LOCAL_API_PORT = 13001;

/** Deep link the backend redirects to after OAuth, carrying the token triple. */
export const OAUTH_CALLBACK_URL = "patchcareers://auth/callback";
/** Path fragment used to recognise the OAuth callback deep link. */
export const OAUTH_CALLBACK_PATH = "auth/callback";

/**
 * Web-only OAuth return URL. On web the backend sets a persistent session
 * cookie and 302s here (same-site with the API, so the cookie flows). Built
 * from the live origin so it works in dev (localhost:8081) and prod
 * (patchcareers.org) without hardcoding. Both must be in the backend's
 * `OAUTH_REDIRECT_URI_ALLOWLIST`.
 */
export function oauthWebCallbackUrl(): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
  return `${origin}/oauth-callback`;
}

export interface ApiBaseURLConfig {
  extraApiBaseURL?: string | undefined;
  envApiBaseURL?: string | undefined;
  isDev?: boolean | undefined;
  platformOS?: string | undefined;
}

export function resolveApiBaseURLFromConfig({
  extraApiBaseURL,
  envApiBaseURL,
  isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false,
  platformOS = Platform.OS,
}: ApiBaseURLConfig): string {
  const configured = extraApiBaseURL ?? envApiBaseURL;
  if (configured?.trim()) return configured.trim();

  if (isDev) {
    const host = platformOS === "android" ? "10.0.2.2" : "localhost";
    return `http://${host}:${LOCAL_API_PORT}`;
  }

  return PRODUCTION_API_BASE_URL;
}

export function resolveApiBaseURL(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseURL?: string };
  return resolveApiBaseURLFromConfig({
    extraApiBaseURL: extra.apiBaseURL,
    envApiBaseURL: process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined,
  });
}
