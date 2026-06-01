import Constants from "expo-constants";
import { Platform } from "react-native";

const PRODUCTION_API_BASE_URL = "https://api.patchcareers.com";
const LOCAL_API_PORT = 13001;

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
