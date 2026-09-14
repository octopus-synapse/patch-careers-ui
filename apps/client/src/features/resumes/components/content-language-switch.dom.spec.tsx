import { describe, expect, it, vi } from "vitest";
import { fireEvent, renderApp, screen } from "@/test/render";
import { ContentLanguageSwitch } from "./content-language-switch";

describe("<ContentLanguageSwitch>", () => {
  it("renders both options and marks the active one selected", () => {
    renderApp(<ContentLanguageSwitch value="pt-BR" onChange={() => undefined} />);
    const pt = screen.getByRole("button", { name: /Português/ });
    const en = screen.getByRole("button", { name: /English/ });
    expect(pt).toHaveAttribute("aria-selected", "true");
    expect(en).not.toHaveAttribute("aria-selected", "true");
  });

  it("reports the other locale on press", () => {
    const onChange = vi.fn();
    renderApp(<ContentLanguageSwitch value="pt-BR" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /English/ }));
    expect(onChange).toHaveBeenCalledWith("en");
  });

  it("reads its own copy from the UI locale, not the selected value", () => {
    renderApp(<ContentLanguageSwitch value="pt-BR" onChange={() => undefined} />, {
      locale: "en",
    });
    expect(screen.getByRole("button", { name: /^View .*Português/ })).toBeInTheDocument();
  });

  it("narrates a running translation with the section count", () => {
    renderApp(
      <ContentLanguageSwitch
        value="en"
        onChange={() => undefined}
        progress={{ resumeId: "r", locale: "en", done: 6, total: 11, status: "running" }}
      />,
    );
    expect(screen.getByText(/6\/11/)).toBeInTheDocument();
  });

  it("says how many items still show the original when the version is incomplete", () => {
    renderApp(
      <ContentLanguageSwitch
        value="en"
        onChange={() => undefined}
        status={{
          locale: "en",
          role: "derived",
          items: { total: 10, current: 7, stale: 0, missing: 3, manual: 0, diverged: 0 },
          prose: "current",
        }}
      />,
    );
    expect(screen.getByText(/3 /)).toBeInTheDocument();
  });

  it("explains a run the monthly cap refused, without hiding the switch", () => {
    renderApp(
      <ContentLanguageSwitch
        value="en"
        onChange={() => undefined}
        progress={{
          resumeId: "r",
          locale: "en",
          done: 0,
          total: 0,
          status: "skipped",
          reason: "monthly-cap",
        }}
      />,
    );
    expect(screen.getByText(/limite|limit/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
