import { useLayoutEffect, useRef, useState } from "react";
import { Platform, type TextInputContentSizeChangeEvent } from "react-native";

/** Measures multiline input content, including when text or available width shrinks. */
export function useInputAutoSize(enabled: boolean, value: unknown) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [height, setHeight] = useState(44);

  // biome-ignore lint/correctness/useExhaustiveDependencies: value changes require a fresh content measurement
  useLayoutEffect(() => {
    const input = ref.current;
    if (!enabled || Platform.OS !== "web" || !input) return;

    const resize = () => {
      // Reset before measuring so deleting text can shrink the input too.
      input.style.height = "0px";
      const css = getComputedStyle(input);
      const border =
        Number.parseFloat(css.borderTopWidth) + Number.parseFloat(css.borderBottomWidth);
      input.style.height = `${input.scrollHeight + border}px`;
    };

    resize();
    let width = input.clientWidth;
    const observer = new ResizeObserver(() => {
      if (input.clientWidth !== width) {
        width = input.clientWidth;
        resize();
      }
    });
    observer.observe(input);
    return () => observer.disconnect();
  }, [enabled, value]);

  if (!enabled) return {};
  if (Platform.OS === "web") return { ref };

  return {
    height,
    scrollEnabled: false,
    onContentSizeChange: (event: TextInputContentSizeChangeEvent) => {
      setHeight(Math.max(44, Math.ceil(event.nativeEvent.contentSize.height)));
    },
  };
}
