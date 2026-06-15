/**
 * "Currículos" sub-tab body: slots header ("2 de 4"), the resume cards
 * (master first), and the single dashed create box — disabled when the slots
 * are full. Creating derives from the master via the wizard and lands on the
 * new resume's detail screen.
 */
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ResumePreviewModal } from "@/components/resume-preview-modal";
import { useI18n } from "@/providers/i18n-provider";
import {
  type ResumeListItem,
  useMasterResumeId,
  useResumeList,
  useResumeMutations,
  useResumeSlots,
} from "../hooks/queries";
import { useRz } from "../lib/styles";
import { CreateResumeWizard } from "./create-resume-wizard";
import { SwipeableResumeCard } from "./swipeable-resume-card";

export function ResumeListTab(): ReactElement {
  const { t } = useI18n();
  const rz = useRz();
  const palette = useEditorialPalette();
  const router = useRouter();
  const { resumes, isLoading, isError } = useResumeList();
  const slots = useResumeSlots();
  const { resumeId: masterResumeId, language: masterLanguage } = useMasterResumeId();
  const { duplicateResume, deleteResume, isPending } = useResumeMutations();
  const [preview, setPreview] = useState<{ id: string; title: string } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ResumeListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDuplicate = async (item: ResumeListItem): Promise<void> => {
    if (isPending) return;
    setActionError(null);
    // Title caps at 100 chars server-side; trim the source so the suffix fits.
    const copyTitle = t("resumes.card.copySuffix", { title: item.title.slice(0, 90) });
    try {
      await duplicateResume(item.id, { title: copyTitle });
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setActionError(t("resumes.list.duplicateError"));
    }
  };

  const confirmDelete = async (): Promise<void> => {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);
    setActionError(null);
    try {
      await deleteResume(target.id);
    } catch {
      setActionError(t("resumes.list.deleteError"));
    }
  };

  if (isLoading) {
    return (
      <View style={rz.centered}>
        <ActivityIndicator color={palette.ink} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={rz.centered}>
        <Text style={rz.centeredText}>{t("resumes.list.loadError")}</Text>
      </View>
    );
  }

  const full = slots.remaining <= 0;

  return (
    <View style={rz.list}>
      <View style={rz.slotsRow}>
        <Text style={rz.slotsLabel}>{t("resumes.list.header")}</Text>
        <Text style={rz.slotsCount}>
          {t("resumes.list.slotsCount", { used: slots.used, limit: slots.limit })}
        </Text>
      </View>

      {resumes.map((item) => (
        <SwipeableResumeCard
          key={item.id}
          item={item}
          onOpen={() => router.push(`/resume/${item.id}`)}
          onPreview={() => setPreview({ id: item.id, title: item.title })}
          onDuplicate={() => void handleDuplicate(item)}
          onDelete={item.isPrimary ? undefined : () => setPendingDelete(item)}
          canDuplicate={!full}
        />
      ))}

      {actionError ? <Text style={rz.slotsNote}>{actionError}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("resumes.list.create")}
        accessibilityState={{ disabled: full }}
        disabled={full}
        onPress={() => setWizardOpen(true)}
        style={[rz.createBox, full && rz.createBoxDisabled]}
      >
        <Plus size={15} color={palette.ink} strokeWidth={2} />
        <Text style={rz.createBoxLabel}>{t("resumes.list.create")}</Text>
      </Pressable>
      {full ? (
        <Text style={rz.slotsNote}>{t("resumes.list.limitReached", { limit: slots.limit })}</Text>
      ) : null}

      <ResumePreviewModal
        visible={preview !== null}
        onClose={() => setPreview(null)}
        resumeId={preview?.id}
        title={preview?.title}
      />

      <CreateResumeWizard
        visible={wizardOpen}
        sourceResumeId={masterResumeId}
        sourceLanguage={masterLanguage}
        onClose={() => setWizardOpen(false)}
        onCreated={(id) => {
          setWizardOpen(false);
          router.push(`/resume/${id}`);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={t("resumes.detail.deleteTitle")}
        description={
          pendingDelete
            ? t("resumes.detail.deleteMessage", { title: pendingDelete.title })
            : undefined
        }
        danger
        icon={Trash2}
        confirmLabel={t("resumes.detail.delete")}
        onConfirm={() => void confirmDelete()}
      />
    </View>
  );
}
