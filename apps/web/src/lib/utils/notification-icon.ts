import {
  Bell,
  Briefcase,
  Clock,
  FileText,
  Heart,
  MessageCircle,
  Repeat2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-svelte';

export type NotificationVisual = {
  icon: typeof Bell;
  colorClass: string;
};

const DEFAULT_VISUAL: NotificationVisual = {
  icon: Bell,
  colorClass: 'text-gray-500 dark:text-neutral-500',
};

const MAP: Record<string, NotificationVisual> = {
  JOB_APPLICATION_VIEWED: { icon: Briefcase, colorClass: 'text-blue-500' },
  JOB_APPLICATION_ACCEPTED: { icon: Briefcase, colorClass: 'text-emerald-500' },
  JOB_APPLICATION_REJECTED: { icon: Briefcase, colorClass: 'text-gray-500 dark:text-neutral-500' },
  JOB_INTERVIEW: { icon: Briefcase, colorClass: 'text-amber-500' },
  CONNECTION_REQUEST: { icon: UserPlus, colorClass: 'text-cyan-500' },
  CONNECTION_ACCEPTED: { icon: Users, colorClass: 'text-emerald-500' },
  FOLLOW: { icon: UserPlus, colorClass: 'text-cyan-500' },
  POST_LIKED: { icon: Heart, colorClass: 'text-rose-500' },
  POST_COMMENTED: { icon: MessageCircle, colorClass: 'text-cyan-500' },
  POST_REPOSTED: { icon: Repeat2, colorClass: 'text-emerald-500' },
  MESSAGE_RECEIVED: { icon: MessageCircle, colorClass: 'text-cyan-500' },
  // Scoring subsystem (profile-services Phase 3.E)
  FIT_PROFILE_EXPIRED: { icon: Target, colorClass: 'text-red-500' },
  FIT_PROFILE_EXPIRY_REMINDER: { icon: Clock, colorClass: 'text-amber-500' },
  MATCH_RECOMMENDATIONS_READY: { icon: Sparkles, colorClass: 'text-emerald-500' },
  RESUME_QUALITY_IMPROVED: { icon: TrendingUp, colorClass: 'text-emerald-500' },
  RESUME_QUALITY_REGRESSED: { icon: TrendingDown, colorClass: 'text-orange-500' },
  SKILL_DECAY: { icon: FileText, colorClass: 'text-gray-500' },
};

export function notificationVisual(type: string | null | undefined): NotificationVisual {
  if (!type) return DEFAULT_VISUAL;
  return MAP[type] ?? DEFAULT_VISUAL;
}
