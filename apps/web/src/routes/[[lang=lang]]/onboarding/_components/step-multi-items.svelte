<script lang="ts">
import MultiItemsCards from './multi-items-cards.svelte';
import MultiItemsTags from './multi-items-tags.svelte';

type Field = {
  key: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  widget?: string;
};

type Item = { id?: string; content?: Record<string, unknown> };

type Props = {
  fields: Field[];
  items: Item[];
  sectionTypeKey?: string;
  onupdate: (items: Item[]) => void;
};

let { fields, items, sectionTypeKey, onupdate }: Props = $props();

// Section types that read as a flat collection of small atoms (a skill,
// a language) render best as pills. Larger, structured items (a job, a
// degree, a project) get full cards. The split is owned here so the
// stepper can pass `sectionTypeKey` verbatim from the backend payload.
const TAG_SECTIONS = new Set([
  'skill_set_v1',
  'hard_skill_set_v1',
  'soft_skill_set_v1',
  'language_v1',
]);

const displayMode = $derived(
  sectionTypeKey && TAG_SECTIONS.has(sectionTypeKey) ? 'tags' : 'cards',
);
</script>

{#if displayMode === 'tags'}
	<MultiItemsTags {fields} {items} {onupdate} />
{:else}
	<MultiItemsCards {fields} {items} {onupdate} />
{/if}
