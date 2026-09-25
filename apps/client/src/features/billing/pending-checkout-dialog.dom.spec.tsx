import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, renderApp, screen } from "@/test/render";
import { PendingCheckoutDialog } from "./pending-checkout-dialog";

afterEach(cleanup);

describe("PendingCheckoutDialog", () => {
  it("requires an explicit cancellation choice before switching plans", () => {
    const onKeep = vi.fn();
    const onCancelAndSwitch = vi.fn();
    renderApp(
      <PendingCheckoutDialog
        visible
        busy={false}
        onKeep={onKeep}
        onCancelAndSwitch={onCancelAndSwitch}
      />,
      { locale: "en" },
    );

    expect(screen.getByText(/Pix payment in progress/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue this payment" }));
    expect(onKeep).toHaveBeenCalledOnce();
    expect(onCancelAndSwitch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel order and change plan" }));
    expect(onCancelAndSwitch).toHaveBeenCalledOnce();
  });
});
