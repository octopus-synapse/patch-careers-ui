/**
 * Full-list Jobs screen, pushed from a home shelf's "Ver tudo". Renders the
 * previous Jobs tab experience (scope pills, filters, recommendations,
 * endless scroll) opened on the requested scope, under a slim back bar —
 * the serif "Vagas" masthead inside JobsScreen stays the screen's title.
 */

import { Icon, XStack, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type JobsScope, JobsScreen } from "@/features/jobs";
import { useI18n } from "@/providers/i18n-provider";

const SCOPES: ReadonlySet<string> = new Set(["all", "saved", "applications"]);

export default function JobListScreen(): ReactElement {
  const editorialPalette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ scope: string }>();
  const raw = Array.isArray(params.scope) ? params.scope[0] : params.scope;
  const scope: JobsScope = raw && SCOPES.has(raw) ? (raw as JobsScope) : "all";

  const goBack = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace("/jobs");
  };

  return (
    <View style={{ flex: 1, backgroundColor: editorialPalette.bg, paddingTop: insets.top }}>
      <XStack alignItems="center" height={48} paddingHorizontal={8}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={goBack}
          hitSlop={8}
        >
          <YStack width={38} height={38} alignItems="center" justifyContent="center">
            <Icon as={ChevronLeft} size={26} color={editorialPalette.ink} />
          </YStack>
        </Pressable>
      </XStack>
      <JobsScreen initialScope={scope} />
    </View>
  );
}
