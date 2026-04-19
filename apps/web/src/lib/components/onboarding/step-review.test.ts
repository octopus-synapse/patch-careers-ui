import { cleanup, render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StepReview from './step-review.svelte';

afterEach(cleanup);

const steps = [
  {
    id: 'personal-info',
    label: 'Personal Info',
    fields: [
      { key: 'fullName', label: 'Full Name' },
      { key: 'email', label: 'Email' },
    ],
  },
  { id: 'username', label: 'Username' },
  {
    id: 'professional-profile',
    label: 'Professional Profile',
    fields: [
      { key: 'headline', label: 'Headline' },
      { key: 'summary', label: 'Summary' },
    ],
  },
  { id: 'section:work', label: 'Work Experience' },
  { id: 'section:education', label: 'Education' },
  {
    id: 'template',
    label: 'Theme',
    data: [{ id: 'classic', name: 'Classic', thumbnailUrl: '/themes/classic.png' }],
  },
];

const fullSession = {
  personalInfo: { fullName: 'Enzo Ferracini', email: 'enzo@test.com' },
  username: 'enzoferracini',
  professionalProfile: {
    headline: 'Developer',
    summary: 'Full-stack dev with 5 years of experience building web apps.',
  },
  sections: [
    {
      sectionTypeKey: 'work',
      items: [{ content: { title: 'Engineer', company: 'Acme', period: '2020-2024' } }],
    },
    {
      sectionTypeKey: 'education',
      noData: true,
    },
  ],
  templateSelection: { templateId: 'classic' },
};

describe('StepReview', () => {
  it('renders all completed sections from session data', () => {
    const ongoto = vi.fn();
    render(StepReview, {
      props: {
        session: fullSession,
        steps,
        completedSteps: [
          'personal-info',
          'username',
          'professional-profile',
          'section:work',
          'section:education',
          'template',
        ],
        ongoto,
      },
    });

    expect(screen.getByText('Personal Info')).toBeInTheDocument();
    expect(screen.getByText('Enzo Ferracini')).toBeInTheDocument();
    expect(screen.getByText('enzo@test.com')).toBeInTheDocument();

    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('@enzoferracini')).toBeInTheDocument();

    expect(screen.getByText('Professional Profile')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();

    expect(screen.getByText('Work Experience')).toBeInTheDocument();
    expect(screen.getByText(/Engineer/)).toBeInTheDocument();

    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();

    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Classic')).toBeInTheDocument();
  });

  it('calls ongoto with correct stepId when section is clicked', async () => {
    const ongoto = vi.fn();
    render(StepReview, {
      props: {
        session: { personalInfo: { fullName: 'Test' } },
        steps,
        completedSteps: ['personal-info'],
        ongoto,
      },
    });

    const personalInfoButton = screen.getByText('Personal Info').closest('button');
    if (!personalInfoButton) throw new Error('Personal Info button not found');
    await userEvent.click(personalInfoButton);
    expect(ongoto).toHaveBeenCalledWith('personal-info');
  });

  it('renders with empty session without crashing', () => {
    const ongoto = vi.fn();
    render(StepReview, {
      props: {
        session: {},
        steps,
        completedSteps: [],
        ongoto,
      },
    });

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('handles sections with items correctly (not marked as skipped)', () => {
    const ongoto = vi.fn();
    render(StepReview, {
      props: {
        session: {
          sections: [
            {
              sectionTypeKey: 'work',
              items: [{ content: { title: 'Dev', company: 'Corp' } }],
            },
          ],
        },
        steps,
        completedSteps: ['section:work'],
        ongoto,
      },
    });

    expect(screen.getByText('Work Experience')).toBeInTheDocument();
    expect(screen.queryByText('Skipped')).not.toBeInTheDocument();
    expect(screen.getByText(/Dev/)).toBeInTheDocument();
  });

  it('renders theme with thumbnail image', () => {
    const ongoto = vi.fn();
    render(StepReview, {
      props: {
        session: { templateSelection: { templateId: 'classic' } },
        steps,
        completedSteps: ['template'],
        ongoto,
      },
    });

    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.alt).toBe('Classic');
  });
});
