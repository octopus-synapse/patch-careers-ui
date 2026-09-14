/**
 * ADR-0011 — interface locale and content locale never get inferred from
 * each other.
 *
 * The two mistakes this pins were both live in the audit that produced the
 * ADR: the sections hook silently falling back to `useI18n()` for the
 * catalog's language, and the manager's subtree reading the app's locale for
 * chrome that belongs to the document. Both are structural, so the check is
 * structural: a handful of source assertions, not a heuristic over every
 * component.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const src = (rel: string): string => readFileSync(path.join(__dirname, "..", rel), "utf8");

describe("ADR-0011 — two locales", () => {
  it("useResumeSections takes both locales and never reads the app's own", () => {
    const hook = src("features/sections/hooks/use-resume-sections.ts");
    // The import, not the word — the header comment is allowed to name the rule.
    expect(hook).not.toMatch(/from "@\/providers\/i18n-provider"/);
    expect(hook).toMatch(/locales: SectionLocales/);
    expect(hook).toMatch(/\{ locale: locales\.chrome \}/);
  });

  it("the sections manager scopes an I18nProvider to the surface's chrome locale", () => {
    const manager = src("features/sections/components/resume-sections-manager.tsx");
    expect(manager).toMatch(/<I18nProvider locale=\{props\.locales\.chrome\}>/);
  });

  it("no caller hands the hook a bare locale or a `useI18n()` locale as content", () => {
    const callers = [
      "features/profile/components/master-add-section.tsx",
      "features/profile/components/master-sections-tab.tsx",
      "features/profile/components/section-detail-screen.tsx",
      "features/profile/components/profile-gaps-card.tsx",
      "features/profile/components/profile-screen.tsx",
      "features/resumes/components/resume-detail-screen.tsx",
      "features/resumes/components/create-resume-wizard.tsx",
    ];
    for (const rel of callers) {
      const text = src(rel);
      // `useResumeSections(id, locale)` — the pre-ADR shape.
      expect(text, rel).not.toMatch(/useResumeSections\([^,]+,\s*[a-zA-Z.]+Locale\w*\)/);
      // Content is never the app's locale outright; it is the resume's, with
      // the app's only as the fallback when the resume has none.
      expect(text, rel).not.toMatch(/content:\s*uiLocale\s*[,}]/);
      expect(text, rel).not.toMatch(/content:\s*locale\s*[,}]/);
    }
  });
});
