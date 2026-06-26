/**
 * Expo Go detection. Remote push doesn't work in Expo Go (SDK 53+ removed it),
 * so when running there we swap the real notification service for a mock that
 * simulates the whole flow via local notifications.
 *
 * `appOwnership === "expo"` is the classic Expo Go marker; `executionEnvironment
 * === "storeClient"` is the SDK 50+ equivalent — both are checked for resilience.
 */

import Constants from "expo-constants";

export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo" || Constants.executionEnvironment === "storeClient";
}
