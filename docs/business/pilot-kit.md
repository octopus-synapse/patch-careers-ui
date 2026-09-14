# Kit do piloto Patch Go

Use este roteiro junto do [plano de oito semanas](./patch-go-8-weeks.md). Nenhuma linha abaixo representa entrevista, pagamento ou intenção de compra já observada.

## Convite para entrevista

> Estou pesquisando como pessoas em busca ativa de trabalho escolhem vagas e preparam candidaturas. A conversa dura 20 minutos; não vou vender nada durante a entrevista. Procuro quem se candidatou a pelo menos uma vaga nos últimos 90 dias. Você toparia contar como foi sua busca? Não preciso de dados pessoais nem do currículo sem ocultar informações sensíveis.

Enviar apenas por canais em que o contato seja permitido e com consentimento para retorno. Recrutar fora de amigos e familiares. Marcar `fonte`, `data` e `segmento` para não confundir uma amostra de conveniência com o mercado.

## Roteiro Mom Test (perguntar uma de cada vez)

1. Qual foi a última vaga à qual você se candidatou, aproximadamente quando e onde a encontrou?
2. O que você fez desde encontrar a vaga até enviar a candidatura? Peça o passo a passo, com tempo gasto em cada etapa.
3. Qual parte deu mais trabalho ou foi abandonada? Peça um episódio específico.
4. O que você usou para entender se valia a pena se candidatar? Pergunte o que fez quando os requisitos não estavam claros.
5. Você alterou currículo ou escreveu carta para aquela vaga? Como e por quê? Se não fez, o que impediu?
6. Quais ferramentas, pessoas ou serviços usou nos últimos 90 dias para resolver isso? O que pagou, quando e quanto? Se não pagou, qual foi a alternativa?
7. Houve uma candidatura recente que não concluiu? O que aconteceu?
8. Mostraria uma vaga e uma versão anonimizada do currículo usados nessa busca? Observe o fluxo, sem pedir dados sensíveis.
9. O que fez depois de enviar a candidatura para acompanhar o resultado?
10. Se pudesse mudar apenas uma etapa da próxima candidatura, qual tarefa real escolheria? Por que essa tarefa?

Não contar elogio, resposta hipotética ou “eu pagaria” como venda. Depois da entrevista, pode demonstrar o Patch e oferecer o Checkout real. Registrar pagamento confirmado via webhook como compra; registrar recusa e motivo sem pressionar.

## Registro mínimo por pessoa

| Campo | Registro permitido |
| --- | --- |
| `id` | Código pseudônimo, sem nome/e-mail na planilha de análise |
| `fonte`, `data`, `segmento` | Canal de recrutamento, data, cargo/nível/país da busca |
| `tarefa_recente` | Uma candidatura ou preparação que realmente ocorreu |
| `frequencia`, `tempo` | Quantidade aproximada de vagas e minutos por preparação |
| `alternativa`, `gasto_real` | Ferramenta/serviço usado e valor efetivamente pago |
| `dor_observada` | Problema concreto, com exemplo e custo para a pessoa |
| `acao_patch` | Criou CV, viu Match, preparou vaga, iniciou Checkout, pagou ou voltou |
| `objecao`, `retorno_autorizado` | Motivo da recusa e consentimento para contato futuro |

## Painel semanal do piloto

Usar contagens de **pessoas únicas por semana e canal**, com a mesma definição em todas as semanas. Checkout iniciado e pagamento confirmado são etapas diferentes. Cobrança e renovação vêm do Stripe/registro de assinaturas; não estimar a partir de cliques. Para as demais etapas, uma planilha manual com IDs pseudônimos basta no início.

| Semana/canal | Entrevistas elegíveis | Contas | CV utilizável | Match visto | Preparação iniciada | Checkout iniciado | Pagamentos confirmados | 1ª preparação paga | 2ª preparação paga | Renovações | Reembolsos | Gasto de aquisição | Custo de IA |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Piloto / preencher | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | R$ 0 | R$ 0 |

Anotar separadamente a definição do canal (indicação, conteúdo próprio, contato direto permitido ou anúncio) e o custo da VPS. `CAC = gasto de aquisição / novos pagantes desse canal`, quando o denominador for maior que zero. `Margem de contribuição por pagante = receita recebida - taxas de pagamento - IA variável - estornos e suporte variável`. Não somar investimento recebido à receita. Não reportar taxa de conversão se o denominador não foi medido.

## Decisão semanal

Ao fim de cada semana, escrever em cinco linhas: o que pessoas **fizeram**, quantas pagaram, quantas voltaram, o maior abandono observado e qual hipótese será testada na semana seguinte. Se as primeiras dez entrevistas não revelarem uma tarefa recorrente ou se ninguém comprar após uma oferta clara, revisar segmento e problema antes de adicionar recursos. Mesmo com cinco primeiros pagamentos, esperar uso repetido e renovação antes de escalar anúncios ou iniciar a oferta para recrutadores.
