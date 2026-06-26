import { describe, expect, it } from "vitest";
import { domainToTitle, extractDomain, prettyLink } from "./link-title";

describe("prettyLink", () => {
  it("strips protocol, www, and trailing slash", () => {
    expect(prettyLink("https://www.github.com/me/")).toBe("github.com/me");
    expect(prettyLink("http://medium.com/@me")).toBe("medium.com/@me");
  });
});

describe("extractDomain", () => {
  it("returns the bare host", () => {
    expect(extractDomain("https://www.linkedin.com/in/x")).toBe("linkedin.com");
    expect(extractDomain("medium.com/@me")).toBe("medium.com");
    expect(extractDomain("https://maria.dev/portfolio")).toBe("maria.dev");
  });

  it("returns undefined for unparseable / non-domain input", () => {
    expect(extractDomain("")).toBeUndefined();
    expect(extractDomain("mailto:me@x.com")).toBeUndefined();
    expect(extractDomain("not a url")).toBeUndefined();
  });
});

describe("domainToTitle", () => {
  it("capitalizes the registrable label", () => {
    expect(domainToTitle("medium.com")).toBe("Medium");
    expect(domainToTitle("youtube.com")).toBe("Youtube");
    expect(domainToTitle("www.dev.to")).toBe("Dev");
  });

  it("handles two-part TLDs", () => {
    expect(domainToTitle("joe.co.uk")).toBe("Joe");
    expect(domainToTitle("loja.com.br")).toBe("Loja");
  });

  it("returns undefined for empty input", () => {
    expect(domainToTitle(undefined)).toBeUndefined();
    expect(domainToTitle("")).toBeUndefined();
  });
});
