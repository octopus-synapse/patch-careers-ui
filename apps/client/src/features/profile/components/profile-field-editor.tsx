/**
 * <ProfileFieldEditor> — the single, descriptor-driven entry point for
 * editing one profile field. It routes by `descriptor.kind`: `location`
 * opens the geo-search picker (validated results only), everything else
 * opens the focused text/textarea/phone editor. Keeping the branch here
 * (instead of in the screen) means callers just hand over a descriptor.
 */
import type { ReactElement } from "react";
import type { ProfileFieldDescriptor } from "../lib/profile-fields";
import { FieldEditModal } from "./field-edit-modal";
import { LocationEditModal } from "./location-edit-modal";

export function ProfileFieldEditor({
  descriptor,
  initialValue,
  open,
  onClose,
  onSave,
  isPending,
}: {
  descriptor: ProfileFieldDescriptor;
  initialValue: string;
  open: boolean;
  onClose: () => void;
  onSave: (value: string) => Promise<void>;
  isPending: boolean;
}): ReactElement {
  if (descriptor.kind === "location") {
    return <LocationEditModal open={open} onClose={onClose} onSave={onSave} />;
  }
  return (
    <FieldEditModal
      descriptor={descriptor}
      initialValue={initialValue}
      open={open}
      onClose={onClose}
      onSave={onSave}
      isPending={isPending}
    />
  );
}
