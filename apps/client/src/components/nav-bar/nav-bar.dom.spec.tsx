import { CountBadge } from "@patch-careers/ui/editorial";
import { cloneElement, type ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, renderApp, screen, within } from "@/test/render";
import { NavBar } from "./nav-bar.web";

const state = vi.hoisted(() => ({
  path: "/curriculos",
  count: 0,
  name: "Enzo Patti",
  desktop: true,
  authenticated: true,
  push: vi.fn(),
  replace: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("expo-router", () => ({
  usePathname: () => state.path,
  useRouter: () => ({ push: state.push, replace: state.replace }),
  Link: ({ children, href }: { children: ReactElement<{ href: string }>; href: string }) =>
    cloneElement(children, { href }),
}));
vi.mock("@patch-careers/api-client", () => ({
  setApiClientLocale: vi.fn(),
  useGetV1ChatUnread: () => ({ data: { totalUnread: state.count } }),
  useGetV1NotificationsUnreadCount: () => ({ data: { count: state.count } }),
  useGetV1UsersProfile: () => ({ data: { name: state.name, photoURL: null } }),
}));
vi.mock("@patch-careers/auth", () => ({ logout: () => state.logout() }));
vi.mock("@/providers/auth-provider", () => ({
  useAuthState: () => ({
    currentUser: { name: state.name, email: "enzo@example.test" },
    isAuthenticated: state.authenticated,
  }),
}));
vi.mock("@/hooks/use-desktop-web", () => ({ useIsDesktopWeb: () => state.desktop }));
vi.mock("@/features/landing", () => ({ landingSans: "Inter" }));
vi.mock("@/features/search", () => ({
  SearchTrigger: ({ onPress }: { onPress: () => void }) => (
    <button type="button" onClick={onPress}>
      Buscar
    </button>
  ),
  SearchModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div role="dialog" aria-label="Busca">
        <button type="button" onClick={onClose}>
          Fechar busca
        </button>
      </div>
    ) : null,
}));
vi.mock("@/components/auth/auth-dialog/auth-dialog", () => ({ AuthDialog: () => null }));
vi.mock("./preferences-modal", () => ({
  PreferencesModal: ({ tab }: { tab: string }) => (
    <div role="dialog" aria-label={`Preferências ${tab}`} />
  ),
}));
vi.mock("../confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    title,
    onConfirm,
  }: {
    open: boolean;
    title: string;
    onConfirm: () => void;
  }) =>
    open ? (
      <div role="alertdialog" aria-label={title}>
        <button type="button" onClick={onConfirm}>
          Confirmar saída
        </button>
      </div>
    ) : null,
}));

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 768 });
  window.dispatchEvent(new Event("resize"));
  state.path = "/curriculos";
  state.count = 0;
  state.name = "Enzo Patti";
  state.desktop = true;
  state.authenticated = true;
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("desktop navbar v12", () => {
  it.each([
    [0, "0"],
    [1, "1"],
    [99, "99"],
    [105, "99+"],
  ])("shows %i unread items in both controls", (count, label) => {
    state.count = Number(count);
    renderApp(<NavBar variant="app" />);
    for (const name of [`Mensagens, ${count} não lidas`, `Notificações, ${count} não lidas`]) {
      expect(screen.getByRole("button", { name })).toHaveTextContent(String(label));
    }
    fireEvent.click(screen.getByRole("button", { name: `Mensagens, ${count} não lidas` }));
    expect(state.push).toHaveBeenCalledWith("/messages", undefined);
    fireEvent.click(screen.getByRole("button", { name: `Notificações, ${count} não lidas` }));
    expect(state.push).toHaveBeenCalledWith("/notifications", undefined);
  });

  it("keeps zero hidden for existing CountBadge consumers", () => {
    const view = renderApp(<CountBadge count={0} />);
    expect(view.container).not.toHaveTextContent("0");
    view.rerender(<CountBadge count={0} showZero />);
    expect(view.container).toHaveTextContent("0");
  });

  it("follows deep links and only underlines the active primary destination", () => {
    state.path = "/resume/42";
    const view = renderApp(<NavBar variant="app" />);
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(nav).getByRole("link", { name: "Currículos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: "Vagas" })).toHaveAttribute("href", "/jobs");
    expect(within(nav).getByRole("link", { name: "Candidaturas" })).toHaveAttribute(
      "href",
      "/applications",
    );
    state.path = "/profile/identity";
    view.rerender(<NavBar variant="app" />);
    expect(within(nav).getByRole("link", { name: /Eu/ })).toHaveAttribute("aria-current", "page");
    state.path = "/messages";
    view.rerender(<NavBar variant="app" />);
    expect(nav.querySelector("[aria-current]")).toBeNull();
    expect(nav.querySelector("[data-nav-active-line]")).toBeNull();
    state.path = "/jobs";
    view.rerender(<NavBar variant="app" />);
    expect(within(nav).getByRole("link", { name: "Vagas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(nav.querySelectorAll("[data-nav-active-line]")).toHaveLength(1);
    state.path = "/applications";
    view.rerender(<NavBar variant="app" />);
    expect(within(nav).getByRole("link", { name: "Candidaturas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("opens search from either keyboard shortcut", () => {
    renderApp(<NavBar variant="app" />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "Busca" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fechar busca" }));
    fireEvent.keyDown(document, { key: "K", metaKey: true });
    expect(screen.getByRole("dialog", { name: "Busca" })).toBeInTheDocument();
  });

  it("keeps the current account menu and closes it on Escape and outside click", () => {
    renderApp(<NavBar variant="app" />);
    const trigger = screen.getByRole("button", { name: "Abrir menu da conta — Enzo" });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: /Configurações/ })).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps sign-out confirmation alive after closing its menu", async () => {
    renderApp(<NavBar variant="app" />);
    fireEvent.click(screen.getByRole("button", { name: /Abrir menu da conta/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Sair/ }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar saída" }));
    expect(state.logout).toHaveBeenCalledOnce();
  });

  it("uses the translated account fallback without exposing the e-mail", () => {
    state.name = "   ";
    renderApp(<NavBar variant="app" />, { locale: "en" });
    expect(screen.getByRole("button", { name: "Open account menu — Account" })).toBeInTheDocument();
  });

  it.each(["narrow", "guest", "onboarding"])("does not render app chrome for %s", (kind) => {
    state.desktop = kind !== "narrow";
    state.authenticated = kind !== "guest";
    if (kind === "onboarding") state.path = "/onboarding";
    const view = renderApp(<NavBar variant="app" />);
    expect(view.container.querySelector("[data-app-navbar]")).toBeNull();
  });
});

describe("compact onboarding navbar", () => {
  it("keeps the auth-style chrome, full menu, and progress below the bar", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
    window.dispatchEvent(new Event("resize"));

    renderApp(
      <NavBar
        variant="onboarding"
        account={{ email: "enzo@example.test" }}
        progress={{ pct: 30, label: "3 / 10" }}
      />,
    );

    expect(screen.getByText("patch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir menu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir menu da conta" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "3 / 10" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir menu" }));

    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    for (const label of [
      "Idioma e região",
      "Tema",
      "Ajuda",
      "Privacidade",
      "Termos de uso",
      "Sair da conta",
    ]) {
      expect(screen.getByRole("menuitem", { name: label })).toBeInTheDocument();
    }
  });
});
