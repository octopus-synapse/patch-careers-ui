/**
 * Step 1 of the unified auth dialog — identifier-first: one e-mail field
 * decides between sign-in and sign-up via `POST /v1/auth/identify`, so
 * the visitor never has to know whether they have an account. Social
 * sign-in sits under an "or" divider, Airbnb-style (same chips as the
 * sign-in screen; on web they leave via full-page OAuth redirect).
 */
import { identify } from "@patch-careers/api-client";
import { Text, YStack } from "@patch-careers/ui";
import type { AuthMascotController } from "@patch-careers/ui/editorial";
import {
  editorialFonts,
  OrDivider,
  PrimaryAction,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { fieldErrorsSetter } from "@/components/auth/helpers/apply-field-errors";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useMascotForm } from "@/components/auth/hooks/use-mascot-form";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { OAuthProviderRow } from "@/components/auth/oauth-provider-row";
import { FormEmailField, useFieldErrorsForm } from "@/forms";
import { messageOf, validateEmail } from "@/lib/validation";
import { type AuthBranch, branchForIdentity } from "./branch-for-identity";

type EmailForm = { email: string };

export function EmailStep({
  mascot,
  initialEmail,
  onBranch,
}: {
  readonly mascot: AuthMascotController;
  readonly initialEmail: string;
  readonly onBranch: (branch: AuthBranch, email: string) => void;
}): ReactElement {
  const { t, locale, toast } = useAuthScreen();
  const palette = useEditorialPalette();
  const { submitting, run } = useSubmit();

  const form = useFieldErrorsForm<EmailForm>(
    (values) => {
      const email = messageOf(validateEmail(values.email.trim()), t);
      return email ? { email } : null;
    },
    { defaultValues: { email: initialEmail } },
  );
  const bind = useMascotForm(mascot, form);

  const onSubmit = form.handleSubmit(
    async ({ email }) => {
      const trimmedEmail = email.trim();
      await run(async () => {
        try {
          const signals = await identify({ email: trimmedEmail });
          mascot.celebrate({ settle: true });
          onBranch(branchForIdentity(signals), trimmedEmail);
        } catch (err) {
          mascot.grimace();
          handleAuthApiError(err, {
            locale,
            t,
            toast,
            setFieldErrors: fieldErrorsSetter(form, ["email"]),
            fallbackKey: "auth.dialogIdentifyFailed",
          });
        }
      });
    },
    () => mascot.grimace(),
  );

  return (
    <YStack gap={24} paddingVertical={22}>
      <Text
        fontFamily={editorialFonts.serif}
        fontSize={27}
        lineHeight={32}
        letterSpacing={-0.4}
        textAlign="center"
        color={palette.ink}
      >
        {t("auth.dialogTitlePre")}{" "}
        <Text
          fontFamily={editorialFonts.serif}
          fontSize={27}
          fontStyle="italic"
          color={palette.accent}
        >
          {t("auth.dialogTitleOr")}
        </Text>{" "}
        {t("auth.dialogTitlePost")}
      </Text>

      <FormEmailField
        control={form.control}
        name="email"
        testID="authDialog.email"
        onSubmitEditing={onSubmit}
        {...bind.text("email", "email")}
      />

      <PrimaryAction
        label={t("auth.dialogContinue")}
        loading={submitting}
        onPress={onSubmit}
        testID="authDialog.continue"
      />

      <YStack marginVertical={-16}>
        <OrDivider text={t("auth.orDivider")} />
      </YStack>
      <YStack marginVertical={-22}>
        <OAuthProviderRow testIDPrefix="authDialog.oauth" />
      </YStack>
    </YStack>
  );
}
