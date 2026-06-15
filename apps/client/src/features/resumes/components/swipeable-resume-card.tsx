/**
 * Platform-split wrapper around <ResumeCard> that adds duplicate/delete actions:
 *   - native: swipe the row left to reveal a "Duplicar" + "Excluir" drawer
 *     (ReanimatedSwipeable), same affordance as the section manager rows;
 *   - web: mouse-swipe is poor UX on RNW, so the actions render as inline
 *     hover-revealed icon buttons in the card head instead.
 * The master resume passes no `onDelete`, so its delete affordance never shows.
 */
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Copy, Trash2 } from "lucide-react-native";
import { type ComponentRef, type ReactElement, useRef } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useI18n } from "@/providers/i18n-provider";
import type { ResumeListItem } from "../hooks/queries";
import { useRz } from "../lib/styles";
import { ResumeCard } from "./resume-card";

const ACTION_WIDTH = 76;

export function SwipeableResumeCard({
  item,
  onOpen,
  onPreview,
  onDuplicate,
  onDelete,
  canDuplicate,
}: {
  item: ResumeListItem;
  onOpen: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onDelete: (() => void) | undefined;
  canDuplicate: boolean;
}): ReactElement {
  const { t } = useI18n();
  const rz = useRz();
  const palette = useEditorialPalette();
  const swipeRef = useRef<ComponentRef<typeof ReanimatedSwipeable>>(null);

  if (Platform.OS === "web") {
    return (
      <ResumeCard
        item={item}
        onOpen={onOpen}
        onPreview={onPreview}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        canDuplicate={canDuplicate}
        inlineActions
      />
    );
  }

  // Close the drawer first so the row settles back before the dialog/mutation.
  const run = (action: () => void) => () => {
    swipeRef.current?.close();
    action();
  };

  const actionCount = (canDuplicate ? 1 : 0) + (onDelete ? 1 : 0);

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      enabled={actionCount > 0}
      renderRightActions={() => (
        <View style={rz.swipeActions}>
          {canDuplicate ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("resumes.card.duplicateLabel", { title: item.title })}
              onPress={run(onDuplicate)}
              style={[rz.swipeAction, rz.swipeActionDuplicate]}
            >
              <Copy size={19} color={palette.ink} strokeWidth={1.75} />
              <Text style={[rz.swipeActionLabel, rz.swipeActionLabelDuplicate]}>
                {t("resumes.card.duplicateAction")}
              </Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("resumes.card.deleteLabel", { title: item.title })}
              onPress={run(onDelete)}
              style={[rz.swipeAction, rz.swipeActionDelete]}
            >
              <Trash2 size={19} color={palette.onPrimary} strokeWidth={1.75} />
              <Text style={[rz.swipeActionLabel, rz.swipeActionLabelDelete]}>
                {t("resumes.card.deleteAction")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    >
      <ResumeCard item={item} onOpen={onOpen} onPreview={onPreview} />
    </ReanimatedSwipeable>
  );
}
