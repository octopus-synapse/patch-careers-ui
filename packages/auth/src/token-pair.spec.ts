import { describe, expect, it } from "vitest";
import { extractTokenPair, parseTokenPairFromParams } from "./token-pair";

describe("extractTokenPair", () => {
  it("builds a pair from a well-formed payload", () => {
    expect(
      extractTokenPair({ accessToken: "a", refreshToken: "r", expiresIn: 3600, mode: "tokens" }),
    ).toEqual({ accessToken: "a", refreshToken: "r", expiresIn: 3600 });
  });

  it("returns null when a field is missing or mistyped", () => {
    expect(extractTokenPair(null)).toBeNull();
    expect(extractTokenPair("nope")).toBeNull();
    expect(extractTokenPair({ accessToken: "a", refreshToken: "r" })).toBeNull();
    expect(extractTokenPair({ accessToken: "a", refreshToken: "r", expiresIn: "3600" })).toBeNull();
  });
});

describe("parseTokenPairFromParams", () => {
  it("parses the standard callback triple", () => {
    const params = new URLSearchParams("accessToken=a&refreshToken=r&expiresIn=3600");
    expect(parseTokenPairFromParams(params)).toEqual({
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 3600,
    });
  });

  it("returns null when a param is missing", () => {
    expect(
      parseTokenPairFromParams(new URLSearchParams("accessToken=a&refreshToken=r")),
    ).toBeNull();
  });

  it("returns null when expiresIn is not a number", () => {
    const params = new URLSearchParams("accessToken=a&refreshToken=r&expiresIn=soon");
    expect(parseTokenPairFromParams(params)).toBeNull();
  });
});
