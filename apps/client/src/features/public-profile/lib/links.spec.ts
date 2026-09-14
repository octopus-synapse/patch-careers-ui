import { describe, expect, it } from "vitest";
import { displayUrl, publicProfileLinks } from "./links";

/** Stand-in translator: returns the key, so order and presence are what's asserted. */
const t = ((key: string) => key) as never;

const user = {
  website: null,
  portfolio: null,
  linkedin: null,
  github: null,
};

describe("publicProfileLinks", () => {
  it("returns nothing for a profile with no links", () => {
    expect(publicProfileLinks(user, t)).toEqual([]);
    expect(publicProfileLinks(undefined, t)).toEqual([]);
  });

  it("keeps the editorial order regardless of which fields are set", () => {
    const links = publicProfileLinks(
      { ...user, github: "https://github.com/m", website: "https://m.dev" },
      t,
    );
    expect(links.map((link) => link.key)).toEqual(["website", "github"]);
  });

  it("drops blank and whitespace-only values instead of rendering empty rows", () => {
    const links = publicProfileLinks({ ...user, linkedin: "   ", portfolio: "https://p.dev" }, t);
    expect(links.map((link) => link.key)).toEqual(["portfolio"]);
  });
});

describe("displayUrl", () => {
  it("strips the scheme and any trailing slashes", () => {
    expect(displayUrl("https://maria.dev/")).toBe("maria.dev");
    expect(displayUrl("HTTP://maria.dev/work//")).toBe("maria.dev/work");
  });

  it("leaves a schemeless value alone", () => {
    expect(displayUrl("maria.dev")).toBe("maria.dev");
  });
});
