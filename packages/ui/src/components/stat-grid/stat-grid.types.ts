import type { Component } from 'svelte';

export type StatItem = {
  label: string;
  value: number | string;
  icon?: Component<{ size: number; class?: string }>;
  href?: string;
  /** Render the value in danger red to draw attention (e.g. pending counts). */
  highlight?: boolean;
};
