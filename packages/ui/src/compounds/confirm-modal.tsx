/**
 * `<ConfirmModal>` / `<DangerConfirmModal>` — confirmation dialogs.
 *
 * Both render the same shell + footer (cancel + confirm); the danger
 * variant flips the confirm to the `danger` intent, swaps the default
 * label, and fires a heavy haptic on press (iOS HIG for destructive
 * actions). They share one `ConfirmModalBase`.
 */

import { withHaptic } from "../internal/haptics";
import { TXStack } from "../internal/tamagui-shim";
import { Button } from "../primitives/button";
import { Modal } from "./modal";

export type ConfirmModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

function buildModalProps(props: ConfirmModalProps) {
  const base = {
    open: props.open,
    onOpenChange: props.onOpenChange,
    title: props.title,
    showCloseButton: false,
  };
  return props.description === undefined ? base : { ...base, description: props.description };
}

function ConfirmModalBase({ danger, props }: { danger: boolean; props: ConfirmModalProps }) {
  const {
    onOpenChange,
    onConfirm,
    onCancel,
    confirmLabel = danger ? "Excluir" : "Confirmar",
    cancelLabel = "Cancelar",
  } = props;
  const handleConfirm = danger ? withHaptic("heavy", onConfirm) : onConfirm;
  return (
    <Modal {...buildModalProps(props)}>
      <TXStack gap={8} justifyContent="flex-end" marginTop={12}>
        <Button
          variant="outlined"
          intent="neutral"
          onPress={() => {
            onCancel?.();
            onOpenChange(false);
          }}
        >
          {cancelLabel}
        </Button>
        <Button intent={danger ? "danger" : "accent"} onPress={handleConfirm}>
          {confirmLabel}
        </Button>
      </TXStack>
    </Modal>
  );
}

export function ConfirmModal(props: ConfirmModalProps) {
  return <ConfirmModalBase danger={false} props={props} />;
}

export function DangerConfirmModal(props: ConfirmModalProps) {
  return <ConfirmModalBase danger props={props} />;
}
