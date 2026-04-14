import type { ParamMatcher } from '@sveltejs/kit';
import { isLocale } from 'i18n';

export const match: ParamMatcher = (param) => isLocale(param);
