/**
 * Shared types for `@patch-careers/state`.
 *
 * `Migrator` is the canonical signature for a Zustand persist
 * `migrate` function. Each store declares its own `version` literal
 * and provides a migrator that handles every previous version.
 */

export type Migrator<T> = (persistedState: unknown, fromVersion: number) => T;

export interface StoredPayload<T> {
  state: T;
  version: number;
}
