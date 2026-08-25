/**
 * Legal documents rendered inside the sign-up consent dialog — Terms of
 * Service and Privacy Policy, version 1.0.0 (must match TOS_VERSION /
 * PRIVACY_VERSION sent in the sign-up payload; bump both together).
 *
 * Each document is `title` + `updated` + six `sNh`/`sNp` heading/paragraph
 * pairs, iterated by the dialog. Both locales side by side; the parity
 * spec enforces the key set.
 */

import type { TranslationDict } from "../../types";

export const legalPtBR: TranslationDict = {
  version: "1.0.0",
  updated: "Última atualização: 25 de agosto de 2026",
  terms: {
    title: "Termos de Uso",
    s1h: "1. Aceitação",
    s1p: "Ao criar uma conta no Patch Careers você concorda com estes Termos de Uso e com a Política de Privacidade. Se não concordar, não utilize o serviço.",
    s2h: "2. O serviço",
    s2p: "O Patch Careers permite montar um perfil profissional, gerar currículos a partir dele e receber recomendações de vagas. Podemos alterar, suspender ou encerrar funcionalidades a qualquer momento, avisando com antecedência razoável quando a mudança afetar seus dados.",
    s3h: "3. Sua conta",
    s3p: "Você é responsável pela veracidade das informações do seu perfil e pela guarda das suas credenciais. Cada pessoa pode manter uma única conta, e é preciso ter ao menos 16 anos para usá-la.",
    s4h: "4. Conteúdo",
    s4p: "O conteúdo que você publica continua sendo seu. Você nos concede uma licença limitada para armazená-lo, processá-lo e exibi-lo apenas na medida necessária para operar o serviço — inclusive para gerar currículos e calcular compatibilidade com vagas.",
    s5h: "5. Uso aceitável",
    s5p: "É proibido usar o serviço para enviar spam, coletar dados de outros usuários, publicar conteúdo ilegal ou ofensivo, ou tentar contornar limitações técnicas. Podemos suspender contas que violem estas regras.",
    s6h: "6. Encerramento e alterações",
    s6p: "Você pode excluir sua conta a qualquer momento nas configurações. Podemos atualizar estes Termos; quando a mudança for relevante, pediremos que você aceite a nova versão antes de continuar usando o serviço.",
  },
  privacy: {
    title: "Política de Privacidade",
    s1h: "1. Dados que coletamos",
    s1p: "Coletamos os dados que você informa (nome, e-mail, experiências, formação, habilidades, links), dados de uso (páginas acessadas, ações no app) e dados técnicos (endereço IP, dispositivo, navegador).",
    s2h: "2. Como usamos",
    s2p: "Usamos seus dados para operar sua conta, gerar currículos, recomendar vagas compatíveis, enviar notificações que você escolher e melhorar o serviço. Não vendemos seus dados pessoais.",
    s3h: "3. Compartilhamento",
    s3p: "Compartilhamos dados apenas com provedores que nos ajudam a operar o serviço (hospedagem, e-mail, análise), sob contrato de confidencialidade, e com empresas quando você se candidata a uma vaga ou torna seu perfil público.",
    s4h: "4. Seus direitos (LGPD)",
    s4p: "Você pode acessar, corrigir, exportar ou excluir seus dados, e revogar consentimentos, a qualquer momento nas configurações ou pelo e-mail privacy@patchcareers.org. Atendemos solicitações em até 15 dias.",
    s5h: "5. Retenção e segurança",
    s5p: "Mantemos seus dados enquanto sua conta existir e por até 30 dias após a exclusão, para permitir recuperação. Usamos criptografia em trânsito e em repouso e controles de acesso restritos.",
    s6h: "6. Cookies e alterações",
    s6p: "Usamos cookies estritamente necessários para manter sua sessão. Alterações nesta política serão comunicadas no app; mudanças relevantes exigirão novo consentimento.",
  },
};

export const legalEn: TranslationDict = {
  version: "1.0.0",
  updated: "Last updated: August 25, 2026",
  terms: {
    title: "Terms of Service",
    s1h: "1. Acceptance",
    s1p: "By creating a Patch Careers account you agree to these Terms of Service and to the Privacy Policy. If you do not agree, do not use the service.",
    s2h: "2. The service",
    s2p: "Patch Careers lets you build a professional profile, generate resumes from it and receive job recommendations. We may change, suspend or discontinue features at any time, with reasonable notice when the change affects your data.",
    s3h: "3. Your account",
    s3p: "You are responsible for the accuracy of your profile and for keeping your credentials safe. Each person may hold a single account, and you must be at least 16 years old to use it.",
    s4h: "4. Content",
    s4p: "The content you publish remains yours. You grant us a limited licence to store, process and display it only as needed to run the service — including generating resumes and computing job fit.",
    s5h: "5. Acceptable use",
    s5p: "You may not use the service to send spam, harvest other users' data, post illegal or abusive content, or circumvent technical limits. We may suspend accounts that break these rules.",
    s6h: "6. Termination and changes",
    s6p: "You can delete your account at any time from settings. We may update these Terms; when a change is material, we will ask you to accept the new version before continuing.",
  },
  privacy: {
    title: "Privacy Policy",
    s1h: "1. Data we collect",
    s1p: "We collect the data you provide (name, e-mail, experience, education, skills, links), usage data (pages visited, in-app actions) and technical data (IP address, device, browser).",
    s2h: "2. How we use it",
    s2p: "We use your data to run your account, generate resumes, recommend matching jobs, send the notifications you opt into and improve the service. We do not sell your personal data.",
    s3h: "3. Sharing",
    s3p: "We share data only with providers that help us operate (hosting, e-mail, analytics) under confidentiality agreements, and with companies when you apply to a job or make your profile public.",
    s4h: "4. Your rights (LGPD)",
    s4p: "You can access, correct, export or delete your data and withdraw consent at any time from settings or by e-mailing privacy@patchcareers.org. We answer requests within 15 days.",
    s5h: "5. Retention and security",
    s5p: "We keep your data while your account exists and for up to 30 days after deletion to allow recovery. We use encryption in transit and at rest and restricted access controls.",
    s6h: "6. Cookies and changes",
    s6p: "We use strictly necessary cookies to keep your session. Changes to this policy are announced in the app; material changes require renewed consent.",
  },
};
