/**
 * Presentation mapping for notification types: which icon, which toast intent,
 * whether a foreground toast should fire, and the toast title key.
 *
 * Only "high-signal" types (new message, job match) surface a foreground toast;
 * everything else fills the inbox silently. Career types carry no actor, so the
 * inbox row falls back to `iconForType` instead of an avatar.
 */

import type { ToastIntent } from "@patch-careers/ui";
import {
  Bell,
  Briefcase,
  type LucideIcon,
  MessageCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
import type { NotificationRoutableType } from "../types";

/** Types that pop a foreground toast (decision: high-signal only). */
const TOAST_ELIGIBLE = new Set<NotificationRoutableType>([
  "MESSAGE_RECEIVED",
  "MATCH_RECOMMENDATIONS_READY",
]);

export function isToastEligible(type: NotificationRoutableType): boolean {
  return TOAST_ELIGIBLE.has(type);
}

export function iconForType(type: NotificationRoutableType): LucideIcon {
  switch (type) {
    case "MESSAGE_RECEIVED":
      return MessageCircle;
    case "MATCH_RECOMMENDATIONS_READY":
      return Briefcase;
    case "RESUME_QUALITY_IMPROVED":
      return TrendingUp;
    case "RESUME_QUALITY_REGRESSED":
      return TrendingDown;
    default:
      return Bell;
  }
}

export function intentForType(type: NotificationRoutableType): ToastIntent {
  switch (type) {
    case "RESUME_QUALITY_IMPROVED":
      return "success";
    case "RESUME_QUALITY_REGRESSED":
      return "danger";
    default:
      return "accent";
  }
}

/** i18n key (under `notifications.toast.*`) for a toast-eligible type's title. */
export function toastTitleKeyForType(type: NotificationRoutableType): string {
  switch (type) {
    case "MESSAGE_RECEIVED":
      return "notifications.toast.newMessage";
    case "MATCH_RECOMMENDATIONS_READY":
      return "notifications.toast.jobMatch";
    default:
      return "notifications.title";
  }
}
