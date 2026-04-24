<script lang="ts">
import { locale } from '$lib/state/locale.svelte';
import { LEGAL_EFFECTIVE_DATE, TOS_VERSION } from '$lib/utils/consent-versions';
import SeoHead from '$lib/components/seo/seo-head.svelte';

const lang = $derived(locale.current ?? 'pt-BR');
const isEn = $derived(lang === 'en');

const EFFECTIVE_DATE = LEGAL_EFFECTIVE_DATE;
</script>

<SeoHead
  title={isEn ? 'Terms of Service' : 'Termos de Uso'}
  description={isEn
    ? 'Terms of service for patch-careers.'
    : 'Termos de uso da plataforma patch-careers.'}
/>

<article class="mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
  {#if isEn}
    <h1>Terms of Service</h1>
    <p><strong>Version:</strong> {TOS_VERSION} &middot; <strong>Effective:</strong> {EFFECTIVE_DATE}</p>

    <h2>1. Acceptance</h2>
    <p>By creating an account or using patch-careers you accept these Terms and our Privacy Policy. If you do not agree, do not use the service.</p>

    <h2>2. Eligibility</h2>
    <p>You must be at least 16 years old and legally capable. You are responsible for accurate account information.</p>

    <h2>3. Account</h2>
    <p>You are responsible for maintaining the confidentiality of your credentials. Notify us immediately at <a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a> about unauthorized access. We may suspend or terminate accounts that violate these Terms.</p>

    <h2>4. Acceptable use</h2>
    <ul>
      <li>Do not upload illegal, offensive, discriminatory, or copyright-infringing content.</li>
      <li>Do not attempt to access data of other users, abuse automation, or circumvent rate limits.</li>
      <li>Do not send spam or unsolicited commercial messages through our tools.</li>
    </ul>

    <h2>5. User-generated content</h2>
    <p>You keep ownership of content you submit (resumes, posts, messages). You grant us a non-exclusive, worldwide, royalty-free license to host, process, and display it for the purpose of providing the service. You are responsible for what you publish.</p>

    <h2>6. Automated decision-making</h2>
    <p>We use algorithmic scoring (fit score) and optional automation (auto-apply, rage-apply) to match resumes and job postings. You can opt out in settings. See the Privacy Policy for details.</p>

    <h2>7. Third-party services</h2>
    <p>We use OpenAI (USA) for text processing, SendGrid/Twilio (USA) for email, Cloudflare (USA) as CDN/WAF, and Hostinger for infrastructure. See the Privacy Policy.</p>

    <h2>8. Termination</h2>
    <p>You may delete your account at any time via settings. Deletion removes personal data except where retention is legally required (audit logs up to 90 days).</p>

    <h2>9. Liability</h2>
    <p>The service is provided "as is". We are not liable for indirect damages or loss of earnings. Total liability is limited to amounts paid by you, if any, in the last 12 months.</p>

    <h2>10. Changes</h2>
    <p>We may update these Terms. Material changes are notified by email and require a new acceptance. The current version is always available at this URL.</p>

    <h2>11. Governing law</h2>
    <p>Brazilian law. Jurisdiction: São Paulo/SP, Brazil.</p>

    <h2>12. Contact</h2>
    <p>Questions: <a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a>.</p>
  {:else}
    <h1>Termos de Uso</h1>
    <p><strong>Versão:</strong> {TOS_VERSION} &middot; <strong>Vigência a partir de:</strong> {EFFECTIVE_DATE}</p>

    <h2>1. Aceite</h2>
    <p>Ao criar uma conta ou utilizar o patch-careers você aceita estes Termos e a nossa Política de Privacidade. Se não concorda, não use o serviço.</p>

    <h2>2. Elegibilidade</h2>
    <p>Você precisa ter pelo menos 16 anos e capacidade legal. É responsável pelas informações cadastradas.</p>

    <h2>3. Conta</h2>
    <p>Você é responsável por manter suas credenciais em sigilo. Em caso de acesso não autorizado, avise imediatamente <a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a>. Podemos suspender ou encerrar contas que violem estes Termos.</p>

    <h2>4. Uso aceitável</h2>
    <ul>
      <li>Não publicar conteúdo ilegal, ofensivo, discriminatório ou que viole direitos autorais.</li>
      <li>Não tentar acessar dados de outros usuários, abusar de automações ou burlar limites de requisição.</li>
      <li>Não enviar spam ou comunicações comerciais não solicitadas pelas ferramentas da plataforma.</li>
    </ul>

    <h2>5. Conteúdo do usuário</h2>
    <p>Você mantém a titularidade do conteúdo que envia (currículos, posts, mensagens). Concede à patch-careers licença não exclusiva, mundial e gratuita para hospedar, processar e exibir esse conteúdo com o objetivo de prestar o serviço. Você é responsável pelo que publica.</p>

    <h2>6. Decisão automatizada</h2>
    <p>Usamos pontuação algorítmica (fit score) e automações opcionais (auto-apply, rage-apply) para casar currículos e vagas. Você pode optar por não participar nas configurações. Detalhes na Política de Privacidade.</p>

    <h2>7. Serviços de terceiros</h2>
    <p>Usamos OpenAI (EUA) para processamento de texto, SendGrid/Twilio (EUA) para envio de e-mails, Cloudflare (EUA) como CDN/WAF e Hostinger para infraestrutura. Veja a Política de Privacidade.</p>

    <h2>8. Encerramento</h2>
    <p>Você pode excluir sua conta a qualquer momento pelas configurações. A exclusão remove os dados pessoais, exceto quando retenção for exigida por lei (logs de auditoria até 90 dias).</p>

    <h2>9. Responsabilidade</h2>
    <p>O serviço é fornecido "no estado em que se encontra". Não respondemos por danos indiretos ou lucros cessantes. A responsabilidade total limita-se ao valor pago por você, se houver, nos últimos 12 meses.</p>

    <h2>10. Alterações</h2>
    <p>Podemos atualizar estes Termos. Mudanças relevantes são comunicadas por e-mail e exigem novo aceite. A versão vigente estará sempre nesta URL.</p>

    <h2>11. Lei aplicável</h2>
    <p>Direito brasileiro. Foro: São Paulo/SP, Brasil.</p>

    <h2>12. Contato</h2>
    <p>Dúvidas: <a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a>.</p>
  {/if}
</article>
