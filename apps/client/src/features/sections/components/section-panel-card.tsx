/**
 * A section as its own card — the shell the desktop profile stacks.
 *
 * Distinct from `SectionCard`, which is deliberately borderless because the
 * rows inside it are already hairline cards and a box there would nest borders.
 * Here the rows are bare (see `SectionDetailRow`), so the border belongs to the
 * card, and the stack of cards is what separates one section from the next.
 *
 * The title is sans-serif, not the serif `SectionCard` uses: on this page the
 * serif is spoken by the person's name in the masthead, and repeating it on
 * every section heading flattened the difference between "who this is" and
 * "what is in here".
 */

import { type ReactElement, type ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useEd, webNoOutline } from "../lib/styles";

export function SectionPanelCard({
  title,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  /**
   * Comes localised from the backend (`sectionType.addLabel`) — "Adicionar
   * experiência", not a template we assemble.
   */
  addLabel?: string | undefined;
  onAdd?: (() => void) | undefined;
  children: ReactNode;
}): ReactElement {
  const ed = useEd();
  const [active, setActive] = useState(false);

  return (
    <View style={ed.panelCard}>
      <Text style={ed.panelCardTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
      {onAdd && addLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          onPress={onAdd}
          onHoverIn={() => setActive(true)}
          onHoverOut={() => setActive(false)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          style={({ pressed }) => [
            ed.addWide,
            (active || pressed) && ed.addWideActive,
            webNoOutline,
          ]}
        >
          <Text style={ed.addWideLabel}>{`+  ${addLabel}`}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
