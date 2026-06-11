/**
 * Jobs tab — external listings from the daily JSearch batch.
 *
 * Chrome (serif heading, search pill, filter chips) stays fixed; only the
 * list scrolls. Search is debounced before it hits the API; filters are
 * always visible (no hidden filter drawer). The list is an endless scroll
 * over the page-based endpoint, with pull-to-refresh, skeleton first paint,
 * and recoverable error/empty states.
 */

import type { JobType } from "@patch-careers/api-client";
import { EmptyState, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { BriefcaseBusiness, SearchX } from "lucide-react-native";
import { type ReactElement, useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useExternalJobs } from "../hooks/queries";
import { hasActiveFilters } from "../lib/helpers";
import { EMPTY_JOBS_FILTERS, type ExternalJob, type JobsFilters } from "../types";
import { JobCard } from "./job-card";
import { JobFilterChips } from "./job-filter-chips";
import { JobListSkeleton } from "./job-list-skeleton";
import { JobSearchField } from "./job-search-field";

function RowSeparator(): ReactElement {
  const editorialPalette = useEditorialPalette();
  return <View style={{ height: 1, marginLeft: 20, backgroundColor: editorialPalette.hairline }} />;
}

export function JobsScreen(): ReactElement {
  const editorialPalette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filters, setFilters] = useState<JobsFilters>(EMPTY_JOBS_FILTERS);
  const debouncedQ = useDebouncedValue(filters.q);
  const list = useExternalJobs({ ...filters, q: debouncedQ });
  const now = Date.now();
  const filtersActive = hasActiveFilters(filters);

  const openJob = useCallback(
    (job: ExternalJob) => {
      router.push({ pathname: "/job/[id]", params: { id: job.id } });
    },
    [router],
  );

  function clearFilters(): void {
    setFilters(EMPTY_JOBS_FILTERS);
  }

  function body(): ReactElement {
    if (list.isLoading) return <JobListSkeleton />;

    if (list.isError) {
      return (
        <YStack flex={1} justifyContent="center">
          <EmptyState
            icon={<Icon as={BriefcaseBusiness} size={32} color={editorialPalette.subtle} />}
            title="Não foi possível carregar as vagas"
            description="Verifique sua conexão e tente novamente."
            ctaLabel="Tentar novamente"
            onCta={list.refetch}
          />
        </YStack>
      );
    }

    if (list.jobs.length === 0) {
      return (
        <YStack flex={1} justifyContent="center">
          {filtersActive ? (
            <EmptyState
              icon={<Icon as={SearchX} size={32} color={editorialPalette.subtle} />}
              title="Nenhuma vaga encontrada"
              description="Tente outros termos ou remova os filtros."
              ctaLabel="Limpar filtros"
              onCta={clearFilters}
            />
          ) : (
            <EmptyState
              icon={<Icon as={BriefcaseBusiness} size={32} color={editorialPalette.subtle} />}
              title="Nenhuma vaga por aqui ainda"
              description="Novas vagas chegam todos os dias às 6h. Volte em breve."
            />
          )}
        </YStack>
      );
    }

    return (
      <FlatList
        data={list.jobs}
        keyExtractor={(job) => job.id}
        renderItem={({ item }) => <JobCard job={item} now={now} onPress={openJob} />}
        ItemSeparatorComponent={RowSeparator}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching}
            onRefresh={list.refetch}
            tintColor={editorialPalette.muted}
          />
        }
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={editorialPalette.muted} />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: editorialPalette.bg }}>
      <YStack gap={12} paddingTop={16} paddingBottom={12}>
        <XStack
          alignItems="baseline"
          justifyContent="space-between"
          paddingHorizontal={20}
          gap={12}
        >
          <Text fontFamily={editorialFonts.serif} fontSize={28} color={editorialPalette.ink}>
            Vagas
          </Text>
          <Text preset="caption" fontSize={12} color={editorialPalette.subtle}>
            {list.isLoading
              ? "Atualizadas diariamente"
              : `${list.total} ${list.total === 1 ? "vaga" : "vagas"}`}
          </Text>
        </XStack>
        <JobSearchField
          value={filters.q}
          onChangeText={(q) => setFilters((prev) => ({ ...prev, q }))}
          onClear={() => setFilters((prev) => ({ ...prev, q: "" }))}
        />
        <JobFilterChips
          filters={filters}
          onToggleRemote={() => setFilters((prev) => ({ ...prev, remoteOnly: !prev.remoteOnly }))}
          onSelectEmploymentType={(employmentType: JobType | null) =>
            setFilters((prev) => ({ ...prev, employmentType }))
          }
        />
      </YStack>
      <View style={{ height: 1, backgroundColor: editorialPalette.hairline }} />
      {body()}
    </View>
  );
}
