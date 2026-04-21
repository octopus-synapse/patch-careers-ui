<script lang="ts">
type Props = {
  name: string;
  photoURL?: string | null;
  size?: 'sm' | 'md' | 'lg';
};

let { name, photoURL, size = 'sm' }: Props = $props();

const initial = $derived(name.charAt(0).toUpperCase());
const sizeClass = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
const imgSize = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };

// Deterministic gradient per name so the fallback chip varies across users
// (instead of every name rendering the same flat neutral block — UX #23).
const palette = [
  'from-rose-400 to-fuchsia-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-lime-400 to-emerald-500',
  'from-cyan-400 to-blue-500',
];

function hashName(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const gradient = $derived(palette[hashName(name) % palette.length]);
</script>

{#if photoURL}
	<img
		src={photoURL}
		alt=""
		aria-label="{name}"
		class="rounded-full object-cover {imgSize[size]}"
	/>
{:else}
	<div
		role="img"
		aria-label="{name}"
		class="flex items-center justify-center rounded-full font-semibold text-white bg-gradient-to-br {gradient} {sizeClass[size]}"
	>
		{initial}
	</div>
{/if}
