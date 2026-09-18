# Início / Home — especificação da demo desktop

Decisões consolidadas em 14/09/2026, após as 30 perguntas de design e a confirmação da escala real de cores do match.

## Abrir e configurar

Abra `jobs-demo-v2.html` diretamente no navegador. O HTML carrega seus arquivos locais `jobs-demo-v2.css`, `jobs-demo-v2.data.js` e `jobs-demo-v2.js`; não precisa do backend. A navbar conserva as fontes e o Tailwind CDN da demo original.

Para configurar as imagens das empresas, execute na raiz de `patch-careers-ui`:

```sh
node docs/design/setup-jobs-demo.mjs
```

O script usa `EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY` do ambiente ou de `apps/client/.env` e gera `jobs-demo-v2.config.local.js`, ignorado pelo Git. Ele não lê a chave secreta da logo.dev nem imprime tokens. Sem configuração ou quando uma imagem falha, a empresa aparece com iniciais.

Dados de vagas, match e documentos são ilustrativos. Colar um link simula a preparação da vaga; não extrai o anúncio nem chama IA. O link original continua acessível na página de detalhes. Vagas importadas têm match indisponível, e não recebem um score inventado.

## Estrutura aprovada

- Foco desta entrega: **100% desktop**. O desenho mobile fica para uma próxima etapa.
- Preservar fundo bege/off-white, título serifado e indicador animado de quebra-cabeça na navbar.
- Navbar: **Início** em pt-BR; **Home** em inglês. A futura aplicação conserva a rota `/jobs`.
- Abas internas: **Vagas**, **Candidaturas**, **Salvas**. Vagas é a entrada inicial.
- Vagas começa com o título serifado centralizado acima do campo, sobre o fundo bege da página. O campo para link ou descrição e o botão Continuar ficam lado a lado abaixo do texto de apoio. O campo começa em uma linha e cresce com o conteúdo, até 208 px, quando passa a ter rolagem interna. As opções de documento só aparecem depois de avançar.
- A composição segue a referência de título acima/input abaixo enviada pelo usuário, com as cores e a tipografia do projeto. O indicador numerado 1–2–3 foi removido a pedido do usuário; a progressão guiada continua no próprio bloco.
- O fluxo progride no próprio bloco: vaga → documento → revisão. Voltar conserva o texto anterior. A carta conserva o requisito da demo original de 200 caracteres de contexto pessoal.
- Três grupos, nesta ordem: **Recomendadas para você**, **Vagas semelhantes às suas salvas**, **Continue de onde parou**. O segundo título deve explicar sua relação com as salvas; o comprimento não era o problema apontado pelo usuário.
- Cada grupo usa carrossel com quatro cards visíveis, seta anterior na extremidade esquerda e próxima na direita, centralizadas verticalmente nas laterais dos cards. As setas avançam uma janela de quatro; o link **Ver todas** fica no cabeçalho e abre a grade completa desse grupo. Não há rotação automática.
- Acima dos grupos há um único botão **Filtros**, preto com texto branco e fundo azul ao passar o mouse. Ele abre um modal com busca por cargo/empresa/competência, localização, modelo de trabalho, tipo de contratação e período de publicação. **Aplicar filtros** confirma todas as opções juntas; fechar ou pressionar Escape descarta as alterações. **Limpar filtros** dentro do modal limpa o rascunho, que também precisa ser aplicado.
- Os filtros são globais para os três grupos de Vagas, com seleções visíveis e removíveis. Candidaturas e Salvas mantêm seu próprio conteúdo.
- Candidaturas usa quatro colunas com as etapas já presentes na demo: Em preparação, Pronta para enviar, Enviada e Entrevista. Alterar o seletor move o card para a coluna correspondente.
- Salvas usa quatro cards por linha e novas linhas conforme necessário.
- Cada vaga abre em página própria, com descrição à esquerda e painel de ações à direita. A página inclui score, salvar, preparar currículo, preparar carta, documentos salvos e anúncio original quando disponível.

### Anatomia do card

Logo pequena e circular (borda totalmente arredondada) e empresa no topo, marcador de salvar no canto superior direito, título do cargo em destaque abaixo, localização e modelo de trabalho em texto discreto. O formato circular também aparece nos detalhes e no fluxo de preparação. Tipo de contratação e porcentagem de match fecham o card. Não usar capa grande, etiqueta de modalidade ou campo separado de salário. Se a empresa mencionar remuneração, ela permanece apenas no texto da descrição original.

O título completo está disponível no link e no tooltip; o limite visual de duas linhas mantém a altura dos cards uniforme. O marcador é uma ação independente da navegação para os detalhes.

### Score

A porcentagem aparece sozinha, com cor bem visível e descrição acessível identificando a comparação com o currículo master. A mesma vaga exibe o mesmo valor no card e nos detalhes.

O usuário confirmou reutilizar **quatro cores**, após a inspeção mostrar que a escala compartilhada não tinha os cinco tons inicialmente lembrados:

| Faixa do valor bruto | Cor clara | Cor no tema escuro |
| --- | --- | --- |
| Menor que 50 | `#E5484D` | `#F87171` |
| 50 até menos de 70 | `#F0743A` | `#FB923C` |
| 70 até menos de 85 | `#D9A400` | `#E3B23C` |
| 85 ou mais | `#1FB27A` | `#4ADE80` |

Fonte: `packages/tokens/src/score.ts`. Classificar pelo valor bruto e arredondar apenas a porcentagem exibida: 84,9 tem a cor da faixa abaixo de 85, mesmo aparecendo como 85%. As letras de ranking do backend têm outros cortes e não devem substituir esta escala.

## Comportamento da demo

### Rotas e estado

| Rota no HTML | Tela |
| --- | --- |
| `#/jobs` | Aba Vagas |
| `#/jobs/candidaturas` | Quadro de candidaturas |
| `#/jobs/salvas` | Grade de salvas |
| `#/jobs/group/recommended` | Todas as recomendadas |
| `#/jobs/group/similar` | Todas as semelhantes às salvas |
| `#/jobs/group/recent` | Todo o histórico recente |
| `#/job/:id` | Página da vaga |

As rotas de descoberta guardam os filtros em parâmetros após `?`. “Ver todas” herda os filtros; voltar mantém a origem da navegação. Os IDs das vagas são recuperados do catálogo de fixtures ou das importações locais, permitindo recarregar os detalhes diretamente.

Salvas, histórico, candidaturas, documentos, rascunho do fluxo, idioma e tema são persistidos em `localStorage`, na chave versionada `patch.jobs-demo.v2.v3`. O estado continua funcionando em memória se o armazenamento não estiver disponível. Dados persistidos são validados antes de serem usados. A demo não altera registros de produção.

### Origem dos grupos

- **Recomendadas:** catálogo ilustrativo ordenado pelo match com o master; scores ausentes ficam ao final.
- **Semelhantes às salvas:** outras vagas do catálogo com competências em comum com pelo menos uma salva. Ordenar pela maior interseção com uma salva; desempatar por match e ID. Excluir as próprias vagas salvas. Salvar ou remover uma oportunidade atualiza o grupo.
- **Continue de onde parou:** visitas reais feitas dentro da demo, da mais recente à mais antiga, com um registro por vaga e limite de 50. Começa vazio em um navegador sem histórico.

Os filtros refinam cada conjunto depois de sua seleção. Uma vaga pode aparecer em mais de um grupo porque as intenções dos grupos são distintas. Estados vazios distinguem ausência de histórico, ausência de salvas, falta de similaridade e filtros sem resultados.

### Documentos

O currículo parte de um perfil ilustrativo e a carta incorpora o contexto digitado. A prévia admite edição de texto, cópia, download `.txt` e salvamento na candidatura. Texto do usuário é escapado na renderização; os documentos persistem texto, não HTML arbitrário. Salvar um documento cria uma candidatura ou atualiza a existente; candidaturas em preparação passam a prontas para enviar, preservando etapas posteriores.

## Logos: demo e cache compartilhado futuro

### O que a demo faz

- Um domínio explícito por empresa, sem deduzir a marca pelo domínio do site de candidaturas.
- A mesma URL de 128 px em PNG para card, busca, fluxo e detalhes. Sem timestamps ou parâmetros aleatórios que invalidem cache.
- `IntersectionObserver` e carregamento sob demanda evitam solicitar todas as logos fora da área visível dos carrosséis. A URL compartilhada permite que o navegador reutilize a mesma resposta em várias instâncias.
- Falhas da imagem são lembradas durante a sessão e usam iniciais como alternativa.
- Não armazena arquivos da logo.dev em S3, no repositório, em IndexedDB ou em um service worker. O cache HTTP do navegador é individual, não é o cache compartilhado entre usuários desejado para produção.

A documentação atual da logo.dev informa cache de 24 horas no navegador e recomenda URLs estáveis. Fonte: <https://www.logo.dev/docs/platform/caching>.

### O que já existe no projeto

- `SearchCompaniesUseCase` normaliza consultas e usa `CACHE_PRESETS.CATALOG` (86.400 segundos). Isso economiza chamadas ao **Brand Search**, mas não guarda os bytes das imagens.
- O helper `company-logo.ts` monta uma URL direta de `img.logo.dev` a partir do domínio e da chave pública.
- Há infraestrutura S3/MinIO. O upload atual de logos de currículo usa uma chave por usuário/currículo com UUID; esse fluxo não é um cache global por empresa.

### Arquitetura proposta para a próxima etapa

1. Manter identidade por **domínio normalizado + tamanho + formato**. O domínio deve vir da empresa identificada, como `employer_website` validado, e não de LinkedIn, Gupy ou outro intermediário da candidatura. Sem identidade confiável, usar iniciais.
2. Acrescentar `companyDomain` e `companyLogoUrl` opcionais ao contrato das vagas. Um serviço de logos resolve esses campos usando metadados compartilhados e o armazenamento de objetos.
3. Na primeira consulta sem imagem armazenada, deduplicar downloads simultâneos por domínio/variante entre instâncias. Baixar do host fixo da logo.dev, validar a imagem e guardar os bytes no S3/MinIO existente. Todos os usuários reutilizam a mesma imagem.
4. Guardar metadados duráveis apontando para o objeto. Perder uma entrada do Redis não deve provocar um novo download se os bytes já estiverem armazenados.
5. Usar URLs próprias versionadas pelo conteúdo. Atualizações explícitas de marca criam uma nova versão; navegar ou expirar o cache de busca de empresas não dispara atualização da imagem.
6. Guardar resultados de logo inexistente temporariamente e aplicar espera curta a falhas transitórias. Conservar a última imagem válida quando o provedor estiver indisponível.
7. Medir acertos de cache, chamadas ao provedor, downloads deduplicados e falhas. Aceitação: uma falta concorrente resulta em um download; novos acessos de outros usuários resultam em zero chamadas à logo.dev enquanto a imagem armazenada continuar válida.

**Licença:** armazenar e servir as imagens na própria infraestrutura exige um plano com licença de self-hosting ativa, como Pro, Enterprise ou contrato customizado. A documentação permite armazenar durante a vigência da assinatura. Ativar o cache compartilhado depende dessa condição; esta demo não contrata um plano nem presume que a conta atual já tenha a licença. Fonte: <https://www.logo.dev/docs/platform/self-hosting>.

## Portar para a aplicação real

Esta seção descreve trabalho futuro; os hooks e serviços abaixo não foram alterados pela implementação da demo.

- **Master explícito:** `useDefaultMatchResume` atualmente pode selecionar o currículo com maior qualidade, com o master como alternativa. A nova página deve fornecer `useMasterResumeId()` explicitamente às consultas de match, tanto em listas quanto nos detalhes. Reaproveitar `POST /v1/match/batch`, deduplicar IDs entre grupos e respeitar o limite de 20 pares por lote. Identificar o currículo na chave de cache. O worker de recomendações já utiliza `primaryResumeId`.
- **Detalhe por ID:** a rota real `/job/[id]` atualmente busca vagas nos caches das listagens. Adicionar recuperação de vaga externa por ID no backend e no cliente para permitir abertura direta e recarregamento sem depender de visita anterior à lista. Tratar vagas expiradas ou removidas com retorno para a descoberta.
- **Similaridade de vagas externas:** `FindSimilarJobsUseCase` trabalha com vagas internas e interseção de competências. O novo grupo exige suporte às vagas externas salvas, com dados enriquecidos apropriados. Não presumir que o endpoint interno existente já atende essa finalidade.
- **Histórico:** acrescentar leitura das últimas vagas visitadas por usuário e registrar visitas de forma deduplicada. A mera existência de um evento analítico `job_viewed` não fornece o contrato necessário para a interface. Remover itens expirados durante a recuperação.
- **Localização e filtros:** a listagem externa atual aceita texto, modalidade, contratação e período. Acrescentar localização ao contrato. Aplicar a mesma semântica nos três grupos, antes da paginação; filtrar somente os quatro cards carregados esconderia resultados incorretamente.
- **Documentos e acompanhamento:** conectar o fluxo visual aos serviços existentes de currículo, carta e candidatura; preservar o vínculo entre vaga, usuário e currículo utilizado. Scores exibidos nesta página continuam referentes ao master, mesmo quando houver uma versão personalizada.
- **i18n:** manter Início/Home e os textos novos nos dicionários reais, sem renomear URLs públicas por idioma.

## Validação de aceite

- 1280, 1440 e 1920 px: quatro cards por janela/linha, títulos longos contidos e sem overflow horizontal da página.
- Setas, extremos dos carrosséis e navegação por teclado; “Ver todas” com filtros preservados.
- Salvar/remover em todas as superfícies, atualizar semelhantes e manter estado após recarregar.
- Histórico sem duplicações, detalhes por hash direto, voltar/avançar e vaga desconhecida.
- Link e descrição inválidos, retorno ao texto anterior, cancelamento de preparação e os dois caminhos de documento.
- Editar, copiar, baixar e recuperar documentos salvos, sem criar candidaturas duplicadas.
- Modal de filtros com Escape e retorno de foco; abas operáveis pelas setas do teclado.
- Scores nos limites 50, 70 e 85, incluindo valores fracionados, e score indisponível.
- Logos com chave configurada, sem chave e com falha do provedor; observar reutilização do cache HTTP sem expor tokens nos relatórios.

### Verificação executada em 14/09/2026

Verificação automatizada no Chromium usando o próprio `file://`, com os três tamanhos desktop, navegação, filtros, carrosséis, salvas, etapas das candidaturas, os dois documentos, edição, download, persistência, teclado, idioma e tema. Uma rodada complementar cobriu chave ausente, falha de imagens, armazenamento bloqueado/corrompido, cancelamento de geração, vaga desconhecida e conteúdo colado com marcação HTML. Ambas terminaram sem erros de JavaScript.

Na rodada com o navegador já aquecido, as 34 leituras de imagens observadas foram atendidas pelo cache HTTP. Esse resultado demonstra a reutilização no navegador testado; não equivale a cache compartilhado entre usuários. Os relatórios e capturas locais estão em `.cache/jobs-demo/`, fora do versionamento.

## Registro das preferências

| Pergunta | Resposta / decisão |
| --- | --- |
| 1 | Fundo bege: 5/5. |
| 2 | Título serifado: 5/5. |
| 3 | Capas grandes: 1/5. |
| 4 | Card compacto com logo: 4/5; disposição final refinada nas perguntas 14 e 15. |
| 5 | Visão geral original com candidaturas/salvas/explorar: 1/5. |
| 6 | Abrir diretamente em Explorar: 2/5. |
| 7 | Priorizar vagas agrupadas; candidaturas e salvas não devem ser a entrada. |
| 8 | Recomendadas: 5/5; recentes: 1/5; remotas como grupo: 2/5. |
| 9 | Proposta de Início com três abas e input guiado; alcance dos filtros definido na 14. |
| 10 | Início em pt-BR, Home em inglês. |
| 11 | Campo único reconhecendo link/descrição: 5/5. |
| 12 | Primeiro inserir a vaga, depois escolher o documento. |
| 13 | Etapas no próprio bloco, com Voltar: 5/5. |
| 14 | Carrosséis de quatro cards, Ver todas e filtros globais nos três grupos. |
| 15 | Logo/empresa no topo e cargo abaixo: 5/5. |
| 16 | Salário somente na descrição original, se divulgado pela empresa. |
| 17 | Modelo de trabalho em texto minimalista; não usar etiqueta. |
| 18 | Marcador discreto no canto: 4/5. |
| 19 | Página específica da vaga; match com o master no card e nos detalhes. |
| 20 | Apenas porcentagem e cor forte. Escala real de quatro cores confirmada após inspeção. |
| 21 | Barra de filtros compacta e seleções visíveis: 5/5. |
| 22 | Grupos por área/cargo: 2/5. |
| 23 | Sugestões a partir das salvas: 5/5; título precisava melhorar. |
| 24 | Continue de onde parou: 5/5. |
| 25 | Detalhes em duas colunas: 4/5. |
| 26 | Candidaturas em colunas por etapa: 5/5. |
| 27 | Salvas com quatro cards por linha: 5/5. |
| 28 | Proposta mobile: 2/5; concentrar 100% no desktop. |
| 29 | Indicador de quebra-cabeça: 4/5. |
| 30 | O título deve explicitar semelhança com as salvas; não era uma questão de comprimento. |
