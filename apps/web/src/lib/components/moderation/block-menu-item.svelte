<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createChatBlockUsersBlockedPost,
  chatBlockUsersBlockedGetQueryKey,
  chatBlockUsersBlockedStatusQueryKey,
  feedListQueryKey,
} from 'api-client';
import { Shield } from 'lucide-svelte';
import { Button, ConfirmModal, toastState } from 'ui';
import { track } from '$lib/utils/analytics/track';
import { locale } from '$lib/state/locale.svelte';

/**
 * Frontend-burro renderer for the "Block user" affordance. The block
 * mutation hits `POST /api/v1/chat/block-users/blocked`; success/error
 * copy comes from the locale layer (no domain logic here). Once the
 * server confirms, we invalidate the three views that may show the
 * blocked user (block list, is-blocked status, feed timeline).
 */
type Props = {
  /** ID of the user being blocked. */
  targetUserId: string;
  /** Display name (used in the confirm dialog). */
  targetName: string;
  /** Where the action was triggered — for analytics. */
  source: string;
  /** Visual style of the trigger. `menu` (default) is a dropdown item;
   *  `ghost` is an inline link-style button (comments, chat, etc). */
  variant?: 'menu' | 'ghost';
  size?: 'xs' | 'sm';
  /** Called after confirmation so the container can close (e.g. dropdown). */
  onbeforeConfirm?: () => void;
  /** Called after successful block (for container to react, e.g. hide post). */
  onblocked?: () => void;
};

let {
  targetUserId,
  targetName,
  source,
  variant = 'menu',
  size = 'sm',
  onbeforeConfirm,
  onblocked,
}: Props = $props();

const t = $derived(locale.t);
const queryClient = useQueryClient();
let showConfirm = $state(false);

const blockMutation = createChatBlockUsersBlockedPost({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: chatBlockUsersBlockedStatusQueryKey(targetUserId),
      });
      queryClient.invalidateQueries({ queryKey: chatBlockUsersBlockedGetQueryKey() });
      queryClient.invalidateQueries({ queryKey: feedListQueryKey() });
      track('user_blocked', { targetUserId, source });
      toastState.show(t('network.blockSuccess'), 'success');
      onblocked?.();
    },
    onError() {
      toastState.show(t('network.blockError'), 'danger');
    },
  },
});

function openConfirm() {
  onbeforeConfirm?.();
  showConfirm = true;
}

function confirm() {
  showConfirm = false;
  $blockMutation.mutate({ data: { userId: targetUserId } });
}
</script>

<Button {variant} {size} onclick={openConfirm}>
	<Shield size={variant === 'ghost' ? 12 : 14} />
	{t('network.block')}
</Button>

<ConfirmModal
	open={showConfirm}
	onClose={() => (showConfirm = false)}
	onConfirm={confirm}
	title={t('network.blockConfirmTitle', { name: targetName })}
	message={t('network.blockConfirmMessage')}
	confirmLabel={t('network.block')}
	confirmIntent="danger"
/>
