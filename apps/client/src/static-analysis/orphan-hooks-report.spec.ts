/**
 * Generated SDK hooks with no consumer in the app — a REPORT, not a gate.
 *
 * The audit that led to the unused-surface removal found 380 of 451 generated
 * hooks with no caller. This spec never fails; it prints the count per
 * controller so the number is visible in every `verify:arch` run and cannot
 * quietly climb back. "No consumer in the app" is not the same as dead: admin
 * and internal endpoints legitimately have none — which is why this reports
 * instead of reprove.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readAllSourceFiles } from "./utils";

const HOOKS_DIR = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "packages",
  "api-client",
  "src",
  "generated",
  "hooks",
);
const SRC_DIR = path.join(__dirname, "..");

function hookNames(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.startsWith("use") && f.endsWith(".ts"))
    .map((f) => f.slice(0, -3));
}

describe("orphan generated hooks (report only)", () => {
  it("lists generated hooks the app never imports, per controller", () => {
    const controllers = readdirSync(HOOKS_DIR).filter((d) =>
      statSync(path.join(HOOKS_DIR, d)).isDirectory(),
    );
    const sources = readAllSourceFiles(SRC_DIR)
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");

    let used = 0;
    let orphan = 0;
    const lines: string[] = [];
    for (const controller of controllers) {
      const names = hookNames(path.join(HOOKS_DIR, controller));
      const dead = names.filter((n) => !new RegExp(`\\b${n}\\b`).test(sources));
      used += names.length - dead.length;
      orphan += dead.length;
      if (dead.length > 0) lines.push(`  ${dead.length}/${names.length}  ${controller}`);
    }
    lines.sort((a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10));
    console.info(
      `\n[orphan-hooks] ${orphan} of ${used + orphan} generated hooks have no consumer in apps/client:\n${lines.join("\n")}\n`,
    );
    expect(used).toBeGreaterThan(0);
  });
});
