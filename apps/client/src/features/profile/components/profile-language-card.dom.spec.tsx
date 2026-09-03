import { describe, expect, it, vi } from "vitest";
import { fireEvent, renderApp, screen } from "@/test/render";
import { ProfileLanguageCard } from "./profile-language-card";

describe("<ProfileLanguageCard>", () => {
  it("renders both options and marks the active one selected", () => {
    renderApp(<ProfileLanguageCard value="pt-BR" onChange={() => undefined} />);
    const pt = screen.getByRole("button", { name: /Português/ });
    const en = screen.getByRole("button", { name: /English/ });
    expect(pt).toHaveAttribute("aria-selected", "true");
    expect(en).not.toHaveAttribute("aria-selected", "true");
  });

  it("reports the other locale on press", () => {
    const onChange = vi.fn();
    renderApp(<ProfileLanguageCard value="pt-BR" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /English/ }));
    expect(onChange).toHaveBeenCalledWith("en");
  });

  it("reads its own copy from the UI locale, not the selected value", () => {
    renderApp(<ProfileLanguageCard value="pt-BR" onChange={() => undefined} />, { locale: "en" });
    expect(screen.getByRole("heading")).toHaveTextContent(/language/i);
  });
});
