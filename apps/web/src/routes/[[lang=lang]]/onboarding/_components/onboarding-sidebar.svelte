<script lang="ts">
import type { Translator } from 'i18n';
import { Sidebar } from 'ui';

type Step = {
  id: string;
  label: string;
  icon?: string;
};

type Strength = {
  score: number;
  message: string;
  level: string;
};

type Props = {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  progress: number;
  strength?: Strength;
  missingRequired?: string[];
  t: Translator;
  ongoto: (stepId: string) => void;
};

let {
  steps,
  currentStep,
  completedSteps,
  progress,
  strength,
  missingRequired = [],
  t,
  ongoto,
}: Props = $props();

const navItems = $derived(
  steps.map((step) => ({
    id: step.id,
    label: step.label,
    icon: step.icon,
    completed: completedSteps.includes(step.id),
    missing: missingRequired.includes(step.id),
  })),
);
</script>

<Sidebar
	items={navItems}
	active={currentStep}
	numbered
	progress={{ value: strength?.score ?? progress, message: strength?.message }}
	onselect={ongoto}
/>
