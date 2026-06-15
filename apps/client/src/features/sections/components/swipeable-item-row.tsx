/**
 * One saved section entry in the resume section manager. Tap edits (modal);
 * delete is platform-split:
 *   - native: swipe left reveals a trash action (ReanimatedSwipeable);
 *   - web: mouse-swipe is poor UX on RNW, so the trash stays inline and
 *     hover-revealed (same affordance as the onboarding editor's cards).
 */
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Trash2 } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useI18n } from "@/providers/i18n-provider";
import { itemCardParts } from "../lib/helpers";
import { useEd, webNoOutline } from "../lib/styles";
import type { SectionField, SectionItem } from "../types";

const ACTION_WIDTH = 72;

function RowCard({
  index,
  item,
  fields,
  onEdit,
  onDelete,
  deleteLabel,
  inlineTrash,
}: {
  index: number;
  item: SectionItem;
  fields?: SectionField[] | undefined;
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel: string;
  inlineTrash: boolean;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const { locale } = useI18n();
  const { primary, meta } = itemCardParts(item, locale, fields);
  const [active, setActive] = useState(false);
  const [removeActive, setRemoveActive] = useState(false);
  const ordinal = String(index + 1).padStart(2, "0");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={primary}
      {...(meta ? { accessibilityHint: meta } : {})}
      onPress={onEdit}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={({ pressed }) => [ed.card, (active || pressed) && ed.cardActive, webNoOutline]}
    >
      <Text style={ed.cardIndex}>{ordinal}</Text>
      <View style={ed.cardBody}>
        <Text style={ed.cardPrimary} numberOfLines={1}>
          {primary}
        </Text>
        {meta ? (
          <Text style={ed.cardMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {inlineTrash ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
          onPress={onDelete}
          onHoverIn={() => setRemoveActive(true)}
          onHoverOut={() => setRemoveActive(false)}
          onFocus={() => setRemoveActive(true)}
          onBlur={() => setRemoveActive(false)}
          hitSlop={10}
          style={({ pressed }) => [
            ed.cardRemove,
            (removeActive || pressed) && ed.cardRemoveActive,
            webNoOutline,
          ]}
        >
          <Trash2
            size={16}
            color={removeActive ? authTokens.danger : authTokens.muted}
            strokeWidth={1.75}
          />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export function SwipeableItemRow({
  index,
  item,
  fields,
  onEdit,
  onDelete,
  deleteLabel,
}: {
  index: number;
  item: SectionItem;
  fields?: SectionField[] | undefined;
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel: string;
}): ReactElement {
  const authTokens = useEditorialPalette();

  if (Platform.OS === "web") {
    return (
      <RowCard
        index={index}
        item={item}
        fields={fields}
        onEdit={onEdit}
        onDelete={onDelete}
        deleteLabel={deleteLabel}
        inlineTrash
      />
    );
  }

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
          onPress={onDelete}
          style={styles.action}
        >
          <Trash2 size={20} color={authTokens.danger} strokeWidth={1.75} />
        </Pressable>
      )}
    >
      <RowCard
        index={index}
        item={item}
        fields={fields}
        onEdit={onEdit}
        onDelete={onDelete}
        deleteLabel={deleteLabel}
        inlineTrash={false}
      />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
});
