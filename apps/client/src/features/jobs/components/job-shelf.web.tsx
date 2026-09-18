import { Text, useEditorialPalette, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts } from "@patch-careers/ui/editorial";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react-native";
import { type ReactElement, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export function JobShelf({
  title,
  id,
  children,
  onSeeAll,
}: {
  title: string;
  id: string;
  children: ReactElement[];
  onSeeAll: () => void;
}) {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: children.length <= 4 });
  const update = useCallback(() => {
    const node = track.current;
    if (node)
      setEdges({
        start: node.scrollLeft <= 3,
        end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 3,
      });
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Added or removed cards change scroll bounds even when the viewport does not resize.
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    update();
    return () => observer.disconnect();
  }, [children.length, update]);
  const move = (direction: number) => {
    const node = track.current;
    node?.scrollBy({
      left: direction * (node.clientWidth + 20),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  return (
    <YStack gap={17}>
      <XStack justifyContent="space-between" alignItems="center" gap={20}>
        <Text
          id={`heading-${id}`}
          accessibilityRole="header"
          fontFamily={editorialFonts.serif}
          fontSize={22}
          lineHeight={29}
          fontWeight="400"
          color={palette.ink}
        >
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("jobs.home.seeAllA11y", { section: title })}
          onPress={onSeeAll}
        >
          <XStack alignItems="center" gap={6} padding={6}>
            <Text fontSize={11} color={palette.body}>
              {t("jobs.desktop.seeAll")}
            </Text>
            <ArrowRight size={13} color={palette.body} />
          </XStack>
        </Pressable>
      </XStack>
      <YStack position="relative">
        <section
          ref={track}
          id={`carousel-${id}`}
          aria-labelledby={`heading-${id}`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: The scroll region supports ArrowLeft/Right and Home/End for keyboard navigation.
          tabIndex={0}
          onScroll={update}
          onKeyDown={(event) => {
            if (
              event.target !== event.currentTarget ||
              !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
            )
              return;
            event.preventDefault();
            if (event.key === "Home" || event.key === "End")
              track.current?.scrollTo({
                left: event.key === "Home" ? 0 : track.current.scrollWidth,
              });
            else move(event.key === "ArrowLeft" ? -1 : 1);
          }}
          // @style-allow inline: native CSS grid and scroll snapping preserve four measurable columns in the desktop carousel.
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "calc((100% - 60px) / 4)",
            gap: 20,
            overflowX: "auto",
            scrollbarWidth: "none",
            scrollSnapType: "x mandatory",
            padding: 2,
            margin: -2,
          }}
        >
          {children.map((child) => (
            <YStack
              key={child.key}
              minWidth={0}
              // @style-allow inline: scrollSnapAlign is a web-only CSS property on the carousel item.
              style={{ scrollSnapAlign: "start" }}
            >
              {child}
            </YStack>
          ))}
        </section>
        {([-1, 1] as const).map((direction) => (
          <YStack
            key={direction}
            position="absolute"
            top="50%"
            marginTop={-15}
            left={direction === -1 ? -36 : undefined}
            right={direction === 1 ? -36 : undefined}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(
                direction === -1 ? "jobs.desktop.previous" : "jobs.desktop.next",
                { section: title },
              )}
              disabled={direction === -1 ? edges.start : edges.end}
              accessibilityState={{ disabled: direction === -1 ? edges.start : edges.end }}
              onPress={() => move(direction)}
            >
              <YStack
                width={29}
                height={29}
                borderRadius={29}
                borderWidth={1}
                borderColor={palette.hairlineStrong}
                alignItems="center"
                justifyContent="center"
                opacity={(direction === -1 ? edges.start : edges.end) ? 0.3 : 1}
                hoverStyle={{ backgroundColor: palette.panel }}
              >
                {direction === -1 ? (
                  <ChevronLeft size={13} color={palette.ink} />
                ) : (
                  <ChevronRight size={13} color={palette.ink} />
                )}
              </YStack>
            </Pressable>
          </YStack>
        ))}
      </YStack>
    </YStack>
  );
}

export function JobGrid({ children }: { children: ReactNode }) {
  // @style-allow inline: CSS grid keeps incomplete rows aligned to the same four desktop columns.
  return (
    <div
      // @style-allow inline: CSS grid keeps four columns aligned across desktop rows.
      style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 20 }}
    >
      {children}
    </div>
  );
}

export function JobsEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const palette = useEditorialPalette();
  return (
    <YStack
      padding={34}
      minHeight={140}
      alignItems="center"
      justifyContent="center"
      gap={10}
      borderWidth={1}
      borderStyle="dashed"
      borderColor={palette.hairlineStrong}
      borderRadius={20}
      backgroundColor={palette.surface}
    >
      <Text fontSize={14} color={palette.ink} textAlign="center">
        {title}
      </Text>
      {description ? (
        <Text fontSize={12} lineHeight={20} color={palette.muted} textAlign="center" maxWidth={480}>
          {description}
        </Text>
      ) : null}
      {action}
    </YStack>
  );
}
