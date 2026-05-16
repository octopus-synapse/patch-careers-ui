<script lang="ts">
import { init, type EChartsOption } from 'echarts';
import { onMount } from 'svelte';
import { Chart } from 'svelte-echarts';

let isDark = $state(false);

onMount(() => {
  const root = document.documentElement;
  const sync = () => {
    isDark = root.classList.contains('dark');
  };
  sync();
  const obs = new MutationObserver(sync);
  obs.observe(root, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
});

const axisColor = $derived(isDark ? '#a3a3a3' : '#525252');
const axisLine = $derived(isDark ? '#404040' : '#e5e7eb');
const labelColor = $derived(isDark ? '#e5e5e5' : '#111827');

const funnelOptions = $derived<EChartsOption>({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: '{b}: <b>{c}</b>',
  },
  series: [
    {
      name: 'Pipeline',
      type: 'funnel',
      left: '4%',
      right: '4%',
      top: 10,
      bottom: 10,
      width: '92%',
      min: 0,
      max: 30,
      minSize: '20%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside',
        color: '#ffffff',
        fontWeight: 600,
        fontSize: 13,
        formatter: '{b} · {c}',
      },
      labelLine: { show: false },
      itemStyle: {
        borderColor: isDark ? '#0a0a0a' : '#ffffff',
        borderWidth: 2,
      },
      emphasis: {
        label: { fontSize: 14 },
      },
      data: [
        { value: 23, name: 'Submitted', itemStyle: { color: '#0ea5e9' } },
        { value: 14, name: 'Under Review', itemStyle: { color: '#06b6d4' } },
        { value: 9, name: 'Assessment', itemStyle: { color: '#f59e0b' } },
        { value: 5, name: 'Interview', itemStyle: { color: '#f97316' } },
        { value: 4, name: 'Offer', itemStyle: { color: '#a855f7' } },
        { value: 1, name: 'Hired', itemStyle: { color: '#10b981' } },
      ],
    },
  ],
});

const donutOptions = $derived<EChartsOption>({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: '{b}: <b>{c}</b> ({d}%)',
  },
  legend: {
    bottom: 0,
    left: 'center',
    textStyle: { color: axisColor, fontSize: 11 },
    itemWidth: 10,
    itemHeight: 10,
    icon: 'circle',
  },
  series: [
    {
      name: 'Final Outcome',
      type: 'pie',
      radius: ['55%', '78%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: isDark ? '#171717' : '#ffffff',
        borderWidth: 3,
        borderRadius: 4,
      },
      label: {
        show: true,
        position: 'center',
        formatter: () => `{a|12}\n{b|Outcomes}`,
        rich: {
          a: { fontSize: 28, fontWeight: 700, color: labelColor },
          b: {
            fontSize: 11,
            color: axisColor,
            padding: [4, 0, 0, 0],
            fontWeight: 500,
          },
        },
      },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 600 },
      },
      labelLine: { show: false },
      data: [
        { value: 1, name: 'Hired', itemStyle: { color: '#10b981' } },
        { value: 5, name: 'Rejected', itemStyle: { color: '#ef4444' } },
        { value: 2, name: 'Closed', itemStyle: { color: '#737373' } },
        { value: 1, name: 'On Hold', itemStyle: { color: '#9ca3af' } },
        { value: 3, name: 'Talent Pool', itemStyle: { color: '#0ea5e9' } },
      ],
    },
  ],
});

const barOptions = $derived<EChartsOption>({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
  },
  legend: {
    bottom: 0,
    left: 'center',
    textStyle: { color: axisColor, fontSize: 11 },
    itemWidth: 10,
    itemHeight: 10,
    icon: 'circle',
  },
  grid: { left: 32, right: 12, top: 16, bottom: 48 },
  xAxis: {
    type: 'category',
    data: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
    axisLine: { lineStyle: { color: axisLine } },
    axisTick: { show: false },
    axisLabel: { color: axisColor, fontSize: 11 },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: axisLine, type: 'dashed' } },
    axisLabel: { color: axisColor, fontSize: 11 },
  },
  series: [
    {
      name: 'Submitted',
      type: 'bar',
      stack: 'total',
      data: [3, 5, 4, 6, 3, 2],
      itemStyle: { color: '#0ea5e9', borderRadius: [0, 0, 0, 0] },
      barWidth: 18,
    },
    {
      name: 'Interview',
      type: 'bar',
      stack: 'total',
      data: [1, 2, 1, 1, 0, 0],
      itemStyle: { color: '#f59e0b' },
      barWidth: 18,
    },
    {
      name: 'Offer',
      type: 'bar',
      stack: 'total',
      data: [0, 1, 0, 1, 1, 1],
      itemStyle: { color: '#a855f7', borderRadius: [4, 4, 0, 0] },
      barWidth: 18,
    },
  ],
});

const radarOptions = $derived<EChartsOption>({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  radar: {
    indicator: [
      { name: 'Response rate', max: 100 },
      { name: 'Interview rate', max: 100 },
      { name: 'Offer rate', max: 100 },
      { name: 'Profile match', max: 100 },
      { name: 'Activity', max: 100 },
    ],
    radius: '68%',
    splitNumber: 4,
    axisName: {
      color: axisColor,
      fontSize: 11,
    },
    splitLine: { lineStyle: { color: axisLine } },
    splitArea: {
      show: true,
      areaStyle: {
        color: isDark
          ? ['rgba(38,38,38,0.4)', 'rgba(23,23,23,0.4)']
          : ['rgba(249,250,251,0.6)', 'rgba(255,255,255,0.6)'],
      },
    },
    axisLine: { lineStyle: { color: axisLine } },
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: [62, 35, 18, 78, 84],
          name: 'You',
          areaStyle: { color: 'rgba(14,165,233,0.25)' },
          lineStyle: { color: '#0ea5e9', width: 2 },
          itemStyle: { color: '#0ea5e9' },
        },
        {
          value: [45, 22, 9, 60, 55],
          name: 'Average',
          areaStyle: { color: 'rgba(168,85,247,0.15)' },
          lineStyle: { color: '#a855f7', width: 2, type: 'dashed' },
          itemStyle: { color: '#a855f7' },
        },
      ],
    },
  ],
});
</script>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
	<!-- Funnel: full width on mobile, spans 2 cols on lg -->
	<div
		class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-900/[0.02] lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
	>
		<div class="mb-2 flex items-baseline justify-between">
			<h3 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">Pipeline funnel</h3>
			<span class="text-[11px] uppercase tracking-widest text-gray-400 dark:text-neutral-600">
				Submitted → Hired
			</span>
		</div>
		<div class="h-[320px] w-full">
			<Chart {init} options={funnelOptions} />
		</div>
	</div>

	<!-- Donut: final outcome distribution -->
	<div
		class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-900/[0.02] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
	>
		<div class="mb-2 flex items-baseline justify-between">
			<h3 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">Final outcomes</h3>
			<span class="text-[11px] uppercase tracking-widest text-gray-400 dark:text-neutral-600">
				Distribution
			</span>
		</div>
		<div class="h-[320px] w-full">
			<Chart {init} options={donutOptions} />
		</div>
	</div>

	<!-- Bar chart: applications by month -->
	<div
		class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-900/[0.02] lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
	>
		<div class="mb-2 flex items-baseline justify-between">
			<h3 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">Activity by month</h3>
			<span class="text-[11px] uppercase tracking-widest text-gray-400 dark:text-neutral-600">
				Last 6 months
			</span>
		</div>
		<div class="h-[280px] w-full">
			<Chart {init} options={barOptions} />
		</div>
	</div>

	<!-- Radar: performance vs benchmark -->
	<div
		class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-900/[0.02] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
	>
		<div class="mb-2 flex items-baseline justify-between">
			<h3 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">Performance</h3>
			<span class="text-[11px] uppercase tracking-widest text-gray-400 dark:text-neutral-600">
				You vs avg
			</span>
		</div>
		<div class="h-[280px] w-full">
			<Chart {init} options={radarOptions} />
		</div>
	</div>
</div>
