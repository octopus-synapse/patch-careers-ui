<!--
  Application tracker page — per-application event timeline with add-event
  capability. Uses GET /v1/jobs/applications/tracker + POST
  /v1/jobs/applications/:id/events.
-->
<script lang="ts">
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Eye,
  Loader2,
  MessageSquarePlus,
  XCircle,
} from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button, toastState } from 'ui';
import { browser } from '$app/environment';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

type EventType =
  | 'SUBMITTED'
  | 'VIEWED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'OFFER_RECEIVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'FOLLOW_UP_SENT';

interface TimelineEvent {
  id: string;
  type: EventType;
  note: string | null;
  occurredAt: string;
}

interface TrackedApplication {
  id: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
  status: string;
  appliedAt: string;
  /** Backend-computed: anti-ghosting threshold has been crossed. */
  needsFollowUp: boolean;
  /** Days since last recruiter response (or since SUBMITTED if none). */
  daysSinceLastResponse: number | null;
  /** @deprecated kept while backend still emits it. */
  silent?: boolean;
  events: TimelineEvent[];
}

async function quickFollowUp(applicationId: string) {
  if (!confirm('Marcar como follow-up enviado? Vai resetar o contador de silêncio.')) return;
  try {
    const res = await fetch(`/api/v1/jobs/applications/${applicationId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type: 'FOLLOW_UP_SENT' }),
    });
    if (!res.ok) throw new Error();
    await load();
    toastState.show('Follow-up registrado.', 'success');
  } catch {
    toastState.show(t('errors.registerFailed'), 'danger');
  }
}

let applications = $state<TrackedApplication[]>([]);
let loading = $state(true);
let adding = $state<string | null>(null);
let formType = $state<EventType>('VIEWED');
let formNote = $state('');

const EVENT_ICON: Record<EventType, typeof Eye> = {
  SUBMITTED: Briefcase,
  VIEWED: Eye,
  INTERVIEW_SCHEDULED: Calendar,
  INTERVIEW_COMPLETED: CheckCircle2,
  OFFER_RECEIVED: CheckCircle2,
  REJECTED: XCircle,
  WITHDRAWN: XCircle,
  FOLLOW_UP_SENT: MessageSquarePlus,
};

const EVENT_LABEL: Record<EventType, string> = {
  SUBMITTED: 'Enviada',
  VIEWED: 'Visualizada',
  INTERVIEW_SCHEDULED: 'Entrevista marcada',
  INTERVIEW_COMPLETED: 'Entrevista concluída',
  OFFER_RECEIVED: 'Oferta recebida',
  REJECTED: 'Rejeitada',
  WITHDRAWN: 'Retirada',
  FOLLOW_UP_SENT: 'Follow-up enviado',
};

async function load() {
  if (!browser) return;
  loading = true;
  try {
    const res = await fetch('/api/v1/jobs/applications/tracker', {
      credentials: 'include',
    });
    const body = (await res.json()) as { data?: { applications?: TrackedApplication[] } };
    applications = body.data?.applications ?? [];
  } catch {
    toastState.show(t('errors.loadApplicationsFailed'), 'danger');
  } finally {
    loading = false;
  }
}

async function addEvent(appId: string) {
  if (adding === appId) return;
  adding = appId;
  try {
    const res = await fetch(`/api/v1/jobs/applications/${appId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        type: formType,
        note: formNote.trim() || undefined,
      }),
    });
    if (!res.ok) throw new Error();
    formNote = '';
    await load();
    toastState.show('Evento registrado.', 'success');
  } catch {
    toastState.show(t('errors.registerEventFailed'), 'danger');
  } finally {
    adding = null;
  }
}

onMount(load);
</script>

<svelte:head>
  <title>Minhas aplicações · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 pt-20 pb-12">
  <header class="mb-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
      Timeline de aplicações
    </h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
      Registre cada interação — visualização, entrevista, oferta, rejeição. A gente mede silêncio
      prolongado e compara com a mediana da empresa.
    </p>
  </header>

  {#if loading}
    <div class="flex justify-center py-12">
      <Loader2 size={20} class="animate-spin text-gray-500" />
    </div>
  {:else if applications.length === 0}
    <p class="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:text-neutral-500">
      Você ainda não se aplicou em nenhuma vaga.
    </p>
  {:else}
    <ul class="space-y-6">
      {#each applications as app (app.id)}
        <li class="rounded-xl border border-gray-200 p-5 dark:border-neutral-800">
          <div class="mb-3 flex items-start justify-between">
            <div>
              <h2 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                {app.job.title}
              </h2>
              <p class="text-xs text-gray-500 dark:text-neutral-500">
                {app.job.company} · aplicada em {new Date(app.appliedAt).toLocaleDateString()}
              </p>
            </div>
            <div class="flex items-center gap-2">
              {#if app.needsFollowUp}
                <button
                  type="button"
                  class="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
                  title="Sem resposta há {app.daysSinceLastResponse ?? '?'} dias — clique pra registrar follow-up"
                  onclick={() => quickFollowUp(app.id)}
                >
                  <MessageSquarePlus size={12} />
                  Follow-up sugerido ({app.daysSinceLastResponse ?? '?'}d)
                </button>
              {/if}
            </div>
          </div>

          <ol class="relative ml-3 space-y-4 border-l border-gray-200 pl-6 dark:border-neutral-700">
            {#each app.events as ev (ev.id)}
              {@const Icon = EVENT_ICON[ev.type] ?? Eye}
              <li class="relative">
                <span
                  class="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <Icon size={12} class="text-gray-500" />
                </span>
                <div class="text-sm text-gray-800 dark:text-neutral-200">
                  {EVENT_LABEL[ev.type] ?? ev.type}
                </div>
                <div class="text-[11px] text-gray-400 dark:text-neutral-600">
                  {new Date(ev.occurredAt).toLocaleString()}
                </div>
                {#if ev.note}
                  <div class="mt-1 text-xs text-gray-600 dark:text-neutral-400">{ev.note}</div>
                {/if}
              </li>
            {/each}
          </ol>

          <details class="mt-4">
            <summary class="cursor-pointer text-xs text-cyan-600 hover:underline">
              + Registrar novo evento
            </summary>
            <div class="mt-3 space-y-2 rounded-lg border border-gray-200 p-3 dark:border-neutral-800">
              <div class="flex gap-2">
                <select
                  bind:value={formType}
                  class="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  aria-label="Tipo de evento"
                >
                  {#each Object.entries(EVENT_LABEL) as [value, label]}
                    {#if value !== 'SUBMITTED'}
                      <option {value}>{label}</option>
                    {/if}
                  {/each}
                </select>
                <input
                  bind:value={formNote}
                  placeholder="Nota (opcional)"
                  class="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                />
                <Button
                  size="sm"
                  variant="solid"
                  onclick={() => addEvent(app.id)}
                  disabled={adding === app.id}
                >
                  {#if adding === app.id}
                    <Loader2 size={14} class="animate-spin" />
                  {:else}
                    Adicionar
                  {/if}
                </Button>
              </div>
            </div>
          </details>
        </li>
      {/each}
    </ul>
  {/if}
</div>
