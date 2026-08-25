import type { Locale, Translator } from "@patch-careers/i18n";
import { describe, expect, it } from "vitest";
import { fieldErrorsFromResponse } from "./backend-fields";
import { validateGenericField } from "./generic-field";
import { validationMessage } from "./messages";
import { validateEmail, validateName, validateUsername } from "./validators";

// Identity translator: the returned string is the key (+ params for inspection).
const t = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key}:${JSON.stringify(params)}` : key) as unknown as Translator;

describe("validateName", () => {
  it("distinguishes empty from too short", () => {
    expect(validateName("   ")).toEqual({ code: "REQUIRED" });
    expect(validateName("A")).toEqual({ code: "STRING_TOO_SHORT", params: { min: 2 } });
    expect(validateName("Ana")).toBeNull();
  });
});

describe("validateEmail", () => {
  it("required then format", () => {
    expect(validateEmail("")?.code).toBe("REQUIRED");
    expect(validateEmail("nope")?.code).toBe("EMAIL_INVALID");
    expect(validateEmail(" a@b.co ")).toBeNull();
  });
});

describe("validateUsername", () => {
  it("length then pattern", () => {
    expect(validateUsername("ab")?.code).toBe("STRING_TOO_SHORT");
    expect(validateUsername("Bad Name")?.code).toBe("USERNAME_INVALID");
    expect(validateUsername("good_name1")).toBeNull();
  });
});

describe("validationMessage", () => {
  it("renders through the validation.* namespace with params", () => {
    expect(validationMessage({ code: "STRING_TOO_SHORT", params: { min: 2 } }, t)).toBe(
      'validation.minLength:{"min":2}',
    );
    expect(validationMessage({ code: "REQUIRED" }, t)).toBe("validation.required");
  });
});

describe("validateGenericField", () => {
  it("required, length, url, pattern", () => {
    expect(validateGenericField({ key: "x", required: true }, "", t)).toBe("validation.required");
    expect(validateGenericField({ key: "x", minLength: 3 }, "ab", t)).toBe(
      'validation.minLength:{"min":3}',
    );
    expect(validateGenericField({ key: "website" }, "example.com", t)).toBe(
      "validation.invalidUrl",
    );
    expect(validateGenericField({ key: "x", pattern: "^a+$" }, "bbb", t)).toBe(
      "validation.invalidPattern",
    );
    expect(validateGenericField({ key: "x" }, "", t)).toBeNull();
  });
});

describe("fieldErrorsFromResponse", () => {
  const locale: Locale = "pt-BR";
  it("renders the server message verbatim and keys by path", () => {
    const err = {
      response: {
        data: {
          fields: [
            {
              path: ["name"],
              code: "STRING_TOO_SHORT",
              params: { min: 2 },
              message: "Mínimo de 2 caracteres",
            },
            {
              path: ["password"],
              code: "PASSWORD_NEEDS_DIGIT",
              message: "Inclua ao menos um número",
            },
            { path: ["password"], code: "PASSWORD_NEEDS_SYMBOL", message: "later" },
          ],
        },
      },
    };
    expect(fieldErrorsFromResponse(err, locale)).toEqual({
      name: "Mínimo de 2 caracteres",
      password: "Inclua ao menos um número",
    });
  });

  it("falls back to the shipped validation dictionary when only a code arrives", () => {
    const err = { data: { fields: [{ path: "email", code: "EMAIL_INVALID" }] } };
    expect(fieldErrorsFromResponse(err, locale)).toEqual({ email: "E-mail inválido" });
    expect(fieldErrorsFromResponse(err, "en")).toEqual({ email: "Enter a valid e-mail" });
  });

  it("returns an empty map for errors without field detail", () => {
    expect(fieldErrorsFromResponse(new Error("boom"), locale)).toEqual({});
  });
});
