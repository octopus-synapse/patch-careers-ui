/**
 * Per-section edit sheets for the Profile tab (identity, about, social links).
 * Each reuses the shared editorial <SectionForm> over a small static field set
 * and saves via PATCH /v1/users/profile. Identity also embeds the geo-validated
 * <LocationPicker> so location stays a picked value (avoids INVALID_LOCATION).
 */
import type { PatchV1UsersProfileMutationRequest } from "@patch-careers/api-client";
import { Sheet } from "@patch-careers/ui";
import { PrimaryAction } from "@patch-careers/ui/editorial";
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { LocationPicker } from "@/features/onboarding/components/LocationPicker";
import {
  type FormData,
  type SectionField,
  SectionForm,
  validateSectionFields,
} from "@/features/sections";
import { pf } from "../styles";

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
  const [draft, setDraft] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  // Seed the draft once per open (not on every `initial` identity change).
  const seeded = useRef(false);
  useEffect(() => {
    if (open && !seeded.current) {
      seeded.current = true;
      setDraft(initial);
      setErrors({});
    } else if (!open) {
      seeded.current = false;
    }
  }, [open, initial]);

  const save = async (): Promise<void> => {
    const nextErrors = validateSectionFields(fields, draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    try {
      await onSubmit(draft);
      onOpenChange(false);
    } catch {
      // Keep the sheet open on failure.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <View style={pf.sheetBody}>
        <SectionForm fields={fields} data={draft} errors={errors} onChange={setDraft} />
        {children?.(draft, setDraft)}
        <View style={pf.sheetActions}>
          <PrimaryAction
            label="Salvar"
            onPress={() => void save()}
            loading={saving || isPending}
            disabled={saving || isPending}
          />
        </View>
      </View>
    </Sheet>
  );
}

const IDENTITY_FIELDS: SectionField[] = [
  { key: "name", type: "text", label: "Nome", required: true },
  { key: "headline", type: "text", label: "Título profissional", required: false },
];
const ABOUT_FIELDS: SectionField[] = [
  { key: "bio", type: "textarea", label: "Sobre você", required: false },
];
const LINK_FIELDS: SectionField[] = [
  { key: "linkedin", type: "url", label: "LinkedIn", required: false },
  { key: "github", type: "url", label: "GitHub", required: false },
  { key: "website", type: "url", label: "Website", required: false },
  { key: "twitter", type: "url", label: "Twitter / X", required: false },
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
  const initial: FormData = {
    ...(profile?.name ? { name: profile.name } : {}),
    ...(profile?.headline ? { headline: profile.headline } : {}),
    ...(profile?.location ? { location: profile.location } : {}),
  };
  return (
    <ProfileEditSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Editar perfil"
      fields={IDENTITY_FIELDS}
      initial={initial}
      isPending={isPending}
      onSubmit={(d) =>
        onSubmit(nonEmpty({ name: d.name, headline: d.headline, location: d.location }))
      }
    >
      {(draft, setDraft) => (
        <LocationPicker
          label="Localização"
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
  const initial: FormData = profile?.bio ? { bio: profile.bio } : {};
  return (
    <ProfileEditSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Sobre você"
      fields={ABOUT_FIELDS}
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
      title="Links"
      fields={LINK_FIELDS}
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
