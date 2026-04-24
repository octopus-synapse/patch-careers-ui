<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createChatBlockUsersBlockUser,
  getChatBlockUsersGetBlockedUsersQueryKey,
  getChatBlockUsersIsBlockedQueryKey,
  getFeedGetTimelineQueryKey,
} from 'api-client';
import { Shield } from 'lucide-svelte';
import { Button, ConfirmModal, toastState } from 'ui';
import { track } from '$lib/utils/analytics/track';
import { locale } from '$lib/state/locale.svelte';

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

const blockMutation = createChatBlockUsersBlockUser(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: getChatBlockUsersIsBlockedQueryKey(targetUserId),
      });
      queryClient.invalidateQueries({ queryKey: getChatBlockUsersGetBlockedUsersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getFeedGetTimelineQueryKey() });
      track('user_blocked', { targetUserId, source });
      toastState.show(t('network.blockSuccess'), 'success');
      onblocked?.();
    },
    onError() {
      toastState.show(t('network.blockError'), 'danger');
    },
  },
}));

function openConfirm() {
  onbeforeConfirm?.();
  showConfirm = true;
}

function confirm() {
  showConfirm = false;
  blockMutation.mutate({ data: { userId: targetUserId } });
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
