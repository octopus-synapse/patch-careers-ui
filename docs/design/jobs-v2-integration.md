# Jobs v2 no aplicativo

A implementação desktop de `/jobs` e `/job/[id]` usa a versão atual de `jobs-demo-v2` como referência. A demo permanece independente. Os componentes `.web.tsx` selecionam a experiência nova a partir de 1024 px; as telas anteriores continuam atendendo mobile e native.

## Comportamento

- Navbar **Início / Home** e abas **Vagas**, **Candidaturas**, **Salvas**.
- Link ou descrição primeiro; escolha de documento depois, no mesmo bloco. O rascunho é salvo com debounce por usuário. Voltar preserva o conteúdo.
- Carta com contexto pessoal, revisão e edição; currículo com os trechos personalizados e download do PDF completo. Ambos usam versões reais do serviço de currículos. Abrir novamente um documento guardado não solicita outra geração.
- Três agrupamentos, quatro cards por carrossel, setas laterais, teclado e “Ver todas”. Filtros confirmados juntos; fechar o modal descarta alterações. Os parâmetros da URL mantêm a seleção ao navegar entre abas e grupos.
- Recomendadas vêm do worker existente. Enquanto não houver recomendações, o catálogo real é ordenado pelos scores disponíveis. “Vagas semelhantes às suas salvas” usa termos dos cargos do catálogo carregado, excluindo vagas já salvas; “Ver todas” permite carregar outras páginas. O histórico mostra as últimas 50 visitas.
- Salvas usa a API de favoritos. Candidaturas reúne registros existentes e preparações em quatro etapas; mover uma preparação é uma organização pessoal, enquanto a confirmação de candidatura externa continua usando a API existente.
- Match usa exclusivamente o currículo marcado como primary, com cache compartilhado entre cards e detalhes por currículo, atualização e vaga. Requisições são deduplicadas em lotes de até 20. Sem master ou sem score disponível, exibe `—`. As cores vêm dos thresholds existentes no pacote de tokens.
- Sem campo de salário; o texto original da descrição é preservado.

## Persistência e integração

O estado de interface é guardado no endpoint autenticado `/v1/me/ui-state`, em chaves `jobs.v2.composer` e `jobs.v2.entry.<id>`. Inclui importações privadas, histórico, etapa de preparação, referências das versões e edições da carta. Colar uma vaga não publica uma vaga no catálogo. Currículos personalizados permanecem no serviço de versões; o texto exibido na revisão é a personalização, e o PDF é a versão completa.

O backend em `profile-services` acompanha esta alteração:

1. `GET /v1/jobs/external/:id` resolve links diretos e snapshots salvos pertencentes ao usuário, incluindo a recuperação após recarregar a página.
2. Busca por localização e descrição no catálogo; `listingId` nas salvas permite recuperar o match da vaga ativa.
3. `companyDomain` derivado do site do empregador, sem usar o domínio de um agregador como identidade da empresa.
4. `candidateContext` opcional no tailor, separado da descrição da vaga e reservado à carta.

Os contratos OpenAPI e o SDK foram atualizados. É necessário executar as duas aplicações com essas alterações; não há migração de banco nesta entrega.

## Logos

Usa `EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY`. URLs estáveis de 128 px/PNG são reutilizadas em cards, detalhes e preparação. As imagens carregam quando se aproximam da área visível. Falhas mostram iniciais e não são repetidas a cada montagem durante a sessão.

Quando o domínio não está nos dados da vaga, a busca exata por empresa reaproveita o cache de 24 horas no cliente e o cache existente de Brand Search no backend. Domínios ambíguos mantêm as iniciais.

**O cache dos bytes das imagens ainda é o cache HTTP do navegador.** O armazenamento compartilhado em S3/MinIO continua condicionado à licença de self-hosting descrita em [jobs-demo-v2-spec.md](./jobs-demo-v2-spec.md#logos-demo-e-cache-compartilhado-futuro). Esta integração não ativa esse armazenamento nem presume que a conta já tenha a licença.

## Validação

- TypeScript do cliente e do backend, verificações de arquitetura e paridade de idiomas.
- Testes unitários de descoberta, parâmetros de navegação, lotes de match, recuperação por ID, propriedade dos snapshots, domínio do empregador e contexto da carta.
- Playwright em `apps/client/e2e/jobs/jobs-desktop.spec.ts`: filtros, paginação, quatro cards, favoritos e reversão de falha, links diretos, preparação, reuso de versões, edição da carta, recarga, quadro de candidaturas, inglês e ausência de master.

Os testes de navegador interceptam as APIs e as imagens com fixtures. Validam o comportamento e os contratos consumidos sem gastar créditos de geração ou requests da Logo.dev; não são uma validação do provedor de IA ou do PDF em produção.

Para executar os testes com um Metro exclusivo:

```sh
PATCH_CAREERS_E2E_PORT=8083 pnpm exec playwright test --config apps/client/playwright.config.ts jobs/jobs-desktop.spec.ts
```
