<script lang="ts">
type Shape = 'text' | 'avatar' | 'rect' | 'circle';

type Props = {
  shape?: Shape;
  width?: string;
  height?: string;
  class?: string;
};

let { shape = 'rect', width, height, class: className = '' }: Props = $props();

const shapeClasses: Record<Shape, string> = {
  text: 'h-4 rounded',
  avatar: 'rounded-full',
  rect: 'rounded-md',
  circle: 'rounded-full',
};

const defaultSize: Record<Shape, { width?: string; height?: string }> = {
  text: { width: '100%' },
  avatar: { width: '2.5rem', height: '2.5rem' },
  rect: {},
  circle: { width: '2rem', height: '2rem' },
};

const finalWidth = $derived(width ?? defaultSize[shape].width);
const finalHeight = $derived(height ?? defaultSize[shape].height);

const style = $derived(
  [finalWidth ? `width: ${finalWidth}` : '', finalHeight ? `height: ${finalHeight}` : '']
    .filter(Boolean)
    .join('; '),
);
</script>

<div
	class="animate-pulse bg-gray-200 dark:bg-neutral-700 {shapeClasses[shape]} {className}"
	{style}
	aria-hidden="true"
></div>
