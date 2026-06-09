# ADR-0001 — Naming kebab-case no sistema de arquivos

- **Status**: Aceito
- **Data**: 2026-06-09

## Contexto

O monorepo tinha naming inconsistente: `packages/ui` já era 100% kebab-case (com export
PascalCase), mas `apps/client/src` tinha ~78% dos componentes em PascalCase (`AppHeader.tsx`)
e helpers/hooks misturando camelCase (`useAuthFields.ts`, `keepSignedInPreference.ts`) com
kebab (`handle-auth-api-error.ts`). Isso cria atrito cognitivo e dificulta busca/codemod.

## Decisão

Todo arquivo e diretório **DEVE** ser **kebab-case**. O identificador exportado mantém a
convenção da linguagem:

- Componentes: arquivo kebab, export **PascalCase** (`app-header.tsx` → `AppHeader`).
  O export precisa ser PascalCase por exigência do JSX/React.
- Hooks: arquivo kebab, export **camelCase** (`use-inbox.ts` → `useInbox`).
- Helpers/utils: arquivo kebab, export **camelCase**.
- Tipos em `types.ts`; testes `*.spec.ts` colocados ao lado do código.

**Exceção**: rotas Expo Router (`apps/client/src/app/**`) seguem a convenção do framework
(`_layout.tsx`, `[id].tsx`, `(grupo)/`) e não são alteradas.

## Alternativas consideradas

- **Manter PascalCase nos componentes**: rejeitado — perpetua a divergência app vs `ui`.
- **kebab também no export**: inviável — JSX exige identificador capitalizado.
- **Pasta por componente** (`app-header/index.tsx`): rejeitado como padrão geral — verboso
  para os componentes simples; permitido pontualmente quando há muitos sub-arquivos.

## Consequências

- Padrão único, alinhado ao que `packages/ui` já praticava.
- Renomeações em massa (~36 arquivos + imports). Histórico do Git preservado via detecção
  de rename (só linhas de import mudam).
- Enforçado por Biome `style/useFilenamingConvention` (`kebab-case`).
