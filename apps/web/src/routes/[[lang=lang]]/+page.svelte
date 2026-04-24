<script lang="ts">
import { ArrowRight, Check, Plus, Minus } from 'lucide-svelte';
import LandingDemo from './_components/landing/demo.svelte';
import LandingSuccessStories from './_components/landing/success-stories.svelte';
import SeoHead from '$lib/components/seo/seo-head.svelte';

const heroBenefits = ['Sem cartão de crédito', 'Cancele quando quiser', 'IA especializada em tech'];

const planFeatures = [
  'Currículo Base ilimitado — guarde toda sua história profissional',
  'Reescrita automática para cada vaga com IA especializada',
  'ATS Score otimizado para passar de 90% em qualquer triagem',
  'Auto-Apply nas vagas com fit real detectado',
  'Dashboard de candidaturas com métricas em tempo real',
  'Exportação em PDF otimizado para ATS',
];

const faqs = [
  [
    'Funciona para qualquer área de tech?',
    'Sim. Dev, dados, design de produto, infra, segurança — se é vaga tech, o Patch otimiza. A IA entende o vocabulário de cada especialidade.',
  ],
  [
    'O Auto-Apply vai me mandar para vagas erradas?',
    'Não. Você define os critérios — stack, senioridade, regime, localização. O Patch só aplica onde o match é real. Você tem controle total.',
  ],
  [
    'Meu currículo fica protegido?',
    'Sim. Seus dados ficam criptografados e nunca são compartilhados com terceiros sem sua autorização explícita.',
  ],
  [
    'Preciso recriar o currículo do zero?',
    'Não. Você importa o que já tem (PDF, LinkedIn, texto) e o Patch organiza. Em menos de 10 minutos seu Currículo Base está pronto.',
  ],
];

const poolUsed = 49;
const poolCap = 200;
const poolPct = Math.round((poolUsed / poolCap) * 100);

let openFaq = $state<number | null>(null);
</script>

<SeoHead
	title="Patch Careers"
	description="IA especializada em tech que reescreve seu currículo por vaga, abre ATS com 90%+ e faz Auto-Apply no match real. Sua carreira, patched."
	type="website"
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Patch Careers',
		description: 'Patched resumes for tech careers — AI-tailored applications, ATS-optimized.',
		url: 'https://patch.careers'
	}}
/>

<div class="landing-shell antialiased">
	<!-- ═══════════════════════════════════════════════════════════════
	     HERO · "Masthead"
	     Editorial layout: mono slug → oversized serif headline → lede
	     → single oxide CTA → mono inventory ticker (signature block).
	     ═══════════════════════════════════════════════════════════════ -->
	<section class="relative overflow-hidden px-6 pb-24 pt-24 sm:px-10 md:pb-32 md:pt-32 lg:px-16">
		<!-- Signature masthead rule -->
		<div class="mx-auto max-w-[1400px]">
			<div class="reveal reveal-1 flex items-center justify-between pb-10 text-[11px] font-mono uppercase tracking-[0.18em]" style="color: var(--landing-muted-on-ink)">
				<span>Patch Careers &mdash; Recursos de carreira</span>
				<span class="hidden sm:inline">Nº 001 · Abril 2026</span>
			</div>
			<div class="h-px w-full" style="background: var(--landing-line-dark)"></div>
		</div>

		<!-- Masthead grid: headline (left) / meta column (right) -->
		<div class="mx-auto mt-14 grid max-w-[1400px] gap-12 lg:mt-20 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
			<div>
				<p class="reveal reveal-1 mb-8 font-mono text-xs uppercase tracking-[0.24em]" style="color: var(--landing-oxide)">
					&mdash; Infraestrutura de candidatura
				</p>

				<h1 class="reveal reveal-2 font-display text-[15vw] leading-[0.92] sm:text-[11vw] lg:text-[8.5rem] xl:text-[10rem]">
					<span class="block">Sua carreira,</span>
					<span class="block">
						<span class="font-display-italic" style="color: var(--landing-oxide)">patched</span>.
					</span>
				</h1>

				<p class="reveal reveal-3 mt-10 max-w-xl text-lg leading-relaxed sm:text-xl" style="color: var(--landing-muted-on-ink)">
					O Patch reescreve seu currículo para cada vaga, eleva o ATS acima de
					<span style="color: var(--landing-text-on-ink)">90%</span>
					e só candidata quando o match é real. Nenhum disparo em massa. Nenhum template genérico.
				</p>

				<div class="reveal reveal-4 mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
					<a
						href="/identity/sign-up"
						class="group inline-flex items-center gap-3 px-7 py-4 text-sm font-medium transition-colors"
						style="background: var(--landing-oxide); color: var(--landing-ink); transition-duration: var(--dur-tight); transition-timing-function: var(--ease-precise);"
						onmouseenter={(e) => (e.currentTarget.style.background = 'var(--landing-oxide-ink)')}
						onmouseleave={(e) => (e.currentTarget.style.background = 'var(--landing-oxide)')}
					>
						<span>Começar agora</span>
						<ArrowRight size={16} class="transition-transform duration-200 group-hover:translate-x-1" />
					</a>
					<div class="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs uppercase tracking-[0.14em]" style="color: var(--landing-muted-on-ink)">
						{#each heroBenefits as benefit, i}
							<span class="inline-flex items-center gap-1.5">
								{#if i > 0}
									<span style="color: var(--landing-line-dark)">·</span>
								{/if}
								{benefit}
							</span>
						{/each}
					</div>
				</div>
			</div>

			<!-- Signature block: inventory ticker. No progress bar — a terminal-like readout. -->
			<aside class="reveal reveal-5 self-end">
				<div class="border p-6 font-mono text-sm" style="border-color: var(--landing-line-dark); background: var(--landing-ink-2);">
					<div class="mb-5 flex items-center justify-between text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
						<span>Early Access</span>
						<span class="inline-flex items-center gap-1.5">
							<span class="h-1.5 w-1.5 rounded-full" style="background: var(--landing-oxide)"></span>
							Ativo
						</span>
					</div>

					<dl class="space-y-3">
						<div class="flex items-baseline justify-between gap-4">
							<dt class="text-xs" style="color: var(--landing-muted-on-ink)">Pool</dt>
							<dd class="tabular-nums">
								<span style="color: var(--landing-oxide)">{poolUsed}</span>
								<span style="color: var(--landing-muted-on-ink)"> / {poolCap}</span>
							</dd>
						</div>
						<!-- Ticker bar: flat 2px, not rounded progress. -->
						<div class="h-[2px] w-full" style="background: var(--landing-line-dark)">
							<div class="h-full" style="width: {poolPct}%; background: var(--landing-oxide)"></div>
						</div>
						<div class="flex items-baseline justify-between gap-4 pt-2">
							<dt class="text-xs" style="color: var(--landing-muted-on-ink)">Ocupação</dt>
							<dd class="tabular-nums text-xs">{poolPct}%</dd>
						</div>
						<div class="flex items-baseline justify-between gap-4">
							<dt class="text-xs" style="color: var(--landing-muted-on-ink)">Preço</dt>
							<dd class="tabular-nums text-xs">R$ 79,00 / mês</dd>
						</div>
						<div class="flex items-baseline justify-between gap-4">
							<dt class="text-xs" style="color: var(--landing-muted-on-ink)">Travado</dt>
							<dd class="text-xs">vitalício p/ pool atual</dd>
						</div>
					</dl>

					<div class="mt-5 border-t pt-4 text-[10px] uppercase tracking-[0.22em]" style="border-color: var(--landing-line-dark); color: var(--landing-muted-on-ink)">
						Últimos 30 dias · +17 pacthers
					</div>
				</div>
			</aside>
		</div>
	</section>

	<!-- Interactive demo: 3 scripted scenarios showing the rewrite in action. -->
	<LandingDemo />

	<!-- Success stories carousel (renders only when the backend has PUBLISHED rows). -->
	<LandingSuccessStories />

	<!-- ═══════════════════════════════════════════════════════════════
	     EMOTIONAL CTA · "Column Rule"
	     Tall serif statement. No glow, no uppercase shouting.
	     ═══════════════════════════════════════════════════════════════ -->
	<section class="relative px-6 py-24 sm:px-10 sm:py-32 md:py-40 lg:px-16" style="background: var(--landing-ink);">
		<div class="mx-auto max-w-[1200px]">
			<div class="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-20">
				<div class="font-mono text-[11px] uppercase tracking-[0.24em] lg:pt-4" style="color: var(--landing-muted-on-ink)">
					&mdash; A hora é agora
				</div>

				<div>
					<h2 class="font-display text-5xl leading-[1.02] sm:text-6xl md:text-7xl lg:text-[7.5rem]">
						Pare de ser
						<span class="font-display-italic" style="color: var(--landing-oxide)">ignorado</span>.
					</h2>

					<p class="mt-10 max-w-xl text-lg leading-relaxed" style="color: var(--landing-muted-on-ink)">
						Cada dia sem o Patch é mais um currículo enviado ao lixo antes de qualquer humano ler.
						Triagens automatizadas filtram por palavra-chave. O Patch fala a língua delas.
					</p>

					<div class="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
						<a
							href="/identity/sign-up"
							class="inline-flex items-center gap-3 px-8 py-5 text-sm font-medium transition-colors"
							style="background: var(--landing-oxide); color: var(--landing-ink); transition-duration: var(--dur-tight); transition-timing-function: var(--ease-precise);"
							onmouseenter={(e) => (e.currentTarget.style.background = 'var(--landing-oxide-ink)')}
							onmouseleave={(e) => (e.currentTarget.style.background = 'var(--landing-oxide)')}
						>
							<span>Quero entrevistas</span>
							<ArrowRight size={16} />
						</a>
						<p class="font-mono text-xs uppercase tracking-[0.18em]" style="color: var(--landing-muted-on-ink)">
							R$ 79 / mês &nbsp;·&nbsp; cancele quando quiser
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════
	     PRICING + FAQ · "Vellum"
	     Cream paper bg, editorial split. Oxide on ink for pricing card.
	     ═══════════════════════════════════════════════════════════════ -->
	<section class="relative px-6 py-24 sm:px-10 sm:py-32 md:py-40 lg:px-16" style="background: var(--landing-paper); color: var(--landing-text-on-paper);">
		<div class="mx-auto max-w-[1400px]">
			<!-- Section masthead -->
			<div class="mb-16 flex flex-col gap-4 border-b pb-10 sm:flex-row sm:items-end sm:justify-between" style="border-color: var(--landing-line-light)">
				<div>
					<p class="mb-4 font-mono text-[11px] uppercase tracking-[0.24em]" style="color: var(--landing-oxide-ink)">
						§ 02 &mdash; Plano
					</p>
					<h2 class="font-display text-5xl leading-[0.95] sm:text-6xl md:text-7xl lg:text-[6rem]">
						Um plano. <span class="font-display-italic">Sem pegadinha.</span>
					</h2>
				</div>
				<p class="max-w-sm font-mono text-xs uppercase leading-relaxed tracking-[0.14em]" style="color: var(--landing-muted-on-paper)">
					Cancelamento em um clique. Sem cartão no cadastro.
					Pool de early access limitado a {poolCap} pessoas.
				</p>
			</div>

			<div class="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
				<!-- Pricing card · ink background against paper section -->
				<div class="relative p-8 sm:p-10 md:p-12" style="background: var(--landing-ink); color: var(--landing-text-on-ink);">
					<!-- Decorative corner marks -->
					<span class="absolute left-0 top-0 h-3 w-3 border-l border-t" style="border-color: var(--landing-oxide)"></span>
					<span class="absolute right-0 top-0 h-3 w-3 border-r border-t" style="border-color: var(--landing-oxide)"></span>
					<span class="absolute bottom-0 left-0 h-3 w-3 border-b border-l" style="border-color: var(--landing-oxide)"></span>
					<span class="absolute bottom-0 right-0 h-3 w-3 border-b border-r" style="border-color: var(--landing-oxide)"></span>

					<div class="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
						<span class="inline-flex items-center gap-2">
							<span class="h-1.5 w-1.5 rounded-full" style="background: var(--landing-oxide)"></span>
							Patch · Active
						</span>
						<span>Plano único</span>
					</div>

					<div class="mt-10 flex items-baseline gap-2">
						<span class="font-mono text-base" style="color: var(--landing-muted-on-ink)">R$</span>
						<span class="font-display text-[7rem] leading-[0.85] tabular-nums">79</span>
						<span class="font-mono text-xs uppercase tracking-[0.18em]" style="color: var(--landing-muted-on-ink)">/ mês</span>
					</div>

					<!-- Inventory readout (echoes the hero signature block) -->
					<div class="mt-8 border-t border-b py-5 font-mono text-xs" style="border-color: var(--landing-line-dark)">
						<div class="flex items-baseline justify-between">
							<span style="color: var(--landing-muted-on-ink)">Pool early access</span>
							<span class="tabular-nums">
								<span style="color: var(--landing-oxide)">{poolUsed}</span>
								<span style="color: var(--landing-muted-on-ink)"> / {poolCap}</span>
							</span>
						</div>
						<div class="mt-3 h-[2px] w-full" style="background: var(--landing-line-dark)">
							<div class="h-full" style="width: {poolPct}%; background: var(--landing-oxide)"></div>
						</div>
						<p class="mt-3 text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
							Preço travado para o pool atual
						</p>
					</div>

					<ul class="mt-8 space-y-4">
						{#each planFeatures as feature}
							<li class="flex items-start gap-3 text-sm leading-relaxed" style="color: var(--landing-text-on-ink)">
								<Check size={16} class="mt-[3px] shrink-0" style="color: var(--landing-oxide)" />
								<span>{feature}</span>
							</li>
						{/each}
					</ul>

					<a
						href="/identity/sign-up"
						class="group mt-10 inline-flex w-full items-center justify-between px-6 py-5 text-sm font-medium transition-colors"
						style="background: var(--landing-oxide); color: var(--landing-ink); transition-duration: var(--dur-tight); transition-timing-function: var(--ease-precise);"
						onmouseenter={(e) => (e.currentTarget.style.background = 'var(--landing-oxide-ink)')}
						onmouseleave={(e) => (e.currentTarget.style.background = 'var(--landing-oxide)')}
					>
						<span>Ativar por R$ 79 / mês</span>
						<ArrowRight size={16} class="transition-transform duration-200 group-hover:translate-x-1" />
					</a>
					<p class="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
						Sem cartão no cadastro &nbsp;·&nbsp; acesso imediato
					</p>
				</div>

				<!-- FAQ column · paper-native, editorial accordion -->
				<div>
					<p class="mb-6 font-mono text-[11px] uppercase tracking-[0.24em]" style="color: var(--landing-oxide-ink)">
						§ 03 &mdash; Perguntas frequentes
					</p>
					<div>
						{#each faqs as [question, answer], i}
							<div class="border-b last:border-none" style="border-color: var(--landing-line-light)">
								<button
									type="button"
									onclick={() => (openFaq = openFaq === i ? null : i)}
									class="flex w-full items-center justify-between gap-4 py-6 text-left transition-colors"
									style="transition-duration: var(--dur-tight);"
									aria-expanded={openFaq === i}
								>
									<span class="font-display text-2xl leading-snug sm:text-3xl">
										{question}
									</span>
									<span class="shrink-0 transition-transform" style="transition-duration: var(--dur-tight); transition-timing-function: var(--ease-precise); color: {openFaq === i ? 'var(--landing-oxide-ink)' : 'var(--landing-muted-on-paper)'};">
										{#if openFaq === i}
											<Minus size={20} />
										{:else}
											<Plus size={20} />
										{/if}
									</span>
								</button>
								{#if openFaq === i}
									<p class="pb-6 pr-8 text-base leading-relaxed" style="color: var(--landing-muted-on-paper)">
										{answer}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════
	     FOOTER · "Colophon"
	     ═══════════════════════════════════════════════════════════════ -->
	<footer class="px-6 py-14 sm:px-10 sm:py-16 lg:px-16" style="background: var(--landing-ink); border-top: 1px solid var(--landing-line-dark);">
		<div class="mx-auto max-w-[1400px]">
			<div class="grid gap-10 md:grid-cols-[2fr_1fr_1fr] md:gap-16">
				<div>
					<div class="font-display text-3xl">
						Patch<span class="font-display-italic" style="color: var(--landing-oxide)">.</span>
					</div>
					<p class="mt-3 max-w-sm text-sm leading-relaxed" style="color: var(--landing-muted-on-ink)">
						Infraestrutura de carreira para profissionais de tech. Construído por devs, para devs.
					</p>
				</div>

				<div>
					<p class="mb-3 font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
						Produto
					</p>
					<ul class="space-y-2 text-sm">
						<li><a href="/identity/sign-up" class="hover:underline" style="text-decoration-color: var(--landing-oxide);">Começar</a></li>
						<li><span style="color: var(--landing-muted-on-ink)">Privacidade</span></li>
						<li><span style="color: var(--landing-muted-on-ink)">Termos de uso</span></li>
					</ul>
				</div>

				<div>
					<p class="mb-3 font-mono text-[10px] uppercase tracking-[0.22em]" style="color: var(--landing-muted-on-ink)">
						Contato
					</p>
					<ul class="space-y-2 text-sm">
						<li>
							<a
								href="mailto:oi@patchcareers.org"
								class="transition-colors"
								style="transition-duration: var(--dur-tight);"
								onmouseenter={(e) => (e.currentTarget.style.color = 'var(--landing-oxide)')}
								onmouseleave={(e) => (e.currentTarget.style.color = '')}
							>
								oi@patchcareers.org
							</a>
						</li>
					</ul>
				</div>
			</div>

			<div class="mt-14 flex flex-col items-start justify-between gap-3 border-t pt-8 font-mono text-[10px] uppercase tracking-[0.22em] md:flex-row md:items-center" style="border-color: var(--landing-line-dark); color: var(--landing-muted-on-ink);">
				<p>© 2026 Patch Careers &mdash; Todos os direitos reservados</p>
				<p>Nº 001 · Abril 2026 · Set em Instrument Serif + Inter + JetBrains Mono</p>
			</div>
		</div>
	</footer>
</div>
