<script lang="ts">
import { locale } from '$lib/locale.svelte';
import SeoHead from '$lib/components/seo/seo-head.svelte';

const lang = $derived(locale.current ?? 'pt-BR');
const isEn = $derived(lang === 'en');

const PRIVACY_VERSION = '1.0.0';
const EFFECTIVE_DATE = '2026-04-20';
</script>

<SeoHead
  title={isEn ? 'Privacy Policy' : 'Política de Privacidade'}
  description={isEn
    ? 'How patch-careers processes your personal data (LGPD/GDPR).'
    : 'Como a patch-careers trata seus dados pessoais (LGPD).'}
/>

<article class="mx-auto max-w-3xl px-4 py-10 prose prose-sm dark:prose-invert">
  {#if isEn}
    <h1>Privacy Policy</h1>
    <p><strong>Version:</strong> {PRIVACY_VERSION} &middot; <strong>Effective:</strong> {EFFECTIVE_DATE}</p>
    <p>This policy follows Brazil's LGPD (Law 13.709/2018). Controller: patch-careers, contact <a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a>.</p>

    <h2>1. Data we collect</h2>
    <ul>
      <li><strong>Identification</strong>: name, e-mail, telephone, username, profile photo.</li>
      <li><strong>Career data</strong>: résumé, experience, education, skills, salary expectations, languages.</li>
      <li><strong>Usage data</strong>: IP, user-agent, clicks, routes visited (audit and analytics).</li>
      <li><strong>Authentication data</strong>: password hash, OAuth tokens (GitHub, LinkedIn) with scope limited to what you authorise.</li>
      <li><strong>Uploaded files</strong>: PDFs, avatars, documents you choose to submit.</li>
    </ul>

    <h2>2. Legal bases (LGPD art. 7)</h2>
    <ul>
      <li>Contract performance (providing the service).</li>
      <li>Your consent (marketing, cookies, data transfers).</li>
      <li>Legitimate interest (security, fraud prevention, audit).</li>
      <li>Legal obligation (tax, judicial requisition).</li>
    </ul>

    <h2>3. Purposes (LGPD art. 8 and 9)</h2>
    <ul>
      <li>Create and maintain your account.</li>
      <li>Match résumés and jobs via algorithmic score (fit score).</li>
      <li>Send transactional e-mails (verification, password reset, application status).</li>
      <li>Detect abuse, fraud, and security incidents (audit logs).</li>
      <li>Improve the product through aggregated analytics (with your consent).</li>
    </ul>

    <h2>4. Sharing and third parties (LGPD art. 33)</h2>
    <p>We share data with the following processors, subject to Standard Contractual Clauses when applicable:</p>
    <ul>
      <li><strong>OpenAI, L.L.C. (USA)</strong>: processing of résumé and job description text for tailoring and extraction. Data stays within the OpenAI API contract and is not used to train public models.</li>
      <li><strong>Twilio SendGrid (USA)</strong>: delivery of transactional e-mail.</li>
      <li><strong>Cloudflare (USA)</strong>: CDN, WAF, DDoS protection (processes IP and request metadata).</li>
      <li><strong>Hostinger (Lithuania/EU)</strong>: infrastructure hosting.</li>
    </ul>

    <h2>5. International transfer (LGPD art. 33, III and 35)</h2>
    <p>Part of the data is transferred to the USA because of the processors above. The transfer is based on your consent and on contractual safeguards equivalent to the LGPD standard.</p>

    <h2>6. Automated decisions (LGPD art. 20)</h2>
    <p>We use algorithms to calculate a match score between your résumé and a job (fit score), to rank recommendations, and optionally to submit applications automatically (auto-apply / rage-apply). You can request human review or disable these features at any time in Settings.</p>

    <h2>7. Retention</h2>
    <ul>
      <li>Active account: while the account exists.</li>
      <li>Audit logs (IP, user-agent, critical actions): up to 90 days.</li>
      <li>Backups: up to 90 days after deletion.</li>
      <li>Data required by law: for the period demanded by law.</li>
    </ul>

    <h2>8. Your rights (LGPD art. 18)</h2>
    <ul>
      <li>Access, correction, anonymisation, deletion.</li>
      <li>Portability (JSON export via <code>GET /gdpr/export</code>).</li>
      <li>Consent revocation at any time in Settings.</li>
      <li>Information about shared parties and purposes.</li>
      <li>Object to processing based on legitimate interest.</li>
    </ul>
    <p>To exercise: <a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a>. Response within 15 days.</p>

    <h2>9. Security</h2>
    <p>HTTPS in transit, hashed passwords (bcrypt/argon), access logs, permission-based roles (RBAC), rate limiting and optional MFA/2FA. Reasonable technical and administrative measures as per LGPD art. 46.</p>

    <h2>10. Cookies</h2>
    <p>See the <a href="/legal/cookies">Cookie Policy</a>.</p>

    <h2>11. DPO / Encarregado</h2>
    <p>E-mail: <a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a>.</p>

    <h2>12. ANPD</h2>
    <p>You may file a complaint with the Brazilian data protection authority at <a href="https://www.gov.br/anpd" target="_blank" rel="noopener">gov.br/anpd</a>.</p>

    <h2>13. Changes</h2>
    <p>Material changes trigger a new consent request and are notified by e-mail.</p>
  {:else}
    <h1>Política de Privacidade</h1>
    <p><strong>Versão:</strong> {PRIVACY_VERSION} &middot; <strong>Vigência a partir de:</strong> {EFFECTIVE_DATE}</p>
    <p>Esta política segue a LGPD (Lei 13.709/2018). Controlador: patch-careers, contato <a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a>.</p>

    <h2>1. Dados que coletamos</h2>
    <ul>
      <li><strong>Identificação</strong>: nome, e-mail, telefone, username, foto de perfil.</li>
      <li><strong>Dados de carreira</strong>: currículo, experiência, formação, skills, pretensão salarial, idiomas.</li>
      <li><strong>Dados de uso</strong>: IP, user-agent, cliques, rotas visitadas (auditoria e analytics).</li>
      <li><strong>Dados de autenticação</strong>: hash da senha, tokens OAuth (GitHub, LinkedIn) limitados ao escopo autorizado.</li>
      <li><strong>Arquivos enviados</strong>: PDFs, avatares, documentos que você optar por subir.</li>
    </ul>

    <h2>2. Bases legais (LGPD art. 7)</h2>
    <ul>
      <li>Execução de contrato (prestação do serviço).</li>
      <li>Seu consentimento (marketing, cookies, transferência internacional).</li>
      <li>Legítimo interesse (segurança, prevenção a fraude, auditoria).</li>
      <li>Obrigação legal (fiscal, requisição judicial).</li>
    </ul>

    <h2>3. Finalidades (LGPD art. 8 e 9)</h2>
    <ul>
      <li>Criar e manter sua conta.</li>
      <li>Casar currículos com vagas via score algorítmico (fit score).</li>
      <li>Enviar e-mails transacionais (verificação, reset de senha, status de candidatura).</li>
      <li>Detectar abuso, fraude e incidentes de segurança (audit logs).</li>
      <li>Melhorar o produto via analytics agregado (mediante consentimento).</li>
    </ul>

    <h2>4. Compartilhamento e terceiros (LGPD art. 33)</h2>
    <p>Compartilhamos dados com os seguintes operadores, sujeitos às Cláusulas Contratuais Padrão quando aplicável:</p>
    <ul>
      <li><strong>OpenAI, L.L.C. (EUA)</strong>: processamento de texto do currículo e da descrição de vaga para tailoring e extração. Os dados ficam sob o contrato da API da OpenAI e não são usados para treinar modelos públicos.</li>
      <li><strong>Twilio SendGrid (EUA)</strong>: entrega de e-mail transacional.</li>
      <li><strong>Cloudflare (EUA)</strong>: CDN, WAF e proteção contra DDoS (processa IP e metadados de requisição).</li>
      <li><strong>Hostinger (Lituânia/UE)</strong>: hospedagem da infraestrutura.</li>
    </ul>

    <h2>5. Transferência internacional (LGPD art. 33, III e 35)</h2>
    <p>Parte dos dados é transferida para os EUA em função dos operadores acima. A transferência é baseada no seu consentimento e em salvaguardas contratuais equivalentes ao padrão LGPD.</p>

    <h2>6. Decisão automatizada (LGPD art. 20)</h2>
    <p>Usamos algoritmos para calcular um score de compatibilidade entre o seu currículo e uma vaga (fit score), priorizar recomendações e, opcionalmente, submeter candidaturas automaticamente (auto-apply / rage-apply). Você pode solicitar revisão humana ou desabilitar essas funcionalidades a qualquer momento em Configurações.</p>

    <h2>7. Retenção</h2>
    <ul>
      <li>Conta ativa: enquanto a conta existir.</li>
      <li>Audit logs (IP, user-agent, ações críticas): até 90 dias.</li>
      <li>Backups: até 90 dias após a exclusão.</li>
      <li>Dados por obrigação legal: pelo prazo legal.</li>
    </ul>

    <h2>8. Seus direitos (LGPD art. 18)</h2>
    <ul>
      <li>Acesso, correção, anonimização, eliminação.</li>
      <li>Portabilidade (exportar em JSON via <code>GET /gdpr/export</code>).</li>
      <li>Revogar consentimento a qualquer momento em Configurações.</li>
      <li>Informação sobre compartilhamento e finalidades.</li>
      <li>Opor-se a tratamento baseado em legítimo interesse.</li>
    </ul>
    <p>Para exercer: <a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a>. Resposta em até 15 dias.</p>

    <h2>9. Segurança</h2>
    <p>HTTPS em trânsito, senhas com hash (bcrypt/argon), logs de acesso, controle por permissões (RBAC), rate limiting e MFA/2FA opcional. Medidas técnicas e administrativas razoáveis conforme LGPD art. 46.</p>

    <h2>10. Cookies</h2>
    <p>Veja a <a href="/legal/cookies">Política de Cookies</a>.</p>

    <h2>11. Encarregado / DPO</h2>
    <p>E-mail: <a href="mailto:dpo@patchcareers.com">dpo@patchcareers.com</a>.</p>

    <h2>12. ANPD</h2>
    <p>Você pode apresentar reclamação à Autoridade Nacional de Proteção de Dados em <a href="https://www.gov.br/anpd" target="_blank" rel="noopener">gov.br/anpd</a>.</p>

    <h2>13. Alterações</h2>
    <p>Mudanças relevantes disparam novo pedido de consentimento e são comunicadas por e-mail.</p>
  {/if}
</article>
