import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, renderApp, screen } from "@/test/render";
import { ChoosePlanStep } from "./choose-plan-step";

vi.mock("expo-router", () => ({ usePathname: () => "/en/auth" }));

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
});

afterEach(cleanup);

describe("choose plan mobile actions", () => {
  it("keeps actions outside the scroller and enables Continue after a plan is selected", () => {
    const onBack = vi.fn();
    const onContinue = vi.fn();
    renderApp(<ChoosePlanStep onBack={onBack} onContinue={onContinue} />, { locale: "en" });

    const scroller = screen.getByTestId("authDialog.planScroller");
    const actions = screen.getByTestId("authDialog.planActions");
    const continueButton = screen.getByRole("button", { name: "Continue" });

    expect(scroller).not.toContainElement(actions);
    expect(continueButton).toBeDisabled();
    expect(screen.queryByText("Continue with this plan")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /Free/ }));
    expect(continueButton).toBeEnabled();
    fireEvent.click(continueButton);
    expect(onContinue).toHaveBeenCalledWith("free", "US");

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
