import { editorialPalette, editorialPaletteDark } from "@patch-careers/tokens";
import { describe, expect, it } from "vitest";
import { editorialPaletteFor } from "./editorial-palette";

describe("editorialPaletteFor", () => {
  it("returns the light palette for light", () => {
    expect(editorialPaletteFor("light")).toBe(editorialPalette);
  });

  it("returns the dark palette for dark", () => {
    expect(editorialPaletteFor("dark")).toBe(editorialPaletteDark);
  });
});
