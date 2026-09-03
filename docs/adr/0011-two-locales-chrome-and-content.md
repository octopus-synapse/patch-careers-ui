# ADR-0011 — Dois locales: interface e conteúdo

- **Status**: Aceito
- **Data**: 2026-09-03

## Contexto

Um currículo passa a existir em dois idiomas (backend ADR-003). Isso cria **dois** locales
que toda tela precisa distinguir, e o app os confundia:

- **locale da interface** — o do app (`useI18n().locale`): botões, títulos de tela, e tudo que
  passa por `t()`;
- **locale do documento** — o do currículo sendo lido (`resume.language`, ou a versão que a
  pessoa escolheu ver): o texto que ela digitou.

Antes deste ADR, `useResumeSections(resumeId, locale)` passava o locale do **documento** para
`GET …/sections/types?locale=`, que devolve os **títulos de seção e rótulos de campo** — ou
seja, trocar o idioma do currículo renomeava "Education" para "Formação Acadêmica" e deixava o
conteúdo intocado. Enquanto isso, datas (`monthLabel`) e enums (`labelFor`) liam
`useI18n()`. O mesmo item mostrava três idiomas de origem.

Não existe dicionário de nomes de seção no cliente (`packages/i18n/.../sections.ts` não tem
"Education"); esses rótulos só vêm do backend, resolvidos por `?locale=`. Portanto a regra tem
de dizer **qual locale vai nesse parâmetro**, por superfície.

## Decisão

A regra é por **superfície**, seguindo o modelo que o LinkedIn usa e o usuário apontou:

| Superfície | Chrome — títulos de seção, rótulos de campo, datas, enums, botões | Conteúdo — o que a pessoa digitou |
|---|---|---|
| **Perfil** (`/profile`, `/u/:username`) | locale da **interface** | locale do **documento** |
| **Documento** (`/curriculos/:id`, PDF, prévia, exportação) | locale do **documento** | locale do **documento** |

O perfil é uma *vista de uma pessoa*; o currículo é um *documento*. Um PDF em inglês diz
"Education"; a tela de perfil de quem usa o app em português, não.

Consequências mecânicas:

1. `useResumeSections` recebe **explicitamente** dois locales (`chromeLocale`, `contentLocale`)
   e faz as chamadas correspondentes — nunca infere um do outro nem de `useI18n()` por dentro.
2. `itemDetail()` / `monthLabel()` / `labelFor()` recebem o locale do chamador; um componente
   de item não lê `useI18n()` para formatar conteúdo.
3. O seletor de idioma do perfil muda **só** o locale do documento. Nada de chrome muda quando
   ele é acionado.
4. A página pública carrega o locale no **caminho** (`/u/…` = pt-BR, `/en/u/…` = en), nunca por
   negociação de cabeçalho — a resposta é cacheada com `Cache-Control: public`.

## Alternativas consideradas

- **Um locale só, o do documento, para tudo no perfil** — rejeitado: é o comportamento
  anterior, e faz "Education" virar "Formação Acadêmica" ao trocar o idioma do currículo.
- **Dicionário local de títulos de seção via `t()`** — rejeitado: o catálogo é dirigido por
  dados do backend (17 tipos, semeados nos dois idiomas em `SectionType.translations`);
  duplicar no cliente cria a terceira fonte de verdade.
- **Interface na tela, documento no PDF, para datas e enums** — rejeitado por ora: dois
  caminhos de render para a mesma peça; a regra por superfície cobre os dois usos.

## Consequências

- Componentes que renderizam conteúdo de currículo declaram de onde vem cada locale; a
  ambiguidade deixa de ser possível por construção.
- Um gate de static-analysis (`chrome-content-locale.spec.ts`, no padrão de
  `no-hardcoded-strings`) reprova componente de `features/sections` e `features/profile` que
  chame `useI18n()` e passe `locale` para `itemDetail`/`monthLabel`/`labelFor` sem um
  `contentLocale` explícito.
- `ProfileGapsCard` e os títulos de `SectionPanelCard` passam a receber o locale da interface
  (antes recebiam o do conteúdo e saíam bilíngues).
