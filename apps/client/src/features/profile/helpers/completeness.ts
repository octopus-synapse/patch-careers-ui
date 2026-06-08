/**
 * Profile-strength meter. A pure function over the public-facing profile fields
 * plus whether the resume has any experience / education, returning a percentage
 * and the list of still-missing pieces (each linkable to its editor).
 */
export type CompletenessField = { key: string; label: string; done: boolean };
export type Completeness = {
  pct: number;
  total: number;
  done: number;
  missing: CompletenessField[];
};

type ProfileLike = {
  photoURL?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  linkedin?: string | null;
  username?: string | null;
};

const filled = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

export function computeCompleteness(
  profile: ProfileLike | undefined,
  flags: { hasExperience: boolean; hasEducation: boolean },
): Completeness {
  const checks: CompletenessField[] = [
    { key: "photoURL", label: "Foto", done: filled(profile?.photoURL) },
    { key: "headline", label: "Título profissional", done: filled(profile?.headline) },
    { key: "bio", label: "Sobre", done: filled(profile?.bio) },
    { key: "location", label: "Localização", done: filled(profile?.location) },
    { key: "linkedin", label: "LinkedIn", done: filled(profile?.linkedin) },
    { key: "username", label: "Nome de usuário", done: filled(profile?.username) },
    { key: "experience", label: "Experiência", done: flags.hasExperience },
    { key: "education", label: "Formação", done: flags.hasEducation },
  ];
  const done = checks.filter((check) => check.done).length;
  return {
    pct: Math.round((done / checks.length) * 100),
    total: checks.length,
    done,
    missing: checks.filter((check) => !check.done),
  };
}
