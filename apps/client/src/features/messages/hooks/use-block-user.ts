/**
 * `useBlockUser` — block the person on the other side of a thread.
 *
 * Blocking is the one moderation control that belongs to the person, not to
 * an operator: the admin side of chat was removed precisely because reading
 * other people's conversations is not a capability to keep around. This is
 * the half that stays.
 *
 * On success the inbox is refetched, since the blocked conversation drops
 * out of it.
 */
import { getV1ChatConversationsQueryKey, usePostV1ChatBlocked } from "@patch-careers/api-client";
import { useToast } from "@patch-careers/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/providers/i18n-provider";

export function useBlockUser(): {
  block: (userId: string, onDone?: () => void) => void;
  isPending: boolean;
} {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();
  const mutation = usePostV1ChatBlocked();

  const block = (userId: string, onDone?: () => void): void => {
    mutation.mutate(
      { data: { userId } },
      {
        onSuccess: async () => {
          toast.show({ title: t("messages.block.done"), intent: "success" });
          await queryClient.invalidateQueries({ queryKey: getV1ChatConversationsQueryKey() });
          onDone?.();
        },
        onError: () => toast.show({ title: t("messages.block.failed"), intent: "danger" }),
      },
    );
  };

  return { block, isPending: mutation.isPending };
}
