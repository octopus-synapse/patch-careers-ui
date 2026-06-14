/**
 * "Currículos" sub-tab body: slots header ("2 de 4"), the resume cards
 * (master first), and the single dashed create box — disabled when the slots
 * are full. Creating derives from the master via the wizard and lands on the
 * new resume's detail screen.
 */
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ResumePreviewModal } from "@/components/resume-preview-modal";
import { useI18n } from "@/providers/i18n-provider";
import { useMasterResumeId, useResumeList, useResumeSlots } from "../hooks/queries";
import { useRz } from "../lib/styles";
import { CreateResumeWizard } from "./create-resume-wizard";
import { ResumeCard } from "./resume-card";

export function ResumeListTab(): ReactElement {
  const { t } = useI18n();
  const rz = useRz();
  const palette = useEditorialPalette();
  const router = useRouter();
  const { resumes, isLoading, isError } = useResumeList();
  const slots = useResumeSlots();
  const { resumeId: masterResumeId, language: masterLanguage } = useMasterResumeId();
  const [preview, setPreview] = useState<{ id: string; title: string } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

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
        <ResumeCard
          key={item.id}
          item={item}
          onOpen={() => router.push(`/resume/${item.id}`)}
          onPreview={() => setPreview({ id: item.id, title: item.title })}
        />
      ))}

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
    </View>
  );
}
