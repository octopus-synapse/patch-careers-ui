import { describe, expect, it } from "vitest";
import { diffWords, fieldText, fieldValueFromText, textsDiffer } from "./text-diff";

describe("diffWords", () => {
  it("marks only the words that changed", () => {
    const segments = diffWords("Led the frontend team", "Led the platform team");
    expect(segments).toEqual([
      { kind: "same", text: "Led the " },
      { kind: "removed", text: "frontend" },
      { kind: "added", text: "platform" },
      { kind: "same", text: " team" },
    ]);
  });

  it("is all 'same' for identical text and all 'added' for text from nothing", () => {
    expect(diffWords("a b", "a b")).toEqual([{ kind: "same", text: "a b" }]);
    expect(diffWords("", "new words")).toEqual([{ kind: "added", text: "new words" }]);
  });

  it("keeps insertions and deletions at the ends", () => {
    expect(diffWords("one two", "zero one two three")).toEqual([
      { kind: "added", text: "zero " },
      { kind: "same", text: "one two" },
      { kind: "added", text: " three" },
    ]);
  });
});

describe("textsDiffer / fieldText / fieldValueFromText", () => {
  it("ignores whitespace-only differences", () => {
    expect(textsDiffer("a  b", "a b ")).toBe(false);
    expect(textsDiffer("a b", "a c")).toBe(true);
  });
  it("round-trips array fields through one line per entry", () => {
    expect(fieldText(["x", "y"])).toBe("x\ny");
    expect(fieldValueFromText("x\n\n y ", true)).toEqual(["x", "y"]);
    expect(fieldValueFromText("plain", false)).toBe("plain");
  });
});
