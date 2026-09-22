import { describe, expect, it } from "vitest";
import { hrefForLocale, localeFromPath, withoutLocale } from "./route-locale";

describe("route locale", () => {
  it("recognizes only the complete en path segment", () => {
    expect(localeFromPath("/en/jobs")).toBe("en");
    expect(localeFromPath("/english/jobs")).toBe("pt-BR");
    expect(withoutLocale("/en/job/42")).toBe("/job/42");
  });

  it("preserves query and hash when localizing hrefs", () => {
    expect(hrefForLocale("/job/42?scope=all#apply", "en")).toBe("/en/job/42?scope=all#apply");
    expect(hrefForLocale("/en/job/42?scope=all", "pt-BR")).toBe("/job/42?scope=all");
    expect(hrefForLocale({ pathname: "/job/[id]", params: { id: "42" } }, "en")).toEqual({
      pathname: "/en/job/[id]",
      params: { id: "42" },
    });
  });
});
