/**
 * Per-section edit sheets for the Profile tab (identity, about, social links).
 * Each reuses the shared editorial <SectionForm> over a small static field set
 * and saves via PATCH /v1/users/profile. Identity also embeds the geo-validated
 * <LocationPicker> so location stays a picked value (avoids INVALID_LOCATION).
 *
 * Form: React Hook Form (ADR-0005) — the resolver reuses validateSectionFields,
 * and the controlled SectionForm is bridged via watch + setValue.
 */
import type { PatchV1UsersProfileMutationRequest } from "@patch-careers/api-client";
import type { Translator } from "@patch-careers/i18n";
import { Sheet } from "@patch-careers/ui";
import { PrimaryAction } from "@patch-careers/ui/editorial";
import { type ReactElement, type ReactNode, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import { LocationPicker } from "@/features/onboarding";
import {
  type FormData,
  type SectionField,
  SectionForm,
  validateSectionFields,
} from "@/features/sections";
import { fieldErrorsResolver } from "@/forms";
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";

/** Profile fields the owner can read back from GET /v1/users/profile. */
export type EditableProfile = {
  name?: string | null;
  headline?: string | null;
  location?: string | null;
  bio?: string | null;
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
  twitter?: string | null;
};

/** Keep only non-empty trimmed values — empty URLs would fail backend patterns. */
function nonEmpty(obj: Record<string, string | undefined>): PatchV1UsersProfileMutationRequest {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && value.trim().length > 0) out[key] = value.trim();
  }
  return out as PatchV1UsersProfileMutationRequest;
}

type SheetShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: SectionField[];
  initial: FormData;
  isPending: boolean;
  onSubmit: (draft: FormData) => Promise<void>;
  children?: (draft: FormData, setDraft: (updater: (d: FormData) => FormData) => void) => ReactNode;
};

function ProfileEditSheet({
  open,
  onOpenChange,
  title,
  fields,
  initial,
  isPending,
  onSubmit,
  children,
}: SheetShellProps): ReactElement {
  const { t } = useI18n();
  const pf = usePf();
  const form = useForm<FormData>({
    defaultValues: initial,
    resolver: fieldErrorsResolver<FormData>((values) => validateSectionFields(fields, values, t)),
  });
  const draft = form.watch();

  // Seed the draft once per open (not on every `initial` identity change).
  const seeded = useRef(false);
  useEffect(() => {
    if (open && !seeded.current) {
      seeded.current = true;
      form.reset(initial);
    } else if (!open) {
      seeded.current = false;
    }
  }, [open, initial, form]);

  // Bridge the controlled SectionForm (whole-object onChange) onto RHF state.
  const setDraft = (updater: (d: FormData) => FormData): void => {
    for (const [key, value] of Object.entries(updater(form.getValues()))) {
      form.setValue(key as keyof FormData & string, value, { shouldValidate: false });
    }
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch {
      // Keep the sheet open on failure.
    }
  });

  const busy = form.formState.isSubmitting || isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <View style={pf.sheetBody}>
        <SectionForm control={form.control} fields={fields} />
        {children?.(draft, setDraft)}
        <View style={pf.sheetActions}>
          <PrimaryAction
            label={t("common.save")}
            onPress={() => void submit()}
            loading={busy}
            disabled={busy}
          />
        </View>
      </View>
    </Sheet>
  );
}

const identityFields = (t: Translator): SectionField[] => [
  { key: "name", type: "text", label: t("profile.edit.fields.name"), required: true },
  { key: "headline", type: "text", label: t("profile.edit.fields.headline"), required: false },
];
const aboutFields = (t: Translator): SectionField[] => [
  { key: "bio", type: "textarea", label: t("profile.edit.fields.bio"), required: false },
];
const linkFields = (t: Translator): SectionField[] => [
  // LinkedIn/GitHub are brand names — same in every locale.
  { key: "linkedin", type: "url", label: "LinkedIn", required: false },
  { key: "github", type: "url", label: "GitHub", required: false },
  { key: "website", type: "url", label: t("profile.edit.fields.website"), required: false },
  { key: "twitter", type: "url", label: t("profile.edit.fields.twitter"), required: false },
];

type SectionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: EditableProfile | undefined;
  isPending: boolean;
  onSubmit: (data: PatchV1UsersProfileMutationRequest) => Promise<void>;
};

export function IdentityEditSheet({
  open,
  onOpenChange,
  profile,
  isPending,
  onSubmit,
}: SectionSheetProps): ReactElement {
  const { t } = useI18n();
  const fields = useMemo(() => identityFields(t), [t]);
  const initial: FormData = {
    ...(profile?.name ? { name: profile.name } : {}),
    ...(profile?.headline ? { headline: profile.headline } : {}),
    ...(profile?.location ? { location: profile.location } : {}),
  };
  return (
    <ProfileEditSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("profile.edit.identityTitle")}
      fields={fields}
      initial={initial}
      isPending={isPending}
      onSubmit={(d) =>
        onSubmit(nonEmpty({ name: d.name, headline: d.headline, location: d.location }))
      }
    >
      {(draft, setDraft) => (
        <LocationPicker
          label={t("profile.edit.locationLabel")}
          value={draft.location ?? ""}
          onChange={(label) => setDraft((d) => ({ ...d, location: label }))}
        />
      )}
    </ProfileEditSheet>
  );
}

export function AboutEditSheet({
  open,
  onOpenChange,
  profile,
  isPending,
  onSubmit,
}: SectionSheetProps): ReactElement {
  const { t } = useI18n();
  const fields = useMemo(() => aboutFields(t), [t]);
  const initial: FormData = profile?.bio ? { bio: profile.bio } : {};
  return (
    <ProfileEditSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("profile.edit.aboutTitle")}
      fields={fields}
      initial={initial}
      isPending={isPending}
      onSubmit={(d) => onSubmit(nonEmpty({ bio: d.bio }))}
    />
  );
}

export function SocialLinksEditSheet({
  open,
  onOpenChange,
  profile,
  isPending,
  onSubmit,
}: SectionSheetProps): ReactElement {
  const { t } = useI18n();
  const fields = useMemo(() => linkFields(t), [t]);
  const initial: FormData = {
    ...(profile?.linkedin ? { linkedin: profile.linkedin } : {}),
    ...(profile?.github ? { github: profile.github } : {}),
    ...(profile?.website ? { website: profile.website } : {}),
    ...(profile?.twitter ? { twitter: profile.twitter } : {}),
  };
  return (
    <ProfileEditSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("profile.edit.linksTitle")}
      fields={fields}
      initial={initial}
      isPending={isPending}
      onSubmit={(d) =>
        onSubmit(
          nonEmpty({
            linkedin: d.linkedin,
            github: d.github,
            website: d.website,
            twitter: d.twitter,
          }),
        )
      }
    />
  );
}
