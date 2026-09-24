import { getV1CompaniesSearch } from "@patch-careers/api-client";
import { Text, useEditorialPalette, YStack } from "@patch-careers/ui";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { useState } from "react";
import { normalize, type Opportunity, safeJobUrl } from "../lib/discovery";

const failedImages = new Set<string>();
const normalizeCompany = (name: string) =>
  normalize(name)
    .replace(/\b(inc|ltda|llc|sa|s a)\b/g, "")
    .replace(/[^a-z\d]/g, "");

/** Company lookup is shared by name and only starts when a card is visible.
 * URLs are identical at every display size, allowing normal CDN/browser caching.
 */
export function JobLogo({
  job,
  large = false,
  hero = false,
}: {
  job: Pick<Opportunity, "company" | "companyDomain" | "companyLogoUrl">;
  large?: boolean;
  /** Compact rounded-square treatment used beside the company name on job details. */
  hero?: boolean;
}) {
  const palette = useEditorialPalette();
  const [failed, setFailed] = useState(false);
  const extra = Constants.expoConfig?.extra as { logoDevPublishableKey?: string } | undefined;
  const token =
    extra?.logoDevPublishableKey?.trim() ||
    process.env.EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY?.trim();
  const companyKey = normalizeCompany(job.company);
  const lookup = useQuery({
    queryKey: ["job-company-domain", companyKey],
    enabled:
      Boolean(token) &&
      !job.companyDomain &&
      !job.companyLogoUrl &&
      job.company.length >= 2 &&
      job.company.length <= 80,
    queryFn: async ({ signal }) => {
      const result = await getV1CompaniesSearch({ q: job.company.trim(), limit: 5 }, { signal });
      const exact = result.companies.filter(
        (company) => normalizeCompany(company.name) === companyKey,
      );
      return exact.length === 1 ? (exact[0]?.domain ?? null) : null;
    },
    staleTime: 24 * 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    retryOnMount: false,
  });
  const domain = (job.companyDomain ?? lookup.data ?? "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  const validDomain = /^[a-z\d](?:[a-z\d.-]*[a-z\d])?\.[a-z]{2,}$/.test(domain);
  const url =
    safeJobUrl(job.companyLogoUrl) ??
    (token && validDomain
      ? `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}&size=128&format=png`
      : null);
  const size = large ? 49 : 36;
  const width = hero ? 54 : size;
  const height = hero ? 54 : size;
  const inset = hero ? 7 : 3;
  return (
    <YStack
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      position="relative"
      width={width}
      height={height}
      borderRadius={hero ? 14 : size}
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
      backgroundColor={palette.panel}
      borderWidth={hero ? 0 : 1}
      borderColor={palette.hairline}
    >
      <Text fontSize={hero ? 18 : 11} fontWeight="600" color={palette.body}>
        {job.company
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
          .toUpperCase()}
      </Text>
      {url && !failed && !failedImages.has(url) ? (
        <Image
          source={{ uri: url }}
          cachePolicy="disk"
          contentFit="contain"
          onError={() => {
            failedImages.add(url);
            setFailed(true);
          }}
          style={{
            position: "absolute",
            top: inset,
            right: inset,
            bottom: inset,
            left: inset,
            borderRadius: hero ? 9 : size,
            backgroundColor: palette.panel,
          }}
        />
      ) : null}
    </YStack>
  );
}
