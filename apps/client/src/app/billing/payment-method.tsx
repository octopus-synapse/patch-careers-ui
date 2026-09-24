import { Redirect } from "expo-router";
import type { ReactElement } from "react";

export default function NativePaymentMethodRedirect(): ReactElement {
  return <Redirect href="/go" />;
}
