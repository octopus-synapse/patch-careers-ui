<!--
  EXAMPLE — como ficaria social/network/+page.svelte usando api-client-2 (Kubb).

  Compare com apps/web/src/routes/[[lang=lang]]/social/network/+page.svelte
  (Orval) que tem 4 narrowings `'X' in data ? ...` espalhados.

  4 layers do Kubb em uso aqui:
    📦 models — type imports (zero runtime, só tipagem de prop/derived)
    🪝 hooks — `create*` reactivos pro client (svelte-query)
    🔌 clients — fns plain pra SSR e paginação manual
    🛡️ zod — opcional, validação de runtime de fonte externa
-->
<script lang="ts">
import { browser } from '$app/environment';
import { useQueryClient } from '@tanstack/svelte-query';

// 📦 MODELS — só tipos, sem runtime
import type {
  SocialConnectionsUsersMeConnections200,
  SocialConnectionsUsersMeNetworkSummary200,
} from 'api-client-2';

// 🪝 HOOKS — svelte-query reactivos no client
import {
  createSocialConnectionsUsersConnect,
  createSocialConnectionsUsersMeConnectionsSuggestions,
  createSocialConnectionsUsersMeNetworkSummary,
  socialConnectionsUsersMeConnectionsSuggestionsQueryKey,
} from 'api-client-2';

// 🔌 CLIENTS — fns plain pra paginação manual + SSR
import { socialConnectionsUsersMeConnections } from 'api-client-2';

// 🛡️ ZOD — opcional, só pra cenário de validar resposta de fonte externa
import { socialConnectionsUsersMeNetworkSummaryQueryResponseSchema } from 'api-client-2/zod';

const queryClient = useQueryClient();

// ─── Reactivo ────────────────────────────────────────────────────
// HOOK summary — sem narrowing, sem cast. data já é o body desempacotado.
const summaryQuery = createSocialConnectionsUsersMeNetworkSummary({}, {
  query: { enabled: browser },
});

const summary: SocialConnectionsUsersMeNetworkSummary200 | undefined = $derived(
  summaryQuery.data,
);

// HOOK suggestions
const suggestionsQuery = createSocialConnectionsUsersMeConnectionsSuggestions(
  { page: '1', limit: '20' },
  { query: { enabled: browser } },
);

// MUTATION connect — invalidar suggestions após sucesso
const connectMutation = createSocialConnectionsUsersConnect({
  mutation: {
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: socialConnectionsUsersMeConnectionsSuggestionsQueryKey({ page: '1', limit: '20' }),
      });
    },
  },
});

// ─── Paginação manual ──────────────────────────────────────────
// CLIENT plain pra carregar páginas extras sem refetch via hook.
let extra = $state<SocialConnectionsUsersMeConnections200['connections']['data']>([]);
let pageNum = $state(1);

async function loadMore() {
  const next = pageNum + 1;
  const res = await socialConnectionsUsersMeConnections({
    page: String(next),
    limit: '10',
  });
  // res JÁ é o body. NÃO precisa narrowing. NÃO precisa `'data' in res`.
  extra = [...extra, ...res.connections.data];
  pageNum = next;
}

// ─── Validação opcional ────────────────────────────────────────
// ZOD pra validar payload de fonte externa (webhook, import).
function importExternal(rawJson: unknown) {
  const parsed = socialConnectionsUsersMeNetworkSummaryQueryResponseSchema.parse(rawJson);
  // parsed é tipado como SocialConnectionsUsersMeNetworkSummary200, validado em runtime.
  console.log(parsed.stats.connections);
}
</script>

<!-- USO DOS DADOS — direto, sem narrowing -->
{#if summaryQuery.isLoading}
  <p>Carregando...</p>
{:else if summary}
  <header>
    <h1>Minha rede</h1>
    <ul>
      <li>Conexões: {summary.stats.connections}</li>
      <li>Seguidores: {summary.stats.followers}</li>
      <li>Seguindo: {summary.stats.following}</li>
      <li>Convites pendentes: {summary.stats.pendingInvitations}</li>
    </ul>
  </header>

  <section>
    <h2>Convites ({summary.pendingRequests.total})</h2>
    {#each summary.pendingRequests.data as request}
      <article>
        <p>{request.requester?.name ?? request.requester?.username}</p>
        <button onclick={() => connectMutation.mutate({ userId: request.requesterId })}>
          Conectar
        </button>
      </article>
    {/each}
  </section>

  <section>
    <h2>Conexões ({summary.connections.total})</h2>
    {#each [...summary.connections.data, ...extra] as connection}
      <article>{connection.user?.name ?? connection.user?.username}</article>
    {/each}
    <button onclick={loadMore}>Carregar mais</button>
  </section>
{/if}
