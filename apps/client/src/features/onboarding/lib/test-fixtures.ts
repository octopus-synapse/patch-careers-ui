/**
 * DEV-only deterministic fixtures for the onboarding "test fill" buttons.
 * Pure data — no React, no side effects. Values are chosen to pass the
 * step validators (see `helpers.validateStepFields` + `profile-validation`)
 * and the section content shapes from the backend seed
 * (`work_experience_v1`, `education_v1`). Dates are `YYYY-MM-01` (the
 * month/year picker format). Enum values are the backend SCREAMING_CASE
 * members (`degreeType`: BACHELOR/MASTER…, `status`: COMPLETED…).
 */

import type { FormData, SectionItem } from "../types";
import type { FlowStepId } from "./flow-plan";

/** Randomized per run so the server-side username uniqueness check passes on
 * repeated fills. Matches the username schema `^[a-z0-9_]+$` (3–30, no `__`,
 * no leading/trailing `_`). */
export function makeTestUsername(): string {
  return `testuser${Date.now()}`;
}

/** Fixed real city. The geo step is server-validated (GeoNames), so test-all
 * resolves the canonical label via the geo endpoint; this is the query + a
 * literal fallback for the per-step fill. */
export const TEST_LOCATION_QUERY = "São Paulo";
export const TEST_LOCATION_FALLBACK_LABEL = "São Paulo, São Paulo, Brazil";

/** Form-step fixtures keyed by the flow step that owns the fields. `username`
 * is filled at call time via `makeTestUsername()`, not here. */
export const FORM_FIXTURES: Partial<Record<FlowStepId, FormData>> = {
  location: { location: TEST_LOCATION_FALLBACK_LABEL },
  personal: { fullName: "Maria Oliveira de Souza", phone: "+5511987654321" },
  headline: {
    headline: "Engenheira de Software Plena",
    summary:
      "Engenheira de software com cinco anos de experiência em desenvolvimento web full-stack, com foco em React, Node.js e arquitetura de sistemas escaláveis.",
  },
  links: {
    linkedin: "https://www.linkedin.com/in/maria-oliveira",
    github: "https://github.com/mariaoliveira",
    website: "https://maria.dev",
    portfolio: "https://maria.dev/portfolio",
  },
};

export const EXPERIENCE_ITEMS: SectionItem[] = [
  {
    content: {
      company: "Patch Tech",
      role: "Engenheira de Software Plena",
      startDate: "2022-03-01",
      endDate: "2024-06-01",
      description: "Liderei a migração do app para Expo + React Native Web.",
      achievements: ["Reduzi o tempo de build em 40%", "Migrei 30 telas para a nova stack"],
    },
  },
  {
    content: {
      company: "Loja Online BR",
      role: "Desenvolvedora Júnior",
      startDate: "2020-01-01",
      endDate: "2022-02-01",
      description: "Desenvolvi o checkout e a integração de pagamentos.",
      achievements: ["Integrei 3 gateways de pagamento"],
    },
  },
  {
    content: {
      company: "Startup Educação",
      role: "Estagiária de Desenvolvimento",
      startDate: "2019-06-01",
      endDate: "2019-12-01",
      description: "Apoiei o time de frontend em features de gamificação.",
      achievements: ["Implementei o sistema de pontos"],
    },
  },
];

export const EDUCATION_ITEMS: SectionItem[] = [
  {
    content: {
      institution: "Universidade de São Paulo",
      field: "Ciência da Computação",
      degree: "Bacharelado em Ciência da Computação",
      degreeType: "BACHELOR",
      startDate: "2016-02-01",
      endDate: "2019-12-01",
      status: "COMPLETED",
    },
  },
  {
    content: {
      institution: "FIAP",
      field: "Engenharia de Software",
      degree: "Mestrado em Engenharia de Software",
      degreeType: "MASTER",
      startDate: "2020-02-01",
      endDate: "2021-06-01",
      status: "COMPLETED",
    },
  },
];

/** The section items a section flow step should be filled with. */
export function fixtureItemsFor(flowStepId: FlowStepId): SectionItem[] | undefined {
  if (flowStepId === "experience") return EXPERIENCE_ITEMS;
  if (flowStepId === "education") return EDUCATION_ITEMS;
  return undefined;
}

/** The form fixture for a form flow step, injecting a fresh username. */
export function fixtureFormFor(flowStepId: FlowStepId): FormData | undefined {
  if (flowStepId === "username") return { username: makeTestUsername() };
  return FORM_FIXTURES[flowStepId];
}
