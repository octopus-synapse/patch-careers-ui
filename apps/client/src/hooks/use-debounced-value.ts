/**
 * useDebouncedValue — trailing-edge debounce for fast-changing values
 * (search terms, filters) so consumers re-query once typing settles
 * instead of per keystroke. Shared by the Jobs list and the global
 * search modal.
 */

import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
