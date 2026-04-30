export type ColorScheme = 'light' | 'dark';
/** @deprecated Use `ColorScheme`. */
export type ColorSchema = ColorScheme;

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

export type IntentSlotName =
  | 'textColor'
  | 'mutedTextColor'
  | 'backgroundColor'
  | 'backgroundColorHover'
  | 'backgroundColorSubtle'
  | 'backgroundColorSoft'
  | 'textColorOnSoft'
  | 'borderColor'
  | 'borderColorFocus'
  | 'iconColor';

export type IntentKey = 'neutral' | 'accent' | 'danger' | 'success' | 'warning' | 'info';

export type IntentStyles = Partial<Record<IntentSlotName, string>>;

export type IntentTokens = {
  readonly light: IntentStyles;
  readonly dark: IntentStyles;
};

export type RequireKeys<T, K extends keyof T> = T & { [P in K]-?: T[P] };
