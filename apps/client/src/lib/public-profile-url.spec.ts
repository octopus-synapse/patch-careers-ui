import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PUBLIC_PROFILE_SEGMENT,
  publicProfileDisplayUrl,
  publicProfileUrl,
  publicWebOrigin,
} from "./public-profile-url";

/** Native and SSR have no `window`; web does. Both paths matter here. */
function withOrigin(origin: string | undefined, run: () => void): void {
  const original = globalThis.window;
  if (origin === undefined) {
    Reflect.deleteProperty(globalThis, "window");
  } else {
    Object.defineProperty(globalThis, "window", {
      value: { location: { origin } },
      configurable: true,
      writable: true,
    });
  }
  try {
    run();
  } finally {
    if (original === undefined) Reflect.deleteProperty(globalThis, "window");
    else Object.defineProperty(globalThis, "window", { value: original, configurable: true });
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("publicWebOrigin", () => {
  it("reads the live origin on web, so dev and production need no config", () => {
    withOrigin("http://localhost:8081", () => {
      expect(publicWebOrigin()).toBe("http://localhost:8081");
    });
  });

  it("falls back to the production origin when there is no window (native)", () => {
    withOrigin(undefined, () => {
      expect(publicWebOrigin()).toBe("https://patchcareers.org");
    });
  });

  it("never falls back to a .com domain", () => {
    withOrigin(undefined, () => {
      expect(publicWebOrigin()).not.toContain(".com");
    });
  });

  it("ignores an empty origin rather than building a protocol-relative URL", () => {
    withOrigin("", () => {
      expect(publicWebOrigin()).toBe("https://patchcareers.org");
    });
  });
});

describe("publicProfileUrl", () => {
  it("uses the segment the route is registered under", () => {
    withOrigin("https://patchcareers.org", () => {
      expect(publicProfileUrl("maria")).toBe(
        `https://patchcareers.org/${PUBLIC_PROFILE_SEGMENT}/maria`,
      );
    });
  });
});

describe("publicProfileDisplayUrl", () => {
  it("drops the protocol, which is noise in a card meant to be recognised", () => {
    withOrigin("https://patchcareers.org", () => {
      expect(publicProfileDisplayUrl("maria")).toBe("patchcareers.org/u/maria");
    });
  });

  it("drops http too, so the dev preview reads the same as production", () => {
    withOrigin("http://localhost:8081", () => {
      expect(publicProfileDisplayUrl("maria")).toBe("localhost:8081/u/maria");
    });
  });

  it("yields a bare prefix for an empty handle (the onboarding preview)", () => {
    withOrigin("https://patchcareers.org", () => {
      expect(publicProfileDisplayUrl("")).toBe("patchcareers.org/u/");
    });
  });
});
