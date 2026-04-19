/**
 * Reaction types mirror the backend Prisma `ReactionType` enum.
 * Keep UPPERCASE to match the API payload without client-side translation.
 */
export type ReactionType = 'LIKE' | 'CELEBRATE' | 'LOVE' | 'INSIGHTFUL' | 'CURIOUS';

export const REACTIONS: ReadonlyArray<{ type: ReactionType; emoji: string }> = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'CELEBRATE', emoji: '🎉' },
  { type: 'LOVE', emoji: '❤️' },
  { type: 'INSIGHTFUL', emoji: '💡' },
  { type: 'CURIOUS', emoji: '🤔' },
] as const;
