/**
 * Resume detail — pushed over the tabs from the Currículos sub-tab. Embedded
 * live preview, metadata, the action row (rename / download PDF / duplicate /
 * delete — the master can never be deleted), and FULL editing via the same
 * ResumeSectionsManager the Perfil sub-tab uses.
 */
import { useGetV1ExportResumePdf } from "@patch-careers/api-client";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ChevronLeft, Copy, Download, Pencil, Trash2 } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ResumePreview } from "@/components/resume-preview";
import { ResumeSectionsManager } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import { useMasterResumeId, useResumeDetail, useResumeMutations } from "../hooks/queries";
import { editedAgo, resumeLanguageToLocale } from "../lib/helpers";
import { useRz } from "../lib/styles";
import { CreateResumeWizard } from "./create-resume-wizard";
import { RenameSheet } from "./rename-sheet";

function ActionPill({
  label,
  icon: Icon,
  onPress,
  danger = false,
}: {
  label: string;
  icon: typeof Pencil;
  onPress: () => void;
  danger?: boolean;
}): ReactElement {
  const rz = useRz();
  const palette = useEditorialPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[rz.actionPill, danger && rz.actionDanger]}
    >
      <Icon size={15} color={danger ? palette.danger : palette.ink} strokeWidth={1.75} />
      <Text style={[rz.actionLabel, danger && rz.actionDangerLabel]}>{label}</Text>
    </Pressable>
  );
}

export function ResumeDetailScreen({ id }: { id: string }): ReactElement {
  const { t, locale } = useI18n();
  const rz = useRz();
  const palette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const detail = useResumeDetail(id);
  const { resumeId: masterResumeId } = useMasterResumeId();
  const { renameResume, deleteResume, isPending } = useResumeMutations();
  const pdf = useGetV1ExportResumePdf({ resumeId: id }, { query: { enabled: false } });

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const resume = detail.data;
  // The detail payload carries no isPrimary — the list query (already cached)
  // identifies the master, which can never be deleted.
  const isMaster = masterResumeId === id;
  const back = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/profile");
  };

  const downloadPdf = async (): Promise<void> => {
    const result = await pdf.refetch();
    const url = result.data?.downloadUrl;
    if (!url) return;
    if (Platform.OS === "web") window.open(url, "_blank");
    else await WebBrowser.openBrowserAsync(url);
  };

  const confirmDelete = async (): Promise<void> => {
    await deleteResume(id);
    setDeleteOpen(false);
    back();
  };

  if (detail.isLoading) {
    return (
      <View style={[rz.detailRoot, rz.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={palette.ink} />
      </View>
    );
  }

  if (detail.isError || !resume) {
    return (
      <View style={[rz.detailRoot, rz.centered, { paddingTop: insets.top }]}>
        <Text style={rz.centeredText}>{t("resumes.detail.notFound")}</Text>
        <ActionPill label={t("resumes.detail.back")} icon={ChevronLeft} onPress={back} />
      </View>
    );
  }

  return (
    <View style={[rz.detailRoot, { paddingTop: insets.top }]}>
      <View style={rz.detailHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("resumes.detail.back")}
          hitSlop={12}
          onPress={back}
        >
          <ChevronLeft size={24} color={palette.ink} strokeWidth={1.75} />
        </Pressable>
        <Text style={rz.detailTitle} numberOfLines={1}>
          {resume.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={rz.detailScroll} showsVerticalScrollIndicator={false}>
        {/* Live preview of THIS resume */}
        <View style={rz.previewFrame}>
          <ResumePreview resumeId={id} />
        </View>

        {/* Metadata */}
        <View style={rz.metaBlock}>
          <View style={rz.metaRow}>
            <Text style={rz.metaLabel}>{t("resumes.detail.language")}</Text>
            <Text style={rz.metaValue}>{resume.language?.toUpperCase() ?? "—"}</Text>
          </View>
          <View style={rz.metaRow}>
            <Text style={rz.metaLabel}>{t("resumes.detail.style")}</Text>
            <Text style={rz.metaValue}>{resume.style?.name ?? "—"}</Text>
          </View>
          <View style={rz.metaRow}>
            <Text style={rz.metaLabel}>{t("resumes.detail.lastEdited")}</Text>
            <Text style={rz.metaValue}>{editedAgo(resume.updatedAt, t, locale)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={rz.actions}>
          <ActionPill
            label={t("resumes.detail.rename")}
            icon={Pencil}
            onPress={() => setRenameOpen(true)}
          />
          <ActionPill
            label={t("resumes.detail.downloadPdf")}
            icon={Download}
            onPress={() => void downloadPdf()}
          />
          <ActionPill
            label={t("resumes.detail.duplicate")}
            icon={Copy}
            onPress={() => setDuplicateOpen(true)}
          />
          {!isMaster ? (
            <ActionPill
              label={t("resumes.detail.delete")}
              icon={Trash2}
              danger
              onPress={() => setDeleteOpen(true)}
            />
          ) : null}
        </View>

        {/* Full section editing — the exact same manager as the Perfil sub-tab */}
        <View>
          <Text style={rz.sectionLabel}>{t("resumes.detail.sections")}</Text>
        </View>
        <ResumeSectionsManager resumeId={id} locale={resumeLanguageToLocale(resume.language)} />
      </ScrollView>

      <RenameSheet
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentTitle={resume.title}
        isPending={isPending}
        onSubmit={(title) => renameResume(id, title)}
      />

      <CreateResumeWizard
        visible={duplicateOpen}
        sourceResumeId={id}
        sourceLanguage={resume.language}
        onClose={() => setDuplicateOpen(false)}
        onCreated={(newId) => {
          setDuplicateOpen(false);
          router.push(`/resume/${newId}`);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("resumes.detail.deleteTitle")}
        description={t("resumes.detail.deleteMessage", { title: resume.title })}
        danger
        icon={Trash2}
        onConfirm={() => void confirmDelete()}
      />
    </View>
  );
}
