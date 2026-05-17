#!/usr/bin/env bun
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts/codemod-inline-style-to-tw.ts');

let workdir: string;

beforeAll(() => {
  workdir = mkdtempSync(join(tmpdir(), 'codemod-inline-style-'));
});

afterAll(() => {
  rmSync(workdir, { recursive: true, force: true });
});

function runOn(input: string): string {
  const file = join(workdir, `fixture-${Date.now()}-${Math.random().toString(36).slice(2)}.svelte`);
  writeFileSync(file, input);
  const result = spawnSync('bun', [SCRIPT, '--apply', file], {
    encoding: 'utf8',
    cwd: ROOT,
  });
  if (result.status !== 0) {
    throw new Error(`codemod exited ${result.status}: ${result.stderr}`);
  }
  const out = readFileSync(file, 'utf8');
  rmSync(file);
  return out;
}

describe('codemod-inline-style-to-tw', () => {
  test('color: var(--x) → text-[var(--x)]', () => {
    const input = `<div style="color: var(--landing-oxide)">x</div>`;
    expect(runOn(input)).toBe(`<div class="text-[var(--landing-oxide)]">x</div>`);
  });

  test('background: var(--x) → bg-[var(--x)]', () => {
    const input = `<span style="background: var(--landing-ink)">y</span>`;
    expect(runOn(input)).toBe(`<span class="bg-[var(--landing-ink)]">y</span>`);
  });

  test('background-color: #hex → bg-[#hex]', () => {
    const input = `<div style="background-color: #ff0000">a</div>`;
    expect(runOn(input)).toBe(`<div class="bg-[#ff0000]">a</div>`);
  });

  test('border-color: var(--x) → border-[var(--x)]', () => {
    const input = `<div style="border-color: var(--landing-line-dark)">b</div>`;
    expect(runOn(input)).toBe(`<div class="border-[var(--landing-line-dark)]">b</div>`);
  });

  test('text-decoration-color: var(--x) → decoration-[var(--x)]', () => {
    const input = `<a style="text-decoration-color: var(--landing-oxide);">c</a>`;
    expect(runOn(input)).toBe(`<a class="decoration-[var(--landing-oxide)]">c</a>`);
  });

  test('display: none → hidden', () => {
    const input = `<div style="display: none">d</div>`;
    expect(runOn(input)).toBe(`<div class="hidden">d</div>`);
  });

  test('display: flex → flex', () => {
    const input = `<div style="display: flex">e</div>`;
    expect(runOn(input)).toBe(`<div class="flex">e</div>`);
  });

  test('width: 100px → w-[100px]', () => {
    const input = `<div style="width: 100px">f</div>`;
    expect(runOn(input)).toBe(`<div class="w-[100px]">f</div>`);
  });

  test('min-height: 0 → min-h-0', () => {
    const input = `<div style="min-height: 0">g</div>`;
    expect(runOn(input)).toBe(`<div class="min-h-0">g</div>`);
  });

  test('min-height:0 (no space) → min-h-0', () => {
    const input = `<div style="min-height:0">g2</div>`;
    expect(runOn(input)).toBe(`<div class="min-h-0">g2</div>`);
  });

  test('padding: 100px; text-align: center → p-[100px] text-center', () => {
    const input = `<div style="padding: 100px; text-align: center;">h</div>`;
    expect(runOn(input)).toBe(`<div class="p-[100px] text-center">h</div>`);
  });

  test('font-size: 48px → text-[48px]', () => {
    const input = `<div style="font-size: 48px;">i</div>`;
    expect(runOn(input)).toBe(`<div class="text-[48px]">i</div>`);
  });

  test('width: {pct}% with interpolation → style: directive (template literal)', () => {
    const input = `<div style="width: {pct}%">j</div>`;
    const out = runOn(input);
    // Assert via parts to avoid biome's noTemplateCurlyInString on the
    // literal expectation string.
    const dollar = '$';
    expect(out).toContain(`style:width={\`${dollar}{pct}%\`}`);
    expect(out).not.toContain('style="');
  });

  test('color: {expr} pure interpolation → style: directive (expr)', () => {
    const input = `<span style="color: {active ? 'red' : 'blue'}">k</span>`;
    const out = runOn(input);
    expect(out).toContain("style:color={active ? 'red' : 'blue'}");
    expect(out).not.toContain('style="');
  });

  test('merges with existing class attribute', () => {
    const input = `<div class="foo bar" style="color: var(--x)">m</div>`;
    expect(runOn(input)).toBe(`<div class="foo bar text-[var(--x)]">m</div>`);
  });

  test('multiple declarations → multiple classes', () => {
    const input = `<div style="background: var(--landing-paper); color: var(--landing-text-on-paper);">n</div>`;
    expect(runOn(input)).toBe(
      `<div class="bg-[var(--landing-paper)] text-[var(--landing-text-on-paper)]">n</div>`,
    );
  });

  test('unmapped declaration is left in place (whole attr preserved)', () => {
    const input = `<div style="filter: blur(4px)">o</div>`;
    const out = runOn(input);
    expect(out).toBe(input); // no change; unmapped recorded externally
  });

  test('mixed mapped+unmapped → bail (preserved verbatim)', () => {
    // safer-by-default: if we can't map every declaration, we don't
    // touch the attribute at all (avoid silently dropping the unmapped
    // declaration's effect).
    const input = `<div style="color: red; filter: blur(4px)">p</div>`;
    const out = runOn(input);
    expect(out).toBe(input);
  });

  test('text-align: left → text-left', () => {
    const input = `<p style="text-align: left">q</p>`;
    expect(runOn(input)).toBe(`<p class="text-left">q</p>`);
  });

  test('font-weight: 700 → font-bold', () => {
    const input = `<b style="font-weight: 700">r</b>`;
    expect(runOn(input)).toBe(`<b class="font-bold">r</b>`);
  });

  test('padding-top: max(5rem, calc((100vh - 36rem) / 2)) → pt-[...]', () => {
    const input = `<div style="padding-top: max(5rem, calc((100vh - 36rem) / 2));">s</div>`;
    const out = runOn(input);
    // The value should be wrapped in brackets with spaces collapsed.
    expect(out).toContain('pt-[max(5rem,_calc((100vh_-_36rem)_/_2))]');
  });
});
