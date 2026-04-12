<script lang="ts">
	type Props = {
		textClass: string;
	};

	let { textClass }: Props = $props();
</script>

<a href="/" class="text-sm font-bold tracking-tight {textClass}">
	patch<span class="font-light opacity-40">careers</span>
</a>
