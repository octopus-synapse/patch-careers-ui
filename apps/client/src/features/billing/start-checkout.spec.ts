import { fetcher } from "@patch-careers/api-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelBillingCheckout, createBillingCheckoutRoute } from "./start-checkout";

vi.mock("@patch-careers/api-client", () => ({ fetcher: vi.fn() }));

describe("createBillingCheckoutRoute", () => {
  beforeEach(() => vi.mocked(fetcher).mockReset());

  it("creates the selected offer and returns the direct checkout route", async () => {
    vi.mocked(fetcher).mockResolvedValue({ data: { id: "checkout/id" } } as never);

    await expect(createBillingCheckoutRoute("max_pix_year")).resolves.toBe(
      "/billing/checkout?checkout=checkout%2Fid",
    );
    expect(fetcher).toHaveBeenCalledWith({
      method: "POST",
      url: "/api/v1/billing/checkouts",
      data: { offerCode: "max_pix_year" },
    });
  });

  it("cancels the exact checkout and only accepts a confirmed cancellation", async () => {
    vi.mocked(fetcher).mockResolvedValueOnce({ data: { status: "canceled" } } as never);
    await expect(cancelBillingCheckout("checkout/id")).resolves.toBe("canceled");
    expect(fetcher).toHaveBeenCalledWith({
      method: "POST",
      url: "/api/v1/billing/checkouts/checkout%2Fid/cancel",
    });
    vi.mocked(fetcher).mockResolvedValueOnce({ data: { status: "pending" } } as never);
    await expect(cancelBillingCheckout("checkout/id")).resolves.toBe("other");
  });
});
