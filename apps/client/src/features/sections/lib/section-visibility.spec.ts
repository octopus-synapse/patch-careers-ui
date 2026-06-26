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
  it("hides empty sections from the view, even mandatory ones", () => {
    const { visible } = mergeSectionsWithCatalog(CATALOG, []);
    expect(visible).toEqual([]);
  });

  it("carries groupKey through to the merged section", () => {
    const { catalog } = mergeSectionsWithCatalog(
      [type({ key: "links_v1", groupKey: "online_presence" }), type({ key: "project_v1" })],
      [],
    );
    expect(catalog.find((s) => s.key === "links_v1")?.groupKey).toBe("online_presence");
    expect(catalog.find((s) => s.key === "project_v1")?.groupKey).toBe(null);
  });

  it("shows sections (mandatory or not) only when they have at least one item", () => {
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
    const item = [{ id: "i", content: {} }];
    const { visible } = mergeSectionsWithCatalog(CATALOG, [
      { id: "s0", sectionTypeKey: "work_experience_v1", items: item },
      { id: "s1", sectionTypeKey: "education_v1", items: item },
      { id: "s2", sectionTypeKey: "project_v1", items: item },
      { id: "s3", sectionTypeKey: "summary_v1", items: item },
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
    const { catalog } = mergeSectionsWithCatalog(CATALOG, []);
    const experience = catalog.find((s) => s.key === "work_experience_v1");
    expect(experience?.descriptor.sectionTypeKey).toBe("work_experience_v1");
    expect(experience?.descriptor.fields?.map((f) => f.key)).toEqual(["title"]);
  });

  it("carries the section row id when the section already exists", () => {
    const { catalog } = mergeSectionsWithCatalog(CATALOG, [
      { id: "row-1", sectionTypeKey: "work_experience_v1", items: [] },
    ]);
    expect(catalog.find((s) => s.key === "work_experience_v1")?.sectionId).toBe("row-1");
  });
});
