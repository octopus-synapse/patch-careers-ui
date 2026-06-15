import { describe, expect, it } from "vitest";
import { fieldsFromDefinition } from "./section-definition";

describe("fieldsFromDefinition", () => {
  it("maps backend definition fields to editor fields", () => {
    const fields = fieldsFromDefinition({
      fields: [
        // Resolver flattens the translated label to the field root.
        { key: "company", type: "string", required: true, label: "Empresa", meta: {} },
        // Enum field carries localized {value,label} pairs + its enumName.
        {
          key: "employmentType",
          type: "enum",
          label: "Tipo de Emprego",
          enum: ["FULL_TIME", "INTERNSHIP"],
          options: [
            { value: "FULL_TIME", label: "Tempo integral" },
            { value: "INTERNSHIP", label: "Estágio" },
          ],
          meta: { enumName: "JobType" },
        },
      ],
    });
    expect(fields).toEqual([
      { key: "company", type: "text", label: "Empresa", required: true },
      {
        key: "employmentType",
        type: "select",
        label: "Tipo de Emprego",
        required: false,
        enumName: "JobType",
        options: [
          { value: "FULL_TIME", label: "Tempo integral" },
          { value: "INTERNSHIP", label: "Estágio" },
        ],
      },
    ]);
  });

  it("falls back to {value,value} pairs when the resolver injected no options", () => {
    const fields = fieldsFromDefinition({
      fields: [{ key: "level", type: "enum", label: "Level", enum: ["A1", "A2"], meta: {} }],
    });
    expect(fields[0]?.options).toEqual([
      { value: "A1", label: "A1" },
      { value: "A2", label: "A2" },
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
