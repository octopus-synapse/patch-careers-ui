<script lang="ts">
import { locale } from '$lib/state/locale.svelte';
import SeoHead from '$lib/components/seo/seo-head.svelte';

const t = $derived(locale.t);
const lang = $derived(locale.current ?? 'pt-BR');
const isEn = $derived(lang === 'en');

function reopenBanner() {
  try {
    localStorage.removeItem('consent_v1');
    window.dispatchEvent(new CustomEvent('cookie-consent:reopen'));
  } catch {
    // noop
  }
}
</script>

<SeoHead
  title={isEn ? 'Cookie Policy' : 'Política de Cookies'}
  description={isEn
    ? 'How we use cookies and similar technologies.'
    : 'Como usamos cookies e tecnologias similares.'}
/>

<article class="mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
  {#if isEn}
    <h1>{t('legal.cookies.heading')}</h1>
    <p>This page explains which cookies and similar technologies we use and how you control them.</p>

    <h2>{t('legal.cookies.section1.heading')}</h2>
    <p>Required for the service to work (session, authentication, language, theme). They cannot be disabled.</p>

    <h2>{t('legal.cookies.section2.heading')}</h2>
    <p>Collect aggregated usage statistics (pages visited, time on page) through our self-hosted PostHog instance. <strong>Only enabled if you consent.</strong></p>

    <h2>{t('legal.cookies.section3.heading')}</h2>
    <p>Currently not used. Reserved for future retargeting or referral campaigns and will require separate consent.</p>

    <h2>{t('legal.cookies.section4.heading')}</h2>
    <p>
      <button type="button" onclick={reopenBanner} class="underline">{t('legal.cookies.openPreferences')}</button>
      &mdash; reopens the consent banner.
    </p>
    <p>You can also clear cookies from your browser at any time. The banner reappears on the next visit.</p>

    <h2>{t('legal.cookies.section5.heading')}</h2>
    <p>Essential session is first-party only. Analytics runs on our infrastructure (PostHog self-hosted). Cloudflare sets technical cookies for bot protection and performance (essential).</p>

    <h2>{t('legal.cookies.section6.heading')}</h2>
    <p><a href="mailto:dpo@patchcareers.com">{t('common.email.dpo')}</a></p>
  {:else}
    <h1>{t('legal.cookies.heading')}</h1>
    <p>Esta página explica quais cookies e tecnologias similares utilizamos e como você pode controlá-los.</p>

    <h2>{t('legal.cookies.section1.heading')}</h2>
    <p>Necessários para o serviço funcionar (sessão, autenticação, idioma, tema). Não podem ser desativados.</p>

    <h2>{t('legal.cookies.section2.heading')}</h2>
    <p>Coletam estatísticas agregadas de uso (páginas visitadas, tempo na página) por meio da nossa instância self-hosted do PostHog. <strong>Só são ativados se você consentir.</strong></p>

    <h2>{t('legal.cookies.section3.heading')}</h2>
    <p>Atualmente não utilizamos. Reservados para eventuais campanhas de retargeting ou referência no futuro, exigirão consentimento separado.</p>

    <h2>{t('legal.cookies.section4.heading')}</h2>
    <p>
      <button type="button" onclick={reopenBanner} class="underline">{t('legal.cookies.openPreferences')}</button>
      &mdash; reabre o banner de consentimento.
    </p>
    <p>Você também pode limpar os cookies pelo navegador a qualquer momento. O banner aparecerá de novo na próxima visita.</p>

    <h2>{t('legal.cookies.section5.heading')}</h2>
    <p>A sessão essencial é first-party apenas. O analytics roda na nossa infraestrutura (PostHog self-hosted). A Cloudflare define cookies técnicos para proteção contra bots e performance (essenciais).</p>

    <h2>{t('legal.cookies.section6.heading')}</h2>
    <p><a href="mailto:dpo@patchcareers.com">{t('common.email.dpo')}</a></p>
  {/if}
</article>
