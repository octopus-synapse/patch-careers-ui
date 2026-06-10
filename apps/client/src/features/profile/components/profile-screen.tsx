/**
 * Profile tab — the owner's view of their public profile (what recruiters see),
 * with per-section edit affordances. Header (avatar/name/headline/location),
 * completeness meter, share link, about, social links, editable experience /
 * education (reusing the onboarding section editor), and a CV preview button.
 */
import { Avatar } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import * as ImagePicker from "expo-image-picker";
import {
  AtSign,
  Briefcase,
  Camera,
  Code2,
  FileText,
  Globe,
  type LucideIcon,
  MapPin,
  Pencil,
  Share2,
} from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SectionItemEditor, type SectionPersistAction } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import {
  type ProfileSection,
  useMasterResumeId,
  useProfile,
  useProfileMutations,
  useProfileSections,
  useSectionItemMutations,
} from "../hooks/queries";
import { type CompletenessField, computeCompleteness } from "../lib/completeness";
import { buildPublicUrl, shareProfile } from "../lib/public-link";
import { usePf } from "../lib/styles";
import { CvModal } from "./cv-modal";
import { AboutEditSheet, IdentityEditSheet, SocialLinksEditSheet } from "./edit-sheets";

type SheetKind = "identity" | "about" | "links";

const SOCIAL_LINKS: ReadonlyArray<{
  key: "linkedin" | "github" | "website" | "twitter";
  label: string;
  icon: LucideIcon;
}> = [
  { key: "linkedin", label: "LinkedIn", icon: Briefcase },
  { key: "github", label: "GitHub", icon: Code2 },
  { key: "website", label: "Website", icon: Globe },
  { key: "twitter", label: "Twitter / X", icon: AtSign },
];

export function ProfileScreen(): ReactElement {
  const palette = useEditorialPalette();
  const pf = usePf();
  const { t } = useI18n();
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const { resumeId } = useMasterResumeId();
  const sections = useProfileSections(resumeId);
  const { persistFor, isPending: sectionsPending } = useSectionItemMutations(resumeId);
  const { updateProfile, updatePhoto, isPending: profilePending } = useProfileMutations();
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [cvOpen, setCvOpen] = useState(false);

  const completeness = computeCompleteness(profile, {
    hasExperience: sections.experience.items.length > 0,
    hasEducation: sections.education.items.length > 0,
  });

  const onChangePhoto = async (): Promise<void> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    try {
      await updatePhoto({
        uri: asset.uri,
        name: asset.fileName ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
      });
    } catch {
      // Surfaced via the mutation; header keeps the prior photo.
    }
  };

  /** Map a missing-completeness field to the editor that fills it (if any). */
  const fixFor = (key: string): (() => void) | undefined => {
    if (key === "photoURL") return () => void onChangePhoto();
    if (key === "headline" || key === "location") return () => setSheet("identity");
    if (key === "bio") return () => setSheet("about");
    if (key === "linkedin") return () => setSheet("links");
    return undefined;
  };

  if (profileQuery.isLoading) {
    return (
      <View style={[pf.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={palette.ink} />
      </View>
    );
  }

  const name = profile?.name ?? "Você";
  const username = profile?.username ?? null;

  return (
    <View style={pf.root}>
      <ScrollView contentContainerStyle={pf.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={pf.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Trocar foto de perfil"
            onPress={() => void onChangePhoto()}
            style={pf.avatarWrap}
          >
            <Avatar src={profile?.photoURL ?? undefined} name={name} size="xl" />
            <View style={pf.avatarBadge}>
              <Camera size={15} color={palette.onPrimary} strokeWidth={2} />
            </View>
          </Pressable>
          <Text style={pf.name}>{name}</Text>
          {profile?.headline ? (
            <Text style={pf.headline}>{profile.headline}</Text>
          ) : (
            <Text style={[pf.headline, pf.headlinePlaceholder]}>
              Adicione um título profissional
            </Text>
          )}
          {profile?.location ? (
            <View style={pf.locationRow}>
              <MapPin size={13} color={palette.subtle} strokeWidth={1.75} />
              <Text style={pf.location}>{profile.location}</Text>
            </View>
          ) : null}
        </View>

        {/* Completeness */}
        {completeness.pct < 100 ? (
          <View style={pf.completeCard}>
            <View style={pf.completeHead}>
              <Text style={pf.completeTitle}>Complete seu perfil</Text>
              <Text style={pf.completePct}>{completeness.pct}%</Text>
            </View>
            <View style={pf.completeTrack}>
              <View style={[pf.completeFill, { width: `${completeness.pct}%` }]} />
            </View>
            <View style={pf.chips}>
              {completeness.missing.map((field) => (
                <CompletenessChip key={field.key} field={field} onPress={fixFor(field.key)} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Share public link */}
        {username ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartilhar link do perfil"
            onPress={() => void shareProfile(username)}
            style={pf.shareRow}
          >
            <View style={pf.shareBody}>
              <Text style={pf.shareLabel}>Seu perfil público</Text>
              <Text style={pf.shareUrl} numberOfLines={1}>
                {buildPublicUrl(username).replace(/^https?:\/\//, "")}
              </Text>
            </View>
            <Share2 size={18} color={palette.accent} strokeWidth={1.75} />
          </Pressable>
        ) : null}

        {/* About */}
        <SectionFrame label="Sobre" onEdit={() => setSheet("about")}>
          {profile?.bio ? (
            <Text style={pf.bodyText}>{profile.bio}</Text>
          ) : (
            <Text style={pf.placeholder}>Conte um pouco sobre você e sua trajetória.</Text>
          )}
        </SectionFrame>

        {/* Social links */}
        <SectionFrame label="Links" onEdit={() => setSheet("links")}>
          <SocialLinks profile={profile} />
        </SectionFrame>

        {/* Experience */}
        <SectionBlock
          label="Experiência"
          section={sections.experience}
          hasResume={Boolean(resumeId)}
          isPending={sectionsPending}
          onPersist={persistFor(sections.experience.sectionTypeKey)}
          t={t}
        />

        {/* Education */}
        <SectionBlock
          label="Formação"
          section={sections.education}
          hasResume={Boolean(resumeId)}
          isPending={sectionsPending}
          onPersist={persistFor(sections.education.sectionTypeKey)}
          t={t}
        />

        {/* CV */}
        {resumeId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver currículo"
            onPress={() => setCvOpen(true)}
            style={pf.cvButton}
          >
            <FileText size={18} color={palette.ink} strokeWidth={1.75} />
            <Text style={pf.cvButtonLabel}>Ver currículo (CV)</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <CvModal visible={cvOpen} onClose={() => setCvOpen(false)} />
      <IdentityEditSheet
        open={sheet === "identity"}
        onOpenChange={(open) => setSheet(open ? "identity" : null)}
        profile={profile}
        isPending={profilePending}
        onSubmit={updateProfile}
      />
      <AboutEditSheet
        open={sheet === "about"}
        onOpenChange={(open) => setSheet(open ? "about" : null)}
        profile={profile}
        isPending={profilePending}
        onSubmit={updateProfile}
      />
      <SocialLinksEditSheet
        open={sheet === "links"}
        onOpenChange={(open) => setSheet(open ? "links" : null)}
        profile={profile}
        isPending={profilePending}
        onSubmit={updateProfile}
      />
    </View>
  );
}

function CompletenessChip({
  field,
  onPress,
}: {
  field: CompletenessField;
  onPress?: (() => void) | undefined;
}): ReactElement {
  const palette = useEditorialPalette();
  const pf = usePf();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : "text"}
      disabled={!onPress}
      onPress={onPress}
      style={pf.chip}
    >
      <Pencil size={12} color={palette.muted} strokeWidth={1.75} />
      <Text style={pf.chipText}>{field.label}</Text>
    </Pressable>
  );
}

function SectionFrame({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit?: () => void;
  children: ReactElement;
}): ReactElement {
  const pf = usePf();
  return (
    <View style={pf.section}>
      <View style={pf.sectionHead}>
        <Text style={pf.sectionLabel}>{label}</Text>
        {onEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar ${label}`}
            onPress={onEdit}
          >
            <Text style={pf.editLink}>Editar</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function SocialLinks({
  profile,
}: {
  profile:
    | {
        linkedin?: string | null;
        github?: string | null;
        website?: string | null;
        twitter?: string | null;
      }
    | undefined;
}): ReactElement {
  const palette = useEditorialPalette();
  const pf = usePf();
  const rows = SOCIAL_LINKS.map((link) => ({ ...link, value: profile?.[link.key] ?? "" })).filter(
    (row) => row.value.length > 0,
  );
  if (rows.length === 0) {
    return <Text style={pf.placeholder}>Adicione seus links (LinkedIn, GitHub, site…).</Text>;
  }
  return (
    <View>
      {rows.map(({ key, label, icon: Icon, value }) => (
        <Pressable
          key={key}
          accessibilityRole="link"
          accessibilityLabel={label}
          onPress={() => void Linking.openURL(value)}
          style={pf.linkRow}
        >
          <View style={pf.linkIcon}>
            <Icon size={17} color={palette.ink} strokeWidth={1.75} />
          </View>
          <Text style={pf.linkLabel}>{label}</Text>
          <Text style={pf.linkValue} numberOfLines={1}>
            {value.replace(/^https?:\/\/(www\.)?/, "")}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function SectionBlock({
  hasResume,
  isPending,
  label,
  onPersist,
  section,
  t,
}: {
  hasResume: boolean;
  isPending: boolean;
  label: string;
  onPersist: (action: SectionPersistAction) => Promise<void>;
  section: ProfileSection;
  t: (key: string) => string;
}): ReactElement {
  const pf = usePf();
  return (
    <View style={pf.section}>
      <Text style={pf.sectionLabel}>{label}</Text>
      {hasResume ? (
        <SectionItemEditor
          step={section.descriptor}
          items={section.items}
          onPersistItem={onPersist}
          isPending={isPending}
          t={t}
        />
      ) : (
        <Text style={pf.noResume}>Conclua o onboarding para adicionar {label.toLowerCase()}.</Text>
      )}
    </View>
  );
}
