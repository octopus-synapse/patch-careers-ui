/**
 * The row of small brand-coloured provider chips above the credentials
 * fields — identical on sign-in and sign-up. Each chip keeps its provider's
 * own fixed colours (a brand mark that restyled itself with the scheme would
 * stop reading as that brand) and enters with a short stagger.
 */
import { XStack } from "@patch-careers/ui";
import type { ReactElement } from "react";
import { useOAuthSignIn } from "@/components/auth/hooks/use-oauth-sign-in";
import { type BrandProvider, OAuthBrandButton } from "@/components/auth/oauth-brand-button";
import { GithubGlyph, GoogleGlyph, LinkedinGlyph } from "@/components/auth/oauth-glyphs";
import { useTranslator } from "@/providers/i18n-provider";

const PROVIDERS: ReadonlyArray<{
  provider: BrandProvider;
  name: string;
  glyph: typeof GoogleGlyph;
  delay: number;
}> = [
  { provider: "google", name: "Google", glyph: GoogleGlyph, delay: 180 },
  { provider: "linkedin", name: "LinkedIn", glyph: LinkedinGlyph, delay: 240 },
  { provider: "github", name: "GitHub", glyph: GithubGlyph, delay: 300 },
];

export function OAuthProviderRow({ testIDPrefix }: { testIDPrefix: string }): ReactElement {
  const t = useTranslator();
  const { handleOAuth } = useOAuthSignIn();
  return (
    <XStack justifyContent="center" gap={12} marginTop={22} marginBottom={30}>
      {PROVIDERS.map(({ provider, name, glyph, delay }) => (
        <OAuthBrandButton
          key={provider}
          provider={provider}
          glyph={glyph}
          delay={delay}
          label={t("auth.continueWith", { provider: name })}
          onPress={() => handleOAuth(provider)}
          testID={`${testIDPrefix}.${provider}`}
        />
      ))}
    </XStack>
  );
}
