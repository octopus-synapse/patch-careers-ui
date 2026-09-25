import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, renderApp, screen, waitFor } from "@/test/render";
import { ChoosePlanStep } from "./choose-plan-step";

vi.mock("expo-router", () => ({ usePathname: () => "/en/auth" }));
vi.mock("@/features/billing", () => ({
  useBillingOffers: () => ({
    data: [
      {
        code: "go_card_month",
        plan: "go",
        paymentMethod: "card",
        recurring: true,
        termMonths: 1,
        amountCents: 3_999,
        listAmountCents: 3_999,
        currency: "BRL",
        founderRemaining: null,
      },
      {
        code: "go_pix_year",
        plan: "go",
        paymentMethod: "pix",
        recurring: false,
        termMonths: 12,
        amountCents: 39_990,
        listAmountCents: 47_988,
        currency: "BRL",
        founderRemaining: null,
      },
    ],
    isLoading: false,
  }),
}));

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
    expect(onContinue).toHaveBeenCalledWith("free");

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("creates the account only after a plan and explicit legal consent", async () => {
    const onContinue = vi.fn();
    renderApp(<ChoosePlanStep requireAccountConsent onBack={vi.fn()} onContinue={onContinue} />, {
      locale: "en",
    });

    fireEvent.click(screen.getByRole("radio", { name: /Free/ }));
    const createButton = screen.getByRole("button", { name: "Create account and continue" });
    expect(createButton).toBeEnabled();
    fireEvent.click(createButton);
    expect(onContinue).not.toHaveBeenCalled();
    const legalScroll = await screen.findByTestId("authDialog.planConsentDialog.scroll");
    fireEvent.scroll(legalScroll, {
      nativeEvent: {
        contentOffset: { y: 2_000 },
        contentSize: { height: 2_500, width: 400 },
        layoutMeasurement: { height: 600, width: 400 },
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agree and create my account" }));
    expect(onContinue).toHaveBeenCalledWith("free");
    await waitFor(() =>
      expect(screen.queryByTestId("authDialog.planConsentDialog")).not.toBeInTheDocument(),
    );
  });

  it("keeps the selected paid offer when continuing", () => {
    const onContinue = vi.fn();
    renderApp(<ChoosePlanStep onBack={vi.fn()} onContinue={onContinue} />, { locale: "en" });

    fireEvent.click(screen.getByRole("radio", { name: /Go/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Pix · 12 months/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(onContinue).toHaveBeenCalledWith("go", "go_pix_year");
  });
});
