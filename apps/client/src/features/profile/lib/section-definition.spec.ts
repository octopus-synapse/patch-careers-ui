import { describe, expect, it } from "vitest";
import { fieldsFromDefinition } from "./section-definition";

describe("fieldsFromDefinition", () => {
  it("maps backend definition fields to editor fields", () => {
    const fields = fieldsFromDefinition({
      fields: [
        { key: "company", type: "string", required: true, meta: { label: "Company" } },
        { key: "employmentType", type: "enum", enum: ["Full-time"], meta: {} },
      ],
    });
    expect(fields).toEqual([
      { key: "company", type: "text", label: "Company", required: true },
      {
        key: "employmentType",
        type: "select",
        label: "employmentType",
        required: false,
        options: ["Full-time"],
      },
    ]);
  });

  it("drops hidden and composite fields", () => {
    const fields = fieldsFromDefinition({
      fields: [
        { key: "company", type: "string", required: true, meta: { label: "Company" } },
        {
          key: "companyDomain",
          type: "string",
          meta: { label: "Company Domain", hidden: true },
        },
        { key: "achievements", type: "array" },
      ],
    });
    expect(fields.map((field) => field.key)).toEqual(["company"]);
  });
});
