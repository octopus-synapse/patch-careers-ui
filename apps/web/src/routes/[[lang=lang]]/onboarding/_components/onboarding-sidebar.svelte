<script lang="ts">
import { Sidebar } from 'ui';

type Step = {
  id: string;
  label: string;
  icon?: string;
};

type Props = {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  progress: number;
  missingRequired?: string[];
  ongoto: (stepId: string) => void;
};

let {
  steps,
  currentStep,
  completedSteps,
  progress,
  missingRequired = [],
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
	progress={{ value: progress }}
	onselect={ongoto}
/>
