import { Redirect } from "expo-router";
import type { ReactElement } from "react";

export default function NativeCheckoutRedirect(): ReactElement {
  return <Redirect href="/go" />;
}
