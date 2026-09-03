import { describe, expect, it, vi } from "vitest";
import { fireEvent, renderApp, screen } from "@/test/render";
import {
  decisionsFromProposal,
  type FieldDecision,
  RewriteReviewModal,
} from "./rewrite-review-modal";

const fields = [
  { key: "role", label: "Cargo", type: "string", required: false },
  { key: "description", label: "Descrição", type: "textarea", required: false },
] as never;

const t = (key: string, params?: Record<string, string | number>): string =>
  params ? `${key}:${Object.values(params).join(",")}` : key;

describe("decisionsFromProposal", () => {
  it("lists only translatable fields whose proposal differs, accepted by default", () => {
    const decisions = decisionsFromProposal(
      ["role", "description"],
      { role: "Engineer", description: "Same text" },
      { role: "Senior Engineer", description: "Same text" },
    );
    expect(decisions).toEqual([
      {
        key: "role",
        current: "Engineer",
        proposal: "Senior Engineer",
        text: "Senior Engineer",
        accepted: true,
      },
    ]);
  });
});

describe("<RewriteReviewModal>", () => {
  const decisions: FieldDecision[] = [
    {
      key: "role",
      current: "Engineer",
      proposal: "Senior Engineer",
      text: "Senior Engineer",
      accepted: true,
    },
  ];

  it("shows the field label, the diff, and lets the person refuse a change", () => {
    const onChangeDecision = vi.fn();
    renderApp(
      <RewriteReviewModal
        visible
        localeLabel="inglês"
        fields={fields}
        decisions={decisions}
        onChangeDecision={onChangeDecision}
        onApply={() => undefined}
        onKeep={() => undefined}
        busy={false}
        t={t}
      />,
    );
    expect(screen.getByText("Cargo")).toBeInTheDocument();
    expect(screen.getByText("Senior")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch"));
    expect(onChangeDecision).toHaveBeenCalledWith("role", { accepted: false });
  });

  it("lets the person rewrite the proposal and fires apply / keep", () => {
    const onChangeDecision = vi.fn();
    const onApply = vi.fn();
    const onKeep = vi.fn();
    renderApp(
      <RewriteReviewModal
        visible
        localeLabel="inglês"
        fields={fields}
        decisions={decisions}
        onChangeDecision={onChangeDecision}
        onApply={onApply}
        onKeep={onKeep}
        busy={false}
        t={t}
      />,
    );
    fireEvent.change(screen.getByLabelText("sections.rewrite.editA11y:Cargo"), {
      target: { value: "Staff Engineer" },
    });
    expect(onChangeDecision).toHaveBeenCalledWith("role", { text: "Staff Engineer" });
    fireEvent.click(screen.getByText("sections.rewrite.apply"));
    expect(onApply).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText("sections.rewrite.keep")[0] as HTMLElement);
    expect(onKeep).toHaveBeenCalled();
  });
});
