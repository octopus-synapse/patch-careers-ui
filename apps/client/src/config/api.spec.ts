import { describe, expect, it, vi } from "vitest";
import { resolveApiBaseURLFromConfig } from "./api";

vi.mock("expo-constants", () => ({ default: { expoConfig: { extra: {} } } }));
vi.mock("react-native", () => ({ Platform: { OS: "android" } }));

describe("resolveApiBaseURLFromConfig", () => {
  it("uses Expo extra config when present", () => {
    expect(
      resolveApiBaseURLFromConfig({
        extraApiBaseURL: " https://configured.example.com ",
        envApiBaseURL: "https://env.example.com",
        isDev: true,
        platformOS: "android",
      }),
    ).toBe("https://configured.example.com");
  });

  it("uses env config before local fallbacks", () => {
    expect(
      resolveApiBaseURLFromConfig({
        envApiBaseURL: "http://192.168.1.10:13001",
        isDev: true,
        platformOS: "android",
      }),
    ).toBe("http://192.168.1.10:13001");
  });

  it("points Android dev builds at the host machine backend", () => {
    expect(resolveApiBaseURLFromConfig({ isDev: true, platformOS: "android" })).toBe(
      "http://10.0.2.2:13001",
    );
  });

  it("keeps production builds on the public API host", () => {
    expect(resolveApiBaseURLFromConfig({ isDev: false, platformOS: "android" })).toBe(
      "https://backend.patchcareers.org",
    );
  });
});
