/**
 * Job detail — pushed over the tabs from a list card.
 *
 * There is no `GET /v1/jobs/external/:id`: listings exist only inside the
 * list cache (daily batch), so this screen resolves its data via
 * `findExternalJob`. A cold deep link (cache miss) degrades to a friendly
 * not-found state pointing back to the list.
 *
 * One primary CTA — "Candidatar-se" — opens the publisher's apply URL in
 * the in-app browser; the caption under it makes the handoff explicit.
 */

import { EmptyState, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ChevronLeft, FileQuestion } from "lucide-react-native";
import { type ReactElement, useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/providers/i18n-provider";
import { findExternalJob } from "../hooks/queries";
import { jobMetaLine, postedAgo } from "../lib/helpers";

export function JobDetailScreen({ id }: { id: string }): ReactElement {
  const editorialPalette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useI18n();

  const job = useMemo(() => findExternalJob(queryClient, id), [queryClient, id]);

  function goBack(): void {
    if (router.canGoBack()) router.back();
    else router.replace("/jobs");
  }

  return (
    <View style={{ flex: 1, backgroundColor: editorialPalette.bg, paddingTop: insets.top }}>
      <XStack alignItems="center" height={44} paddingHorizontal={8}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={goBack}
          hitSlop={8}
          style={{ padding: 6 }}
        >
          <Icon as={ChevronLeft} size={24} color={editorialPalette.ink} />
        </Pressable>
      </XStack>

      {job === null ? (
        <YStack flex={1} justifyContent="center">
          <EmptyState
            icon={<Icon as={FileQuestion} size={32} color={editorialPalette.subtle} />}
            title="Vaga não encontrada"
            description="Esta vaga não está mais disponível ou ainda não foi carregada."
            ctaLabel="Ver vagas"
            onCta={() => router.replace("/jobs")}
          />
        </YStack>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 }}
          >
            <YStack gap={10}>
              <Text
                preset="caption"
                fontSize={13}
                letterSpacing={0.8}
                textTransform="uppercase"
                color={editorialPalette.muted}
              >
                {job.company}
              </Text>
              <Text
                fontFamily={editorialFonts.serif}
                fontSize={26}
                lineHeight={34}
                color={editorialPalette.ink}
                accessibilityRole="header"
              >
                {job.title}
              </Text>
              {jobMetaLine(job, locale) ? (
                <Text preset="caption" fontSize={14} color={editorialPalette.body}>
                  {jobMetaLine(job, locale)}
                </Text>
              ) : null}
              <Text preset="caption" fontSize={12} color={editorialPalette.subtle}>
                {[postedAgo(job, Date.now()), job.publisher ? `via ${job.publisher}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </YStack>

            <View
              style={{
                height: 1,
                backgroundColor: editorialPalette.hairline,
                marginVertical: 20,
              }}
            />

            {job.description ? (
              <Text fontSize={15} lineHeight={24} color={editorialPalette.body}>
                {job.description}
              </Text>
            ) : (
              <Text fontSize={15} lineHeight={24} color={editorialPalette.muted}>
                O anunciante não forneceu uma descrição. Os detalhes completos estão na página da
                vaga.
              </Text>
            )}
          </ScrollView>

          <YStack
            gap={8}
            paddingHorizontal={24}
            paddingTop={12}
            paddingBottom={insets.bottom + 12}
            backgroundColor={editorialPalette.bg}
            borderTopWidth={1}
            borderTopColor={editorialPalette.hairline}
          >
            <PrimaryAction
              label="Candidatar-se"
              onPress={() => void WebBrowser.openBrowserAsync(job.applyUrl)}
            />
            <Text preset="caption" fontSize={12} color={editorialPalette.subtle} textAlign="center">
              {job.publisher
                ? `Abre a vaga no site do anunciante (${job.publisher})`
                : "Abre a vaga no site do anunciante"}
            </Text>
          </YStack>
        </>
      )}
    </View>
  );
}
