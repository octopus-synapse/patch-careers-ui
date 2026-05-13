<script lang="ts">
import type { Snippet } from 'svelte';
import Button from '../button/button.component.svelte';
import Modal from '../modal/modal.component.svelte';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  children: Snippet;
};

let {
  open,
  onClose,
  onSubmit,
  title = '',
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  children,
}: Props = $props();
</script>

<!--
  Declare the title snippet at the template top-level (not inside <Modal>):
  a `{#snippet title()}` declared as a child of <Modal> would also bind a
  local `title` identifier that shadows the `title: string` prop above,
  yielding `invalid_snippet_arguments` at runtime. Pass the snippet by
  reference under a distinct name instead.
-->
{#snippet titleContent()}{title}{/snippet}

<Modal {open} {onClose} title={title ? titleContent : undefined}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			onSubmit();
		}}
		class="space-y-4"
	>
		{@render children()}
		<div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
			<Button variant="outline" size="sm" onclick={onClose} disabled={loading} type="button">{cancelLabel}</Button>
			<Button variant="solid" size="sm" disabled={loading} type="submit">{submitLabel}</Button>
		</div>
	</form>
</Modal>
