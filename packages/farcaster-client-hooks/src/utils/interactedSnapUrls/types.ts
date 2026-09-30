/** Async key-value store for interacted snap URL timestamps. */
type InteractedSnapUrlsStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem?: (key: string) => Promise<void>;
};

export type { InteractedSnapUrlsStore };
