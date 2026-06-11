/** Section/group caption shared by results, recents and Explorar lists. */

import { Text } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";

export function SearchSectionLabel({ children }: { children: string }): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <Text
      preset="caption"
      color={editorialPalette.subtle}
      fontWeight="700"
      paddingHorizontal={16}
      paddingTop={16}
      paddingBottom={4}
    >
      {children}
    </Text>
  );
}
