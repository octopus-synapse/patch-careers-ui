# Pricing Patch Careers — 21 set. 2026

| Plano | Brasil | Outros países | Uso mensal |
| --- | ---: | ---: | --- |
| Patch Free | Grátis | Grátis | Perfil e CV, PDF, exploração de vagas, 20 ações de tradução por IA |
| Patch Go | R$ 39,99 | US$ 9,99 | Recursos Free, Match e notas explicadas, 50 preparações de CV para vaga |
| Patch Max | R$ 150,00 | US$ 34,99 | Mesmos recursos do Go, 200 preparações |

Uma preparação é debitada por geração de versão de CV para uma vaga. Falhas de geração devolvem a unidade. Go e Max usam o ciclo de cobrança da Stripe; Free renova suas ações de tradução no primeiro dia de cada mês UTC. Traduções em cache não consomem a cota. O CV preparado pode escolher português, inglês ou detectar o idioma da vaga. Quando é outro idioma, o backend conclui a tradução do CV antes do preparo e usa a versão localizada no PDF. A carta acompanha a preparação quando há fatos suficientes para gerá-la.

No cadastro em `/auth`, a pessoa escolhe Free, Go ou Max depois de verificar o e-mail. Toda conta nasce com um registro explícito no Free; a escolha paga abre o Checkout após criar a conta e iniciar a sessão. O acesso pago só começa após o webhook da Stripe confirmar a assinatura. A migração `20261220000000_backfill_patch_free` atribui Free às contas antigas sem assinatura e preserva assinaturas já vinculadas à Stripe.

O país de cobrança declarado define a moeda. Brasil usa BRL; os demais países usam USD. O Checkout exige endereço de cobrança. Se o país final divergir do declarado, o webhook cancela a assinatura e pede reembolso da cobrança. Upgrade é faturado imediatamente com rateio; downgrade e cancelamento têm efeito no próximo ciclo. A troca entre Go e Max ocorre no portal Stripe.

## Ativação

O backend mantém `PATCH_GO_ENABLED=false` até que as quatro Price IDs mensais tenham sido criadas na Stripe com valor e moeda idênticos à tabela. Configurar `STRIPE_PRICE_BRL_MONTHLY`, `STRIPE_PRICE_USD_MONTHLY`, `STRIPE_PRICE_MAX_BRL_MONTHLY`, `STRIPE_PRICE_MAX_USD_MONTHLY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `AI_COST_BRL_PER_USD`. Aplicar as migrações e cadastrar `/api/v1/billing/stripe-webhook` para `checkout.session.completed` e `customer.subscription.created/updated/deleted`. O backend valida preço e país antes de liberar acesso. Testar os dois mercados, troca de plano, cancelamento, renovação, limites e reembolso em modo teste antes de ativar cobranças reais.

## Custos de IA

O ledger `patch_ai_usage` registra operações com tokens e custo em USD/BRL estimado pela taxa de câmbio configurada. `GET /api/v1/billing/ai-cost-report` exige permissão administrativa `platform:stats_read` e mostra custo mediano e p95 por usuário com uso precificado, por plano, nos últimos 30 dias. Operações de modelo sem tarifa cadastrada aparecem como `unpricedOperations`. Logs alertam quando um usuário cruza 50%, 75% e 100% das metas de custo por ciclo: Free R$ 1, Go R$ 8 e Max R$ 30. Essas metas são alertas, não limites de serviço. A medição e o câmbio são estimativas operacionais, não extrato financeiro.

As taxas de cartão, Billing, impostos, reembolsos e suporte devem entrar na revisão de margem antes de alterar preços. O custo de IA ainda depende da mix de uso e das tarifas efetivas de cada modelo; acompanhar a cobertura do ledger e os percentis após o piloto.

Usando como hipótese [3,99% + R$ 0,39 por pagamento nacional e 0,7% de Billing](https://stripe.com/br/pricing), as metas máximas de IA de R$ 8 no Go e R$ 30 no Max deixam aproximadamente 74% e 75% da receita, respectivamente, após essas taxas e IA. Para chegar a 80% nessas mesmas hipóteses, a IA teria de ficar abaixo de aproximadamente R$ 5,73 por usuário Go e R$ 22,58 por usuário Max. Esses cálculos não incluem impostos, infraestrutura, chargebacks ou suporte.
