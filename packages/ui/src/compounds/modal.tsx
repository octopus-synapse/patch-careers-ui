/**
 * `<Modal>` — centered overlay with focus trap and backdrop dismissal.
 *
 * Uses Tamagui's `Dialog` under the hood for accessibility primitives
 * (focus trap, ESC handling, `aria-modal`) without us reimplementing
 * them.
 */

import type { ReactNode } from "react";
import { TDialog, TUnspaced, TXStack } from "../internal/tamagui-shim";
import { IconButton } from "../primitives/icon-button";

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  showCloseButton?: boolean;
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  showCloseButton = true,
}: ModalProps) {
  return (
    <TDialog modal open={open} onOpenChange={onOpenChange}>
      <TDialog.Portal>
        <TDialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <TDialog.Content
          bordered
          elevate
          key="content"
          animation="medium"
          enterStyle={{ opacity: 0, scale: 0.95 }}
          exitStyle={{ opacity: 0, scale: 0.95 }}
          padding={20}
          gap={12}
        >
          {title ? <TDialog.Title>{title}</TDialog.Title> : null}
          {description ? <TDialog.Description>{description}</TDialog.Description> : null}
          {children}
          {showCloseButton ? (
            <TUnspaced>
              <TXStack position="absolute" top={8} right={8}>
                <TDialog.Close asChild>
                  <IconButton accessibilityLabel="Fechar" intent="neutral" size="sm">
                    {"×"}
                  </IconButton>
                </TDialog.Close>
              </TXStack>
            </TUnspaced>
          ) : null}
        </TDialog.Content>
      </TDialog.Portal>
    </TDialog>
  );
}
