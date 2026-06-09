# ADR-0004 — Regra de estado de 3 camadas

- **Status**: Aceito
- **Data**: 2026-06-09

## Contexto

Não havia regra formal de quando usar Zustand, React Query ou estado local. Surgiu a proposta
de usar "só Zustand + React Query, sem estado local". Isso é uma sobre-correção: estado efêmero
de UI no Zustand vira anti-padrão (re-renders desnecessários, store virando gaveta, componentes
não-reutilizáveis, perda da limpeza automática do unmount).

## Decisão

O critério é **escopo e dono do estado**, não a lib:

| Estado | Ferramenta |
|---|---|
| Server (vem/volta do backend) | React Query — cache é a fonte da verdade; nunca duplicar em Zustand/`useState`; mutation invalida query |
| Global / persistente de cliente | Zustand — vários pontos precisam, sobrevive ao unmount, ou persiste |
| Local / efêmero | `useState`/`useReducer` |
| Forms | React Hook Form + Zod (ver ADR-0005) |

Caso de fronteira (compartilhado num subtree, porém efêmero — ex.: rascunho do wizard entre
steps) → **Zustand escopado**, descartado ao sair do fluxo.

## Consequências

- A dor real (forms com muitos `useState`) é resolvida por RHF, não jogando estado no Zustand.
- O store global fica enxuto (só auth, color-scheme, locale, consent + escopados).
- Estado local volta a ser a ferramenta padrão p/ UI efêmera.
