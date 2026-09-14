# Patch Go — plano de receita e validação (14 set. 2026)

## Decisão e hipótese

**Vale testar como negócio, mas ainda não há evidência de que sustente a renda principal.** O produto já reúne currículo, vagas e Match. A hipótese vendável é: *uma pessoa em busca ativa de trabalho paga para preparar, revisar e acompanhar candidaturas a vagas relevantes em menos tempo, sem inventar experiência nem depender de exposição social no LinkedIn*. O benefício a medir é **tempo poupado e decisões melhores**, não entrevistas ou contratações prometidas.

O cliente inicial é o **candidato brasileiro em busca ativa**, começando com uma coorte estreita que possa ser alcançada diretamente (por exemplo, profissionais de tecnologia em transição ou recolocação). O Match gratuito é uma estimativa explicada de compatibilidade entre perfil/currículo e vaga; não é probabilidade de entrevista nem avaliação da personalidade da pessoa. O Fit é opcional e deve expressar preferências concretas de trabalho, sem penalizar introversão. A empresa/recrutador entrará **depois de tração paga de candidatos** e buscará pessoas da própria base Patch, conforme decisão do fundador.

O posicionamento inicial é **Patch Go: R$ 69/mês no Brasil, 30 preparações de vaga por ciclo de cobrança**. Cada preparação entrega versão de currículo, carta de apresentação quando o modelo conseguir gerá-la a partir de fatos reais, e revisão antes da candidatura externa. O plano gratuito mantém perfil/CV, descoberta de vagas e Match inicial; ofertas e limites gratuitos devem ser escritos de forma idêntica na página, no produto e nos termos antes de ativar cobranças. US$ 19/mês é um experimento posterior para o mercado internacional, não uma projeção de receita.

[Teal+](https://www.tealhq.com/pricing) já oferece Match, currículo e cartas de apresentação; portanto, esses recursos isolados **não constituem vantagem competitiva demonstrada**. A vantagem a testar é a qualidade da explicação do Match, o fluxo integrado e a adequação ao candidato brasileiro. Os 263 registros de [métricas internas](../research/metricas.json) são pistas de pesquisa e copy: há 80 registros com `contestado: true` (o metadado diz 79), e nenhum deles prova disposição a pagar pelo Patch. Evitar usar alegações como “ATS descarta 75%” ou “6× mais entrevistas” sem fonte primária e validade para este produto.

## Meta financeira: hipótese, não promessa

A meta pessoal do fundador é R$ 5–10 mil/mês em até oito semanas, com cerca de R$ 1 mil/mês de orçamento próprio. A [tabela pública da Stripe Brasil](https://stripe.com/br/pricing), consultada em 14 set. 2026, mostra 3,99% + R$ 0,39 por cartão nacional e 0,7% do volume no Billing. Em R$ 69, isso deixa **aprox. R$ 65,37** após essas tarifas, antes de IA, hospedagem, impostos, estornos e suporte. Não contabilizar dinheiro de investidor como receita de cliente.

Para planejar, **supondo** R$ 3 de IA por assinante/mês e R$ 1 mil de custos fixos/mês, sem tributos, o resultado operacional seria `62,37 × assinantes ativos pagos − 1.000`:

| Assinantes pagos ativos | Receita bruta/mês | Resultado hipotético antes de tributos |
| ---: | ---: | ---: |
| 20 | R$ 1.380 | R$ 247 |
| 50 | R$ 3.450 | R$ 2.119 |
| 100 | R$ 6.900 | R$ 5.237 |
| 177 | R$ 12.213 | R$ 10.040 |

São **cerca de 97 e 177 assinantes** para R$ 5 mil e R$ 10 mil nesse modelo. O custo de IA de R$ 3 é só uma hipótese; medir custo real por preparação e recalcular a tabela. A renda pessoal líquida exigirá margem maior após tributos e retirada. Se a conversão de visitante qualificado para pagante fosse 2%, 100 pagantes exigiriam ~5.000 visitantes qualificados; essa conversão também é uma hipótese, não dado observado. Portanto, o prazo de dois meses é um alvo agressivo, não um cenário base comprovado.

## Mom Test: validar comportamento passado

Entrevistar **10 pessoas que procuraram emprego nos últimos 90 dias**, recrutadas fora de amigos/família, idealmente 5 que pagaram por alguma ajuda e 5 que não pagaram. Registrar somente respostas sobre fatos: cargo/nível, data da busca, quantas vagas reais, canal, horas por semana, maior obstáculo concreto, ferramentas que abriram, último serviço comprado, valor pago, motivo de parar, exemplo de vaga em que teriam usado o Patch. Pedir que mostrem uma vaga e um currículo que já usaram, com dados sensíveis ocultados. Não perguntar “você usaria?”, “gostou da ideia?” ou “pagaria R$ 69?” como evidência de compra. Apresentar a oferta e o Checkout **após** entender o comportamento; somente pagamento concluído conta como compra.

Ficha por entrevista: ID pseudônimo; fonte de recrutamento; data; busca recente verificável; gasto anterior; alternativa atual; dor e frequência; citação curta autorizada; ação concreta no Patch (criou CV, analisou vaga, preparou, pagou); objeção; próximo contato consentido. Não registrar nome ou currículo bruto na planilha de decisão. O fundador não precisa inventar uma busca de emprego própria: sua experiência com LinkedIn/Gupy é motivação, não prova de demanda.

Critérios de leitura das 10 conversas: pelo menos 6 relatando a mesma tarefa onerosa nos últimos 90 dias e pelo menos 3 com gasto real ou tentativa custosa de resolver o problema justificam testar a oferta. Menos que isso pede mudança de segmento/problema. Mesmo com 10 entrevistas positivas, **a validação principal é pagamento real e uso repetido**.

## Aquisição e experimento de oito semanas

| Semana | Ação concreta | Evidência para avançar |
| --- | --- | --- |
| 1 | Conferir fluxo ponta a ponta com 3 currículos e 10 vagas reais; corrigir texto do Match; instrumentar funil simples; recrutar as primeiras 5 entrevistas. | Sem erros de cobrança/acesso; nenhuma experiência inventada; feedback de tarefa real. |
| 2 | Completar 10 entrevistas; publicar demonstração de 90 segundos com antes/depois revisável; convidar 30 pessoas em busca ativa por canais permitidos e próprios. | Pelo menos 10 sessões reais de análise de vaga e 3 usuários que voltam sem lembrete. |
| 3–4 | Abrir cobrança a uma coorte pequena; 30 conversas 1:1 com candidatos elegíveis; testar promessa, onboarding e preço com Checkout real. | Meta experimental: 5 pagamentos concluídos de pessoas sem relação próxima; registrar objeções e reembolsos. |
| 5–6 | Melhorar apenas a etapa de maior abandono; publicar 2 estudos de caso com consentimento e dados verificáveis; repetir canais que trouxeram compradores. | 15–25 assinantes ativos, uso de ao menos 2 preparações por pagante, custo medido. |
| 7–8 | Medir renovação da primeira coorte, recomendação orgânica, margem e atendimento; decidir expandir, ajustar nicho/preço, ou interromper aquisição paga. | Meta agressiva: 50 pagantes; 97 seriam necessários para ~R$ 5 mil no modelo acima. |

Funil mínimo, medido por coorte e canal: visitantes → contas criadas → CV utilizável → Match visto → preparação tentada → Checkout iniciado → pagamento confirmado via webhook → 1ª preparação paga → 2ª preparação → renovação. Medir taxa, tempo e motivo do abandono. O número de contas ou impressões não substitui pagantes. Uma planilha semanal manual basta no piloto; remover informações pessoais e não atribuir resultados às pessoas com base em scores.

Com R$ 1 mil/mês: até R$ 200 em demonstração/testes de criativo, até R$ 300 em aquisição controlada depois dos primeiros pagamentos, até R$ 300 em IA/infra variável e R$ 200 de reserva para suporte/estornos. A VPS e o domínio já pertencem ao projeto, mas contabilizar seu custo real na margem. Não contratar anúncios para escalar antes de conhecer CAC por pagante. Se houver aporte que eleve o orçamento a R$ 3 mil, só liberar a diferença após prova de retenção; aporte não corrige oferta sem demanda.

Interromper anúncios se CAC pago ≥ margem de contribuição esperada dos primeiros três meses, se ninguém renovar, se custo de IA sair do controle, ou se o Match gerar confiança indevida. Não comparar “score antes/depois” com entrevista conseguida sem estudo controlado. Usar feedback de qualidade para corrigir falsos positivos, falta de explicação e vieses do Fit.

## Universidade e recrutador: segunda etapa

A [USCS lista o processo 394/2026](https://licitacao.uscs.edu.br/licitacoes/13) para um portal amplo de talentos/oportunidades. Isso reduz o sentido de vender **substituição do portal** como primeiro passo. Depois da validação B2C, propor um complemento de preparação de candidaturas para **duas turmas de 50 alunos** (100 assentos ajustáveis), com marca institucional discreta e painel **apenas agregado**: ativação, CV concluído, vagas analisadas, preparações e satisfação. Sem ranking individual, diagnóstico de personalidade ou acesso institucional a currículos privados. O desenho comercial, preço e vínculo com a instituição dependem de conversa e processo formal; não há contrato ou intenção de compra comprovada.

Só testar recrutadores depois de candidatos pagantes e base de perfis com consentimento explícito para descoberta. O primeiro caso de uso é pesquisar candidatos na base Patch por condições objetivas da vaga; definir Match de forma simétrica e auditável, com pesos/requisitos explicáveis e opção de contestar dados. O recrutador não pode usar extroversão ou Fit como filtro eliminatório por padrão. O Patch não deve afirmar que o score substitui avaliação humana.

## Condições para ativar pagamentos

O código e o template de produção deixam `PATCH_GO_ENABLED=false` por padrão. Antes de cobrar em produção: criar conta e produtos/preços mensais Stripe BRL/USD correspondentes a R$ 69/US$ 19; cadastrar `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BRL_MONTHLY` e `STRIPE_PRICE_USD_MONTHLY` como **secrets** do repositório backend e só então definir a variável `PATCH_GO_ENABLED=true`; aplicar migração; cadastrar o webhook `/api/v1/billing/stripe-webhook` com os eventos `checkout.session.completed` e `customer.subscription.created/updated/deleted`; testar compra, duplicidade, cancelamento, renovação, falha e limite de 30 em modo de teste; conferir página de termos, política de privacidade, atendimento e tratamento tributário com profissional local. `FRONTEND_URL` já está no template de produção. A página do produto não deve mostrar uma assinatura como ativa até o webhook confirmar. A configuração, dados fiscais e compras reais não podem ser executados com segurança sem a conta do titular.

Oferta, prazo, canais e preços são hipóteses a atualizar com as coortes. A decisão de continuar depende de pagamentos e renovação, não de concluir todo o roadmap.
