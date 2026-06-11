import { describe, expect, it } from "vitest";
import { type CatalogSectionType, mergeSectionsWithCatalog } from "./section-visibility";

function type(overrides: Partial<CatalogSectionType> & { key: string }): CatalogSectionType {
  return {
    title: overrides.key,
    description: "",
    addLabel: `Adicionar ${overrides.key}`,
    noDataLabel: "Ainda não tenho",
    icon: "briefcase",
    iconType: "lucide",
    isMandatory: false,
    isRepeatable: true,
    maxItems: null,
    definition: { fields: [{ key: "title", type: "string", required: true }] },
    ...overrides,
  };
}

const CATALOG = [
  type({ key: "work_experience_v1", isMandatory: true }),
  type({ key: "education_v1", isMandatory: true }),
  type({ key: "project_v1" }),
  type({ key: "summary_v1", isMandatory: true, isRepeatable: false, maxItems: 1 }),
];

describe("mergeSectionsWithCatalog", () => {
  it("always lists mandatory sections, even with zero items", () => {
    const { visible } = mergeSectionsWithCatalog(CATALOG, []);
    expect(visible.map((s) => s.key)).toEqual(["work_experience_v1", "education_v1", "summary_v1"]);
    expect(visible.every((s) => s.items.length === 0)).toBe(true);
  });

  it("shows optional sections only when they have at least one item", () => {
    const { visible } = mergeSectionsWithCatalog(CATALOG, [
      { id: "s1", sectionTypeKey: "project_v1", items: [{ id: "i1", content: {} }] },
    ]);
    expect(visible.map((s) => s.key)).toContain("project_v1");

    const { visible: afterDelete } = mergeSectionsWithCatalog(CATALOG, [
      { id: "s1", sectionTypeKey: "project_v1", items: [] },
    ]);
    expect(afterDelete.map((s) => s.key)).not.toContain("project_v1");
  });

  it("keeps catalog order (no reordering)", () => {
    const { visible } = mergeSectionsWithCatalog(CATALOG, [
      { id: "s1", sectionTypeKey: "project_v1", items: [{ id: "i1", content: {} }] },
    ]);
    expect(visible.map((s) => s.key)).toEqual([
      "work_experience_v1",
      "education_v1",
      "project_v1",
      "summary_v1",
    ]);
  });

  it("flags capacity from maxItems and from non-repeatable types", () => {
    const { catalog } = mergeSectionsWithCatalog(CATALOG, [
      { id: "s1", sectionTypeKey: "summary_v1", items: [{ id: "i1", content: {} }] },
      { id: "s2", sectionTypeKey: "project_v1", items: [{ id: "i2", content: {} }] },
    ]);
    const summary = catalog.find((s) => s.key === "summary_v1");
    const project = catalog.find((s) => s.key === "project_v1");
    expect(summary?.atCapacity).toBe(true);
    expect(project?.atCapacity).toBe(false);
  });

  it("builds a descriptor with fields from the catalog definition", () => {
    const { visible } = mergeSectionsWithCatalog(CATALOG, []);
    const experience = visible.find((s) => s.key === "work_experience_v1");
    expect(experience?.descriptor.sectionTypeKey).toBe("work_experience_v1");
    expect(experience?.descriptor.fields?.map((f) => f.key)).toEqual(["title"]);
  });

  it("carries the section row id when the section already exists", () => {
    const { visible } = mergeSectionsWithCatalog(CATALOG, [
      { id: "row-1", sectionTypeKey: "work_experience_v1", items: [] },
    ]);
    expect(visible.find((s) => s.key === "work_experience_v1")?.sectionId).toBe("row-1");
  });
});
