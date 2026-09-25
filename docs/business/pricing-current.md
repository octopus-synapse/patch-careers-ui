# Pricing Patch Careers — 24 set. 2026

| Plano | Cartão mensal | Pix por 3 meses | Pix por 12 meses | Uso mensal |
| --- | ---: | ---: | ---: | --- |
| Patch Free | Grátis | — | — | Perfil e CV, PDF, exploração de vagas, 20 ações de tradução por IA |
| Patch Go | R$ 39,99 | R$ 109,90 | R$ 399,90 | Recursos Free, Match e notas explicadas, 50 preparações de CV para vaga |
| Patch Max | R$ 150,00 | R$ 399,90 | R$ 1.199,90 | Mesmos recursos do Go, 200 preparações |

O cartão renova mensalmente. O Pix é pré-pago e já inclui desconto: no Go, equivale a R$ 36,63/mês no trimestre ou R$ 33,33/mês no ano; no Max, equivale a R$ 133,30/mês no trimestre ou R$ 99,99/mês no ano. Enquanto houver vagas da oferta fundador, o Max anual por Pix custa R$ 999,90.

Uma preparação é debitada por geração de versão de CV para uma vaga. Falhas de geração devolvem a unidade. Go e Max usam o ciclo de cobrança da Stripe; Free renova suas ações de tradução no primeiro dia de cada mês UTC. Traduções em cache não consomem a cota. O CV preparado pode escolher português, inglês ou detectar o idioma da vaga. Quando é outro idioma, o backend conclui a tradução do CV antes do preparo e usa a versão localizada no PDF. A carta acompanha a preparação quando há fatos suficientes para gerá-la.

No cadastro em `/auth`, a pessoa escolhe Free, Go ou Max depois de verificar o e-mail. Para Go e Max, escolhe também cartão mensal ou uma das durações pré-pagas no Pix. Toda conta nasce no Free; a escolha paga abre o Checkout Transparente do Mercado Pago após criar a conta e iniciar a sessão. O acesso pago só começa após a confirmação do provedor.

As ofertas atuais são cobradas em BRL. O cartão cria uma assinatura recorrente; o Pix concede acesso pré-pago pelo prazo escolhido. Uma troca de plano aplica o valor não utilizado como crédito Patch, e a renovação do cartão pode ser cancelada sem encerrar o acesso já pago.

## Ativação

O backend mantém `BILLING_ENABLED=false` por padrão. Para abrir a cobrança, configurar as credenciais separadas de Orders e Subscriptions do Mercado Pago, suas chaves públicas e segredos de webhook, `AI_COST_BRL_PER_USD` e `FRONTEND_URL`; depois definir `BILLING_ENABLED=true`. `BILLING_CARD_ENABLED` e `BILLING_PIX_ENABLED` funcionam como kill switches independentes. Aplicar as migrações e testar cartão, Pix, troca de plano, cancelamento, renovação, limites, crédito e estorno antes de ativar cobranças reais.

## Custos de IA

O ledger `patch_ai_usage` registra operações com tokens e custo em USD/BRL estimado pela taxa de câmbio configurada. `GET /api/v1/billing/ai-cost-report` exige permissão administrativa `platform:stats_read` e mostra custo mediano e p95 por usuário com uso precificado, por plano, nos últimos 30 dias. Operações de modelo sem tarifa cadastrada aparecem como `unpricedOperations`. Logs alertam quando um usuário cruza 50%, 75% e 100% das metas de custo por ciclo: Free R$ 1, Go R$ 8 e Max R$ 30. Essas metas são alertas, não limites de serviço. A medição e o câmbio são estimativas operacionais, não extrato financeiro.

As taxas efetivas do Mercado Pago, impostos, reembolsos e suporte devem entrar na revisão de margem antes de alterar preços. O custo de IA ainda depende da composição de uso e das tarifas efetivas de cada modelo; acompanhar a cobertura do ledger e os percentis após o piloto.
