import { useAppRouter } from "@/navigation/use-app-router";
/**
 * <PublicProfileCard> — the URL other people see, and a button to copy it.
 *
 * No pencil. The action here is copy; changing the handle is a different,
 * rate-limited operation that already has a screen with the rules and the
 * cooldown on it (`/settings/username`), and putting an edit affordance on the
 * URL would promise an inline edit that cannot happen.
 *
 * The confirmation is the icon becoming a check plus a line under the URL,
 * held for a beat — and it is only shown when the copy actually succeeded.
 * `navigator.clipboard` needs a secure context, so on a plain http:// dev
 * address it can fail, and a card that says "Copiado." over an empty clipboard
 * is worse than one that admits it.
 */

import { YStack } from "@patch-careers/ui";
import { PillButton } from "@patch-careers/ui/editorial";

import { ArrowRight, Check, Copy } from "lucide-react-native";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useFeedback } from "@/hooks/use-feedback";
import { copyToClipboard } from "@/lib/clipboard";
import { publicProfileDisplayUrl, publicProfileUrl } from "@/lib/public-profile-url";
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";

/** How long the "Copiado." flag stays up. Long enough to read, short enough
 *  that a second copy still reads as a second copy. */
const COPIED_MS = 1600;

export function PublicProfileCard({ username }: { username: string | null }): ReactElement {
  const { t, locale } = useI18n();
  const pf = usePf();
  const router = useAppRouter();
  const feedback = useFeedback();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async (): Promise<void> => {
    if (!username) return;
    const ok = await copyToClipboard(publicProfileUrl(username, locale));
    if (!ok) {
      feedback.warning(t("profile.publicProfile.copyFailed"));
      return;
    }
    feedback.success(t("profile.publicProfile.copied"));
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <View style={pf.railCard}>
      <View style={pf.railCardHead}>
        <Text style={pf.railCardTitle} accessibilityRole="header">
          {t("profile.publicProfile.title")}
        </Text>
        {username ? (
          <PillButton
            label={t("profile.publicProfile.copyA11y")}
            onPress={() => void copy()}
            variant="ghost"
            iconOnly
            renderIcon={({ color, size }) =>
              copied ? (
                <Check size={size} color={color} strokeWidth={2.2} />
              ) : (
                <Copy size={size} color={color} strokeWidth={1.9} />
              )
            }
          />
        ) : null}
      </View>

      {username ? (
        <>
          <Text style={pf.publicUrl} selectable>
            {publicProfileDisplayUrl(username, locale)}
          </Text>
          {copied ? <Text style={pf.publicCopied}>{t("profile.publicProfile.copied")}</Text> : null}
        </>
      ) : (
        <>
          <Text style={pf.publicHint}>{t("profile.publicProfile.noUsername")}</Text>
          <YStack marginTop={12}>
            <PillButton
              label={t("profile.publicProfile.chooseUsername")}
              onPress={() => router.push("/settings/username")}
              fullWidth
              iconPosition="end"
              renderIcon={({ color, size }) => (
                <ArrowRight size={size} color={color} strokeWidth={2} />
              )}
            />
          </YStack>
        </>
      )}
    </View>
  );
}
