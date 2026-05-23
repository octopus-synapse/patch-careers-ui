/**
 * `<ConfirmModal>` / `<DangerConfirmModal>` — confirmation dialogs.
 *
 * The danger variant flips the primary action to the `danger` intent
 * and fires a heavy haptic on press, matching the iOS HIG guideline
 * for destructive actions.
 */

import { hapticImpact } from "../internal/haptics";
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

export function ConfirmModal(props: ConfirmModalProps) {
  const {
    onOpenChange,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    onConfirm,
    onCancel,
  } = props;
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
        <Button intent="accent" onPress={onConfirm}>
          {confirmLabel}
        </Button>
      </TXStack>
    </Modal>
  );
}

export function DangerConfirmModal(props: ConfirmModalProps) {
  return (
    <Modal {...buildModalProps(props)}>
      <TXStack gap={8} justifyContent="flex-end" marginTop={12}>
        <Button
          variant="outlined"
          intent="neutral"
          onPress={() => {
            props.onCancel?.();
            props.onOpenChange(false);
          }}
        >
          {props.cancelLabel ?? "Cancelar"}
        </Button>
        <Button
          intent="danger"
          onPress={() => {
            hapticImpact("heavy");
            props.onConfirm();
          }}
        >
          {props.confirmLabel ?? "Excluir"}
        </Button>
      </TXStack>
    </Modal>
  );
}
