import type { Size } from '../../shared';

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'icon' | 'menu' | 'tab';
export type ButtonSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export type ButtonCase = 'upper' | 'normal';
