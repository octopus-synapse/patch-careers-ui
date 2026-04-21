<script lang="ts">
import { Check } from 'lucide-svelte';
import { Button } from 'ui';
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

<!--
  Landing is deliberately always-dark (brand), but we reference a CSS custom
  property so it's themeable if we ever ship a light variant of marketing.
-->
<div class="landing-shell text-slate-200 antialiased selection:bg-cyan-300/20">
	<!-- Hero -->
	<section class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 sm:px-6 pt-20 text-center">
		<div class="absolute inset-0 -z-10 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent"></div>
		<div class="absolute inset-x-0 top-0 -z-10 h-[200vh] origin-top bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:60px_60px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)] [transform:perspective(1000px)_rotateX(60deg)]"></div>

		<div class="z-10 mx-auto max-w-7xl space-y-8">
			<div class="inline-block rounded-full border border-cyan-500/30 px-3 py-1 transition-all duration-500 hover:scale-105 hover:border-cyan-500/60">
				<span class="font-mono text-xs uppercase tracking-widest text-cyan-400">
					Early Access · Vagas limitadas
				</span>
			</div>

			<h1>
				<span class="block text-3xl font-semibold leading-[0.8] tracking-tighter text-white sm:text-5xl md:text-[9rem]">
					Sua Carreira,
				</span>
				<span class="relative mt-4 inline-block md:mt-0">
					<span class="text-5xl font-black uppercase text-white drop-shadow-2xl sm:text-7xl md:text-[11rem]">
						Patched
					</span>
					<span class="absolute -right-3 -top-3 text-5xl font-black text-cyan-500 animate-pulse sm:text-7xl sm:-right-6 sm:-top-6 md:text-[11rem]">
						.
					</span>
				</span>
			</h1>

			<p class="mx-auto max-w-4xl text-xl font-light leading-relaxed text-zinc-400 md:text-3xl">
				O Patch reescreve seu currículo para cada vaga —
				<span class="font-bold text-white underline decoration-cyan-500 decoration-4 underline-offset-8">
					automaticamente.
				</span>
			</p>

			<div class="space-y-6 pt-12">
				<div class="flex items-center justify-center gap-4">
					<div class="flex -space-x-2">
						<div class="h-8 w-8 rounded-full border-2 border-zinc-900 bg-gradient-to-br from-cyan-400 to-blue-600"></div>
						<div class="h-8 w-8 rounded-full border-2 border-zinc-900 bg-gradient-to-br from-purple-400 to-pink-600"></div>
						<div class="h-8 w-8 rounded-full border-2 border-zinc-900 bg-gradient-to-br from-orange-400 to-red-600"></div>
					</div>
					<span class="text-sm text-zinc-400">
						Primeiros beta users já conseguiram entrevistas
					</span>
				</div>

				<div class="flex flex-col items-center justify-center gap-6 md:flex-row">
					<a
						href="/signup"
						class="group relative overflow-hidden bg-white px-10 py-5 text-sm font-black uppercase tracking-widest text-black transition-all duration-300 hover:scale-105 hover:bg-cyan-500 hover:shadow-2xl hover:shadow-cyan-500/25"
					>
						Quero entrevistas
					</a>
				</div>

				<div class="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
					{#each heroBenefits as benefit}
						<span class="flex items-center gap-1.5">
							<span class="text-cyan-500">✓</span>
							{benefit}
						</span>
					{/each}
				</div>
			</div>
		</div>

		<div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
			<div class="flex h-10 w-6 justify-center rounded-full border-2 border-zinc-700">
				<div class="mt-2 h-2 w-1 animate-pulse rounded-full bg-cyan-500"></div>
			</div>
		</div>
	</section>

	<!-- Interactive demo: 3 scripted scenarios showing the rewrite in action. -->
	<LandingDemo />

	<!-- Success stories carousel (renders only when the backend has PUBLISHED rows). -->
	<LandingSuccessStories />

	<!-- CTA Emocional -->
	<section class="relative overflow-hidden bg-black px-4 py-20 sm:px-6 sm:py-32 md:py-48 text-center">
		<div class="absolute inset-0">
			<div class="absolute left-1/2 top-0 h-px w-[800px] -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
			<div class="absolute bottom-0 left-1/2 h-px w-[800px] -translate-x-1/2 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
		</div>
		<div class="relative z-10 mx-auto max-w-4xl space-y-8">
			<p class="font-mono text-xs uppercase tracking-[0.5em] text-zinc-600">
				A hora é agora
			</p>
			<h2 class="text-4xl font-black uppercase leading-none tracking-tighter sm:text-6xl md:text-[9rem]">
				Pare de ser
				<br />
				<span class="text-white [text-shadow:0_0_30px_rgba(0,242,255,0.3)]">ignorado.</span>
			</h2>
			<p class="mx-auto max-w-xl text-xl text-zinc-500">
				Cada dia sem o Patch é mais um currículo mandado para o lixo antes de qualquer humano ler.
			</p>
			<div class="flex flex-col items-center gap-4 pt-4">
				<a
					href="/signup"
					class="bg-white px-8 py-5 text-base font-black uppercase tracking-widest text-black transition-all hover:bg-cyan-400 active:scale-95 sm:px-16 sm:py-8 sm:text-2xl"
				>
					Quero entrevistas
				</a>
				<p class="font-mono text-sm text-zinc-600">R$79/mês · cancele quando quiser</p>
			</div>
		</div>
	</section>

	<!-- Pricing -->
	<section class="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-24 md:py-40 text-zinc-900">
		<div class="relative z-10 mx-auto max-w-5xl">
			<div class="mb-16 text-center">
				<h3 class="mb-4 font-mono text-xs uppercase tracking-[0.8em] text-cyan-600">
					Simples assim
				</h3>
				<h2 class="text-3xl font-black uppercase tracking-tighter text-zinc-900 sm:text-5xl md:text-7xl">
					Um plano.
					<br />
					<span class="text-cyan-600">Sem pegadinha.</span>
				</h2>
			</div>

			<div class="grid items-start gap-8 sm:gap-12 lg:grid-cols-2">
				<div>
					<div class="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-10 text-white">
						<div class="mb-8 flex items-center justify-between">
							<div class="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5">
								<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500"></span>
								<span class="font-mono text-xs font-bold uppercase tracking-widest text-cyan-400">
									PATCH Active
								</span>
							</div>
							<span class="font-mono text-xs uppercase text-zinc-500">Early Access</span>
						</div>

						<div class="mb-8">
							<div class="flex items-end gap-2">
								<span class="text-lg text-zinc-500">R$</span>
								<span class="text-5xl font-black leading-none sm:text-7xl">79</span>
								<span class="mb-2 text-sm text-zinc-500">/mês</span>
							</div>
							<p class="mt-2 text-sm text-zinc-500">Cancele quando quiser. Sem multa.</p>
						</div>

						<div class="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
							<div class="mb-2 flex items-center justify-between">
								<span class="text-xs text-zinc-400">Vagas de early access restantes</span>
								<span class="font-mono text-xs font-bold text-cyan-400">49 / 200</span>
							</div>
							<div class="h-2 w-full rounded-full bg-zinc-800">
								<div class="h-2 w-[24.5%] rounded-full bg-cyan-500"></div>
							</div>
							<p class="mt-2 font-mono text-xs text-zinc-600">
								Preço travado para os primeiros 200 usuários.
							</p>
						</div>

						<div class="mb-8 h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
						<ul class="mb-10 space-y-4">
							{#each planFeatures as feature}
								<li class="flex items-start gap-3 text-sm text-zinc-300">
									<Check size={20} class="mt-0.5 shrink-0 text-cyan-500" />
									{feature}
								</li>
							{/each}
						</ul>

						<a
							href="/signup"
							class="block w-full rounded-lg bg-cyan-500 py-5 text-center text-sm font-black uppercase tracking-widest text-black transition-all duration-150 hover:bg-cyan-400 active:scale-95"
						>
							Ativar por R$79/mês
						</a>
						<p class="mt-4 text-center font-mono text-xs text-zinc-600">
							Sem cartão no cadastro · Acesso imediato
						</p>
					</div>
				</div>

				<div>
					<p class="mb-8 font-mono text-xs uppercase tracking-widest text-zinc-500">
						Perguntas frequentes
					</p>
					<div class="space-y-0">
						{#each faqs as [question, answer], i}
							<div class="border-b border-zinc-200 py-6 last:border-none">
								<Button
									variant="ghost"
									size="md"
									onclick={() => openFaq = openFaq === i ? null : i}
									class="flex w-full items-center justify-between text-left"
								>
									<p class="font-bold text-zinc-900">{question}</p>
									<span class="ml-4 shrink-0 text-zinc-400 transition-transform {openFaq === i ? 'rotate-45' : ''}">+</span>
								</Button>
								{#if openFaq === i}
									<p class="mt-3 text-sm leading-relaxed text-zinc-600">{answer}</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-zinc-900 bg-black px-4 py-8 sm:px-6 sm:py-12">
		<div class="mx-auto max-w-6xl">
			<div class="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<span class="text-2xl font-black tracking-tighter text-white">PATCH</span>
						<span class="text-2xl font-black text-cyan-500">.</span>
					</div>
					<p class="text-sm text-zinc-600">
						Infraestrutura de carreira para profissionais de tech.
					</p>
				</div>
				<div class="flex flex-wrap gap-6 text-sm text-zinc-600">
					<span>Privacidade</span>
					<span>Termos de uso</span>
					<a href="mailto:oi@patchcareers.org" class="transition-colors hover:text-zinc-400">
						oi@patchcareers.org
					</a>
				</div>
			</div>
			<div class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-900 pt-8 md:flex-row">
				<p class="font-mono text-xs text-zinc-700">
					© 2026 PATCH Careers. Todos os direitos reservados.
				</p>
				<p class="font-mono text-xs text-zinc-700">Built by tech, for tech.</p>
			</div>
		</div>
	</footer>
</div>
