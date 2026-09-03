/**
 * Score ramp — a nota 0–100 vira faixa, e a faixa vira cor.
 *
 * Esta rampa nasceu na landing (`landingScoreRamp`), onde pintava os cartões
 * de nota do protótipo. Ela subiu para cá porque o produto passou a usar a
 * mesma escala: currículo, perfil e match resolvem a cor por aqui, e a landing
 * segue consumindo os mesmos valores por alias em `landing.ts`.
 *
 * As faixas operam sobre a nota CRUA, para que fronteiras fracionadas caiam de
 * forma previsível (84.9 ainda é "good"):
 *
 *   >= 85  excellent
 *   70–84  good
 *   50–69  fair
 *   <  50  poor
 *
 * `ink` é a cor da própria nota (número, traço do anel, preenchimento da
 * barra); `wash` é o fundo tingido para chips e quadros de nota.
 *
 * ATENÇÃO — a faixa NÃO coincide com a letra. `scoreGrade`
 * (`packages/ui/src/internal/score-scale.ts`) espelha o `rankOf()` do backend
 * em 90/80/70/60/50, enquanto a cor quebra em 85/70/50. Uma nota 82 é "A"
 * pintada de âmbar. É intencional: a letra é contrato com o backend, a cor é
 * decisão de produto, e alinhá-las exigiria mexer no ranking servidor.
 */

import type { EditorialTheme } from "./editorial";

/** As quatro faixas em que uma nota cai. */
export type ScoreBand = "excellent" | "good" | "fair" | "poor";

/** Uma faixa: o tom da nota e o fundo tingido que combina com ele. */
export type ScoreBandColor = {
  ink: string;
  wash: string;
};

export const scoreRamp = {
  excellent: { ink: "#1FB27A", wash: "#E3F6EE" },
  good: { ink: "#D9A400", wash: "#FBF3D4" },
  fair: { ink: "#F0743A", wash: "#FDEEE5" },
  poor: { ink: "#E5484D", wash: "#FDECEC" },
} as const satisfies Record<ScoreBand, ScoreBandColor>;

/**
 * Rampa escura: os tons clareiam para sustentar ~4.5:1 sobre os fundos
 * escuros, e os `wash` deixam de ser pastel para virarem tintas profundas de
 * cada matiz — assim o chip de nota lê como painel aceso no papel escuro.
 */
export const scoreRampDark = {
  excellent: { ink: "#4ADE80", wash: "#1D2E28" },
  good: { ink: "#E3B23C", wash: "#332B18" },
  fair: { ink: "#FB923C", wash: "#33241A" },
  poor: { ink: "#F87171", wash: "#3A2222" },
} as const satisfies Record<ScoreBand, ScoreBandColor>;

export const scoreRampPalettes = {
  light: scoreRamp,
  dark: scoreRampDark,
} as const satisfies Record<EditorialTheme, Record<ScoreBand, ScoreBandColor>>;

export function scoreBand(value: number): ScoreBand {
  if (value >= 85) return "excellent";
  if (value >= 70) return "good";
  if (value >= 50) return "fair";
  return "poor";
}
