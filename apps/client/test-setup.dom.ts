import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// The shared render wrapper mounts I18nProvider, which reads the current route.
// Expo Router's Node entry loads untransformed TSX, so provide the browser-test
// baseline here; navigation specs can override this with their own module mock.
vi.mock("expo-router", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// react-native-web reads these on module load; jsdom has no layout engine.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});
