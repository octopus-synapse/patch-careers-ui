import { describe, expect, it } from "vitest";
import { filledProfileFields, missingProfileFields } from "./missing-fields";
import type { EditableProfile } from "./profile-fields";

const t = ((key: string) => key) as never;

const profile = (overrides: Partial<EditableProfile>): EditableProfile =>
  ({
    name: "Maria",
    headline: null,
    location: "",
    bio: "   ",
    phone: "+55 11 9",
    ...overrides,
  }) as EditableProfile;

describe("missingProfileFields", () => {
  it("names every blank field, treating null, empty and whitespace alike", () => {
    expect(missingProfileFields(profile({}), t).map((f) => f.key)).toEqual([
      "headline",
      "location",
      "bio",
    ]);
  });

  it("is empty when everything is filled", () => {
    const full = profile({ headline: "Dev", location: "SP", bio: "Olá" });
    expect(missingProfileFields(full, t)).toEqual([]);
  });

  it("treats no profile at all as everything missing", () => {
    expect(missingProfileFields(undefined, t)).toHaveLength(5);
  });
});

describe("filledProfileFields", () => {
  it("is the complement, in form order", () => {
    const filled = filledProfileFields(profile({}), t).map((f) => f.key);
    const missing = missingProfileFields(profile({}), t).map((f) => f.key);
    expect(filled).toEqual(["name", "phone"]);
    expect([...filled, ...missing]).toHaveLength(5);
  });
});
