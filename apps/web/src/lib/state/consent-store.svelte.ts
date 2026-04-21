export type ConsentCategories = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentRecord = ConsentCategories & {
  version: 1;
  acceptedAt: string;
};

const STORAGE_KEY = 'consent_v1';

function readStorage(): ConsentRecord | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed?.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(record: ConsentRecord): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* storage quota or privacy mode — noop */
  }
}

function clearStorage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

function createConsentStore() {
  let current = $state<ConsentRecord | null>(null);
  let hydrated = $state(false);

  function hydrate() {
    if (hydrated) return;
    current = readStorage();
    hydrated = true;
  }

  return {
    get current() {
      return current;
    },
    get hydrated() {
      return hydrated;
    },
    get needsDecision() {
      return hydrated && current === null;
    },
    get analytics() {
      return current?.analytics === true;
    },
    get marketing() {
      return current?.marketing === true;
    },
    hydrate,
    save(categories: Pick<ConsentCategories, 'analytics' | 'marketing'>) {
      const record: ConsentRecord = {
        essential: true,
        analytics: categories.analytics,
        marketing: categories.marketing,
        version: 1,
        acceptedAt: new Date().toISOString(),
      };
      writeStorage(record);
      current = record;
    },
    reset() {
      clearStorage();
      current = null;
    },
  };
}

export const consentStore = createConsentStore();
