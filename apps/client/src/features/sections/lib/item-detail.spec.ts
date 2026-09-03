import { describe, expect, it } from "vitest";
import type { SectionField, SectionItem } from "../types";
import { itemDetail } from "./item-detail";

const PRESENT = "Presente";

const field = (key: string, extra: Partial<SectionField> = {}): SectionField =>
  ({ key, type: "text", label: key, required: false, ...extra }) as SectionField;

/** The real work_experience_v1 field list, minus the composite it drops. */
const EXPERIENCE_FIELDS: SectionField[] = [
  field("role"),
  field("company"),
  field("startDate", { type: "date" }),
  field("endDate", { type: "date" }),
  field("description", { type: "text", widget: "textarea" }),
];

const patchTech: SectionItem = {
  content: {
    role: "Engenheira de Software Plena",
    company: "Patch Tech",
    startDate: "2022-03-01",
    endDate: "2024-06-01",
    description: "Liderei a migração do app para Expo + React Native Web.",
    achievements: ["Reduzi o tempo de build em 40%", "Migrei 30 telas para a nova stack"],
  },
};

describe("itemDetail", () => {
  it("splits an item into its own slots instead of one summary line", () => {
    const detail = itemDetail(patchTech, EXPERIENCE_FIELDS, "pt-BR", PRESENT);
    expect(detail.title).toBe("Engenheira de Software Plena");
    expect(detail.subtitle).toBe("Patch Tech");
    expect(detail.description).toBe("Liderei a migração do app para Expo + React Native Web.");
    expect(detail.dateRange).toMatch(/2022.*—.*2024/);
  });

  it("reads achievements off content, since the field list never carries them", () => {
    const detail = itemDetail(patchTech, EXPERIENCE_FIELDS, "pt-BR", PRESENT);
    expect(detail.achievements).toEqual([
      "Reduzi o tempo de build em 40%",
      "Migrei 30 telas para a nova stack",
    ]);
  });

  it("accepts achievements written as objects, not just strings", () => {
    const detail = itemDetail(
      { content: { achievements: [{ text: "Cortei o build pela metade" }, { description: "b" }] } },
      [],
      "pt-BR",
      PRESENT,
    );
    expect(detail.achievements).toEqual(["Cortei o build pela metade", "b"]);
  });

  it("drops achievement entries that carry no text", () => {
    const detail = itemDetail(
      { content: { achievements: ["", "   ", { text: "" }, 42, null, "ok"] } },
      [],
      "pt-BR",
      PRESENT,
    );
    expect(detail.achievements).toEqual(["ok"]);
  });

  it("ignores an achievements value that is not an array", () => {
    const detail = itemDetail({ content: { achievements: "nope" } }, [], "pt-BR", PRESENT);
    expect(detail.achievements).toEqual([]);
  });
});

describe("itemDetail — dates", () => {
  it("reads an empty end date as still-there, not as missing", () => {
    const detail = itemDetail(
      { content: { role: "Dev", startDate: "2024-01-01" } },
      EXPERIENCE_FIELDS,
      "pt-BR",
      PRESENT,
    );
    expect(detail.dateRange).toContain(PRESENT);
  });

  it("does not claim Present when the section has no end field at all", () => {
    const detail = itemDetail(
      { content: { title: "Prêmio", date: "2023-05-01" } },
      [field("title"), field("date", { type: "date" })],
      "pt-BR",
      PRESENT,
    );
    expect(detail.dateRange).not.toContain(PRESENT);
    expect(detail.dateRange).toBeTruthy();
  });

  it("returns null when the item is undated", () => {
    const detail = itemDetail({ content: { role: "Dev" } }, [field("role")], "pt-BR", PRESENT);
    expect(detail.dateRange).toBeNull();
  });

  it("leaves an unparseable date as-is rather than dropping it", () => {
    const detail = itemDetail(
      { content: { startDate: "sometime" } },
      [field("startDate", { type: "date" })],
      "pt-BR",
      PRESENT,
    );
    expect(detail.dateRange).toBe("sometime");
  });
});

describe("itemDetail — enums and prose", () => {
  it("renders an enum through the dictionary, not as SCREAMING_CASE", () => {
    const detail = itemDetail(
      { content: { institution: "USP", degreeType: "BACHELOR" } },
      [field("institution"), field("degreeType", { type: "select", enumName: "DegreeType" })],
      "pt-BR",
      PRESENT,
    );
    expect(detail.subtitle).not.toContain("BACHELOR");
    expect(detail.subtitle.length).toBeGreaterThan(0);
  });

  it("takes the first textarea as the description and keeps later ones inline", () => {
    const detail = itemDetail(
      { content: { a: "first prose", b: "second prose" } },
      [field("a", { widget: "textarea" }), field("b", { widget: "textarea" })],
      "pt-BR",
      PRESENT,
    );
    expect(detail.description).toBe("first prose");
    expect(detail.title).toBe("second prose");
  });
});

describe("itemDetail — degenerate input", () => {
  it("survives an item with no content and no fields", () => {
    expect(itemDetail({}, undefined, "pt-BR", PRESENT)).toEqual({
      title: "",
      subtitle: "",
      dateRange: null,
      description: null,
      achievements: [],
    });
  });

  it("ignores content keys the field list does not describe", () => {
    const detail = itemDetail(
      { content: { role: "Dev", companyDomain: "patch.dev" } },
      [field("role")],
      "pt-BR",
      PRESENT,
    );
    expect(detail.title).toBe("Dev");
    expect(detail.subtitle).toBe("");
  });
});
