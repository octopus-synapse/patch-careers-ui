/** Lets persistent navigation restart the in-page auth state machine. */
export const AUTH_FLOW_RESET_EVENT = "patch:auth-flow-reset";

export function requestAuthFlowReset(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_FLOW_RESET_EVENT));
}
