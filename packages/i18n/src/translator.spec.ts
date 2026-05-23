import { describe, expect, it } from "vitest";
import { createTranslator, interpolate } from "./translator";
import type { TranslationDict } from "./types";

const dict: TranslationDict = {
  hello: "Olá",
  welcome: "Olá, {name}!",
  nested: {
    deep: {
      msg: "Profundo: {value}",
    },
  },
};

describe("interpolate", () => {
  it("returns the template untouched when no params provided", () => {
    expect(interpolate("hello")).toBe("hello");
    expect(interpolate("hello {name}")).toBe("hello {name}");
  });

  it("replaces {key} with the matching param", () => {
    expect(interpolate("hi {name}", { name: "Ana" })).toBe("hi Ana");
  });

  it("coerces numeric params to strings", () => {
    expect(interpolate("count: {n}", { n: 42 })).toBe("count: 42");
  });

  it("leaves the placeholder intact when the param is missing", () => {
    expect(interpolate("hi {name} and {other}", { name: "Ana" })).toBe("hi Ana and {other}");
  });

  it("trims whitespace inside the placeholder", () => {
    expect(interpolate("hi {  name  }", { name: "Bob" })).toBe("hi Bob");
  });
});

describe("createTranslator", () => {
  const t = createTranslator(dict, "pt-BR");

  it("resolves a top-level key", () => {
    expect(t("hello")).toBe("Olá");
  });

  it("interpolates params", () => {
    expect(t("welcome", { name: "Maria" })).toBe("Olá, Maria!");
  });

  it("resolves nested keys via dot-path", () => {
    expect(t("nested.deep.msg", { value: 7 })).toBe("Profundo: 7");
  });

  it("falls back to the key when missing", () => {
    expect(t("does.not.exist")).toBe("does.not.exist");
  });

  it("returns the key when the path resolves to a non-leaf", () => {
    expect(t("nested")).toBe("nested");
    expect(t("nested.deep")).toBe("nested.deep");
  });

  it("treats undefined nested segments as missing", () => {
    expect(t("hello.deeper")).toBe("hello.deeper");
  });
});
