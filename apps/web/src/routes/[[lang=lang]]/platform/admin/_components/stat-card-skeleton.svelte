<script lang="ts">
import { Card, Skeleton } from 'ui';
</script>

<Card class="md:p-6">
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0 flex-1 space-y-2">
			<Skeleton height="0.75rem" width="5rem" />
			<Skeleton height="1.5rem" width="4rem" />
		</div>
		<Skeleton width="2.25rem" height="2.25rem" class="shrink-0 rounded-lg" />
	</div>
</Card>
