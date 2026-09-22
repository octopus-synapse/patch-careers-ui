import Constants from "expo-constants";
import { Platform } from "react-native";

const PRODUCTION_API_BASE_URL = "https://backend.patchcareers.org";
const LOCAL_API_PORT = 13001;

export interface ApiBaseURLConfig {
  extraApiBaseURL?: string | undefined;
  envApiBaseURL?: string | undefined;
  isDev?: boolean | undefined;
  platformOS?: string | undefined;
  /** Metro server host the Expo client connected to, e.g. "192.168.1.150:8081". */
  hostUri?: string | undefined;
}

/**
 * The dev backend runs on the developer's machine. A physical device (Expo Go
 * on a real iPhone/Android) can't reach it via "localhost" — that resolves to
 * the device itself. Expo's `hostUri` already points at the Metro server's LAN
 * IP (the same machine the backend runs on), so we reuse its host. Falls back
 * to "10.0.2.2" (Android emulator alias for the host) / "localhost" when no
 * host is available (e.g. web).
 */
function resolveDevHost(platformOS?: string, hostUri?: string): string {
  const fromExpo = hostUri?.split(":")[0]?.trim();
  if (fromExpo && fromExpo !== "localhost" && fromExpo !== "127.0.0.1") return fromExpo;
  return platformOS === "android" ? "10.0.2.2" : "localhost";
}

export function resolveApiBaseURLFromConfig({
  extraApiBaseURL,
  envApiBaseURL,
  isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false,
  platformOS = Platform.OS,
  hostUri,
}: ApiBaseURLConfig): string {
  const configured = extraApiBaseURL ?? envApiBaseURL;
  if (configured?.trim()) return configured.trim();

  if (isDev) {
    const host = resolveDevHost(platformOS, hostUri);
    return `http://${host}:${LOCAL_API_PORT}`;
  }

  return PRODUCTION_API_BASE_URL;
}

export function resolveApiBaseURL(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseURL?: string };
  return resolveApiBaseURLFromConfig({
    extraApiBaseURL: extra.apiBaseURL,
    envApiBaseURL: process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined,
    hostUri: Constants.expoConfig?.hostUri,
  });
}
