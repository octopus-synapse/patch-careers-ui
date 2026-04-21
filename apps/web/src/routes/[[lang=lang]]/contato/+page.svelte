<script lang="ts">
import { locale } from '$lib/locale.svelte';
import SeoHead from '$lib/components/seo/seo-head.svelte';

const lang = $derived(locale.current ?? 'pt-BR');
const isEn = $derived(lang === 'en');
</script>

<SeoHead
  title={isEn ? 'Contact' : 'Contato'}
  description={isEn
    ? 'How to contact patch-careers and our Data Protection Officer.'
    : 'Como entrar em contato com a patch-careers e o Encarregado de Dados.'}
/>

<article class="mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
  {#if isEn}
    <h1>Contact</h1>

    <h2>General support</h2>
    <p>E-mail: <a href="mailto:support@patchcareers.com">support@patchcareers.com</a></p>

    <h2>Data Protection Officer (LGPD)</h2>
    <p>Questions about personal data, consent, LGPD rights (art. 18), or incident reporting:</p>
    <p><a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a></p>
    <p>We answer within 15 days, in accordance with the LGPD.</p>

    <h2>Legal</h2>
    <p>Formal notifications: <a href="mailto:legal@patchcareers.com">legal@patchcareers.com</a></p>

    <h2>National data authority (ANPD)</h2>
    <p>Should you wish, you may also file a complaint directly with the Brazilian ANPD at <a href="https://www.gov.br/anpd" target="_blank" rel="noopener">gov.br/anpd</a>.</p>
  {:else}
    <h1>Contato</h1>

    <h2>Suporte geral</h2>
    <p>E-mail: <a href="mailto:support@patchcareers.com">support@patchcareers.com</a></p>

    <h2>Encarregado de Dados (LGPD)</h2>
    <p>Dúvidas sobre dados pessoais, consentimento, direitos do titular (LGPD art. 18) ou comunicação de incidentes:</p>
    <p><a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a></p>
    <p>Respondemos em até 15 dias, conforme a LGPD.</p>

    <h2>Jurídico</h2>
    <p>Notificações formais: <a href="mailto:legal@patchcareers.com">legal@patchcareers.com</a></p>

    <h2>ANPD</h2>
    <p>Você também pode apresentar reclamação diretamente à Autoridade Nacional de Proteção de Dados em <a href="https://www.gov.br/anpd" target="_blank" rel="noopener">gov.br/anpd</a>.</p>
  {/if}
</article>
