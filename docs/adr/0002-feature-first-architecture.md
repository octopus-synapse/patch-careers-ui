# ADR-0002 — Arquitetura feature-first com template fixo e barrel público

- **Status**: Aceito
- **Data**: 2026-06-09

## Contexto

As features (`messages`, `profile`, `onboarding`, `sections`) tinham organização interna
divergente (`profile/data/`, `onboarding/flow/`, arquivos soltos em `sections/`). Não havia
fronteira explícita: qualquer arquivo podia importar o interno de qualquer feature.

## Decisão

1. **Features vivem na app** (`apps/client/src/features/*`). Pacotes `@patch-careers/*`
   existem só para código com **2+ consumidores reais** (rule of three).
2. **Template interno fixo** por feature: `index.ts`, `types.ts`, `components/`, `hooks/`,
   `lib/`, e `model/` opcional.
3. **`index.ts` é a API pública**. Imports de fora da feature **DEVEM** passar pelo barrel;
   nunca por caminho interno. Dentro da feature, relativo curto é permitido.
4. Rotas em `app/` são **wrappers finos** que instanciam a feature.

## Alternativas consideradas

- **Extrair cada feature p/ um pacote**: rejeitado — overhead de setup alto sem ganho real
  enquanto há 1 consumidor. Promoção acontece sob a rule of three.
- **Template flexível**: rejeitado — perde previsibilidade de navegação.
- **Imports livres entre features**: rejeitado — vira acoplamento/spaghetti.

## Consequências

- Navegação previsível; encapsulamento real por feature.
- Compartilhamento entre features força promoção a pacote (evita acoplamento horizontal).
- Fronteira do barrel é enforçada junto com as camadas (ver ADR-0003).
