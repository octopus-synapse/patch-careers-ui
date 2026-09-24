import { describe, expect, it } from "vitest";
import { sectionModalTitle } from "./section-modal-title";

describe("sectionModalTitle", () => {
  it.each([
    ["work_experience_v1", "Add Experience", "Experience"],
    ["education_v1", "Add Education", "Education"],
    ["work_experience_v1", "Adicionar experiência", "Experiência"],
    ["education_v1", "Adicionar formação", "Formação"],
  ])("removes redundant add copy from %s", (key, title, expected) => {
    expect(sectionModalTitle(key, title)).toBe(expected);
  });

  it("preserves titles from other section types", () => {
    expect(sectionModalTitle("skills_v1", "Add Skills")).toBe("Add Skills");
  });
});
