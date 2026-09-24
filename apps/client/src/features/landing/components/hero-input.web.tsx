import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { motion } from "framer-motion";
import { type ReactElement, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { useAppRouter } from "@/navigation/use-app-router";
import { useI18n } from "@/providers/i18n-provider";
import { useLandingMotionContext } from "../hooks/use-landing-motion";
import { useLandingAccents } from "../hooks/use-landing-palettes";
import { CONTROL_SPRING } from "../lib/motion-presets";

export function HeroInput(): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const accents = useLandingAccents();
  const router = useAppRouter();
  const localized = useLocalizedHref();
  const { width } = useWindowDimensions();
  const compact = width < 640;
  const reduced = useLandingMotionContext()?.reduced ?? true;
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  return (
    <motion.form
      onSubmit={(event) => {
        event.preventDefault();
        router.push(localized("/(auth)/auth"));
      }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      animate={{
        borderColor: focused ? accents.indigo.accent : palette.hairline,
        boxShadow: focused ? `0 0 0 3px ${accents.indigo.soft}` : `0 3px 12px ${palette.hairline}`,
      }}
      transition={{ duration: reduced ? 0 : 0.25 }}
      style={{
        display: "flex",
        flexDirection: compact ? "column" : "row",
        gap: 8,
        padding: 7,
        maxWidth: 576,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: "solid",
        background: palette.panel,
      }}
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={t("landing.chapters.hero.inputPlaceholder")}
        placeholder={t("landing.chapters.hero.inputPlaceholder")}
        style={{
          flex: 1,
          minWidth: 0,
          width: compact ? "100%" : undefined,
          padding: "13px 14px",
          border: 0,
          outline: "none",
          boxSizing: "border-box",
          background: "transparent",
          color: palette.ink,
          fontFamily: editorialFonts.sans,
          fontSize: 14,
        }}
      />
      <motion.button
        type="submit"
        initial="rest"
        whileHover="hover"
        whileFocus="hover"
        whileTap={{ scale: reduced ? 1 : 0.98 }}
        variants={{ rest: { y: 0 }, hover: { y: reduced ? 0 : -1 } }}
        transition={CONTROL_SPRING}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          border: 0,
          borderRadius: 14,
          padding: "15px 20px",
          cursor: "pointer",
          background: palette.primary,
          color: palette.onPrimary,
          fontFamily: editorialFonts.sans,
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {t("landing.chapters.hero.cta")}
        <motion.span
          aria-hidden="true"
          variants={{ rest: { x: 0 }, hover: { x: reduced ? 0 : 3 } }}
          transition={CONTROL_SPRING}
        >
          →
        </motion.span>
      </motion.button>
    </motion.form>
  );
}
