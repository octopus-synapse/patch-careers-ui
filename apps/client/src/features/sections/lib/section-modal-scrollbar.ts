import { Platform } from "react-native";

const STYLE_ID = "patch-section-modal-scrollbar";

/** Scoped to the section editor; runtime injection also covers Expo's dev server. */
export function ensureSectionModalScrollbar(): void {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [data-section-modal-scroll] {
      scrollbar-width: thin;
      scrollbar-color: rgba(128, 128, 140, 0.45) transparent;
    }
    @supports selector(::-webkit-scrollbar) {
      [data-section-modal-scroll] {
        scrollbar-width: auto;
        scrollbar-color: auto;
      }
      [data-section-modal-scroll]::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      [data-section-modal-scroll]::-webkit-scrollbar-track {
        background: transparent;
      }
      [data-section-modal-scroll]::-webkit-scrollbar-thumb {
        background: rgba(128, 128, 140, 0.45);
        border-radius: 999px;
      }
      [data-section-modal-scroll]::-webkit-scrollbar-thumb:hover {
        background: rgba(128, 128, 140, 0.7);
      }
      [data-section-modal-scroll]::-webkit-scrollbar-button {
        display: none;
        width: 0;
        height: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
