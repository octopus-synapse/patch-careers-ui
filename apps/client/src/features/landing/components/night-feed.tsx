/**
 * `NightFeed` — the auto-apply night, 23:00 to 07:00 in six and a half seconds.
 *
 * When the chapter arrives the clock starts running; each job "lands" at its
 * own hour, glows to life, shows `tailoring…`, then resolves to sent or —
 * below the 80% threshold — skipped. The one that opened at 3 a.m. wears the
 * chapter's headline as a little mono tag.
 */

import { landingAccents, shadows } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { landingSans } from "../lib/landing-fonts";
import { landingSound } from "../lib/landing-sound";
import {
  AUTO_APPLY_THRESHOLD,
  NIGHT_DURATION_MS,
  NIGHT_ROWS,
  NIGHT_TOTAL_MINUTES,
} from "../model/demo-data";

type RowState = "pending" | "adapting" | "sent" | "skipped";

function clockAt(minute: number): string {
  const total = 23 * 60 + minute;
  const hour = Math.floor(total / 60) % 24;
  const min = Math.floor(total % 60);
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function NightFeed({ active }: { readonly active: boolean }): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const [minute, setMinute] = useState(0);
  const [rows, setRows] = useState<readonly RowState[]>(NIGHT_ROWS.map(() => "pending"));

  // The demo chirps as the night unfolds: `plim` per send, `tick` per skip.
  const heardRows = useRef<readonly RowState[]>(rows);
  useEffect(() => {
    rows.forEach((state, at) => {
      const before = heardRows.current[at];
      if (state === before) return;
      if (state === "sent") landingSound.play("plim");
      if (state === "skipped") landingSound.play("tick");
    });
    heardRows.current = rows;
  }, [rows]);

  useEffect(() => {
    if (!active) {
      setMinute(0);
      setRows(NIGHT_ROWS.map(() => "pending"));
      return;
    }

    let frame = 0;
    const started = Date.now();
    const tick = (): void => {
      const progress = Math.min(1, (Date.now() - started) / NIGHT_DURATION_MS);
      const now = progress * NIGHT_TOTAL_MINUTES;
      setMinute(now);
      setRows(
        NIGHT_ROWS.map((row) => {
          if (now < row.minute) return "pending";
          if (row.match < AUTO_APPLY_THRESHOLD) return "skipped";
          // A beat of "tailoring…" before it resolves to sent.
          return now - row.minute < 40 ? "adapting" : "sent";
        }),
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const done = minute >= NIGHT_TOTAL_MINUTES - 0.5;
  const sent = NIGHT_ROWS.filter((row) => row.match >= AUTO_APPLY_THRESHOLD).length;
  const skipped = NIGHT_ROWS.length - sent;
  const headline = done
    ? t("landing.night.goodMorning", { sent, skipped })
    : active
      ? t("landing.night.sleeping")
      : t("landing.night.tonight");

  return (
    <YStack
      backgroundColor={palette.panel}
      borderRadius={24}
      borderWidth={1}
      borderColor={palette.hairline}
      overflow="hidden"
      maxWidth={680}
      shadowColor={shadows.lg.mobile.shadowColor}
      shadowOpacity={shadows.lg.mobile.shadowOpacity}
      shadowRadius={shadows.lg.mobile.shadowRadius}
      shadowOffset={shadows.lg.mobile.shadowOffset}
    >
      {/* Header: the running clock. */}
      <XStack
        alignItems="center"
        gap={12}
        paddingHorizontal={20}
        paddingVertical={12}
        borderBottomWidth={1}
        borderBottomColor={palette.hairline}
      >
        <Text fontFamily={editorialFonts.mono} fontSize={16} color={palette.ink}>
          {clockAt(minute)}
        </Text>
        <Text fontFamily={landingSans} fontSize={13} color={palette.muted} flex={1}>
          {headline}
        </Text>
        <XStack gap={8} alignItems="center">
          <Text fontFamily={landingSans} fontSize={11.5} color={palette.muted}>
            {active ? t("landing.night.toggleOn") : t("landing.night.toggleOff")}
          </Text>
          <XStack
            width={40}
            height={24}
            borderRadius={999}
            backgroundColor={active ? landingAccents.indigo.accent : palette.hairline}
            padding={4}
            justifyContent={active ? "flex-end" : "flex-start"}
          >
            <YStack width={16} height={16} borderRadius={999} backgroundColor={palette.panel} />
          </XStack>
        </XStack>
      </XStack>

      {/* The night's progress. */}
      <YStack height={3} backgroundColor={palette.hairline}>
        <YStack
          height={3}
          width={`${Math.min(100, (minute / NIGHT_TOTAL_MINUTES) * 100)}%`}
          backgroundColor={landingAccents.indigo.accent}
        />
      </YStack>

      {NIGHT_ROWS.map((row, at) => {
        const state = rows[at] ?? "pending";
        const live = state !== "pending";
        const matchColor =
          row.match >= AUTO_APPLY_THRESHOLD ? landingAccents.mint.accent : palette.muted;
        return (
          <XStack
            key={row.key}
            alignItems="center"
            gap={12}
            paddingHorizontal={20}
            paddingVertical={10}
            borderTopWidth={at === 0 ? 0 : 1}
            borderTopColor={palette.hairline}
            opacity={live ? 1 : 0.38}
          >
            <Text fontFamily={editorialFonts.mono} fontSize={11} color={palette.muted} width={40}>
              {row.clock}
            </Text>
            <YStack flex={1}>
              <XStack gap={8} alignItems="baseline">
                <Text fontFamily={landingSans} fontSize={13.5} fontWeight="500" color={palette.ink}>
                  {t(`landing.night.rows.${row.key}.role`)}
                </Text>
                {row.openedAtThree ? (
                  <Text
                    fontFamily={editorialFonts.mono}
                    fontSize={10}
                    color={landingAccents.indigo.accent}
                  >
                    {t("landing.night.openedAt")}
                  </Text>
                ) : null}
              </XStack>
              <Text fontFamily={landingSans} fontSize={11.5} color={palette.muted}>
                {t(`landing.night.rows.${row.key}.company`)}
              </Text>
            </YStack>
            <Text fontFamily={editorialFonts.mono} fontSize={11.5} color={matchColor}>
              {`${row.match}%`}
            </Text>
            <YStack width={144} alignItems="flex-end">
              <RowStatus state={state} />
            </YStack>
          </XStack>
        );
      })}
    </YStack>
  );
}

function RowStatus({ state }: { readonly state: RowState }): ReactElement | null {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  if (state === "pending") {
    return (
      <Text fontFamily={landingSans} fontSize={11.5} color={palette.subtle}>
        —
      </Text>
    );
  }
  if (state === "adapting") {
    return (
      <Text fontFamily={landingSans} fontSize={11.5} color={landingAccents.indigo.accent}>
        {t("landing.night.adapting")}
      </Text>
    );
  }
  if (state === "sent") {
    return (
      <Text
        fontFamily={landingSans}
        fontSize={11.5}
        fontWeight="500"
        color={landingAccents.mint.accent}
      >
        {t("landing.night.sent")}
      </Text>
    );
  }
  return (
    <Text fontFamily={landingSans} fontSize={11.5} color={palette.muted}>
      {t("landing.night.skipped")}
    </Text>
  );
}
