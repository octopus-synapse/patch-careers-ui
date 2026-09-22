import { authDialogPalette } from "@patch-careers/tokens";
import { type CSSProperties, type ReactElement, useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { useResolvedScheme } from "@/providers/color-scheme";
import { AuthFlowCard } from "./auth-flow-card";

const WEB_BACKDROP_STYLE = {
  backdropFilter: "blur(9px)",
  WebkitBackdropFilter: "blur(9px)",
} satisfies Pick<CSSProperties, "backdropFilter" | "WebkitBackdropFilter">;

export function AuthDialog({ onClose }: { readonly onClose: () => void }): ReactElement {
  const resolved = useResolvedScheme();
  const { width, height } = useWindowDimensions();
  const [isPlanStep, setIsPlanStep] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <View
      style={{
        position: "fixed" as never,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 300,
        backgroundColor: authDialogPalette[resolved].scrim,
        ...WEB_BACKDROP_STYLE,
        alignItems: "center",
        justifyContent: "center",
      }}
      onStartShouldSetResponder={() => true}
      onResponderRelease={onClose}
      {...{ dataSet: { landingOverlay: "" } }}
    >
      <View
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => undefined}
        style={{ width: Math.min(isPlanStep ? 1260 : 550, width * 0.96), maxHeight: height * 0.96 }}
      >
        <AuthFlowCard onClose={onClose} onPlanStepChange={setIsPlanStep} />
      </View>
    </View>
  );
}
