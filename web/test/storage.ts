/** Deterministic browser storage for tests, independent of Node's storage flags. */
class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

export function installTestStorage() {
  Object.defineProperty(window, 'localStorage', { configurable: true, value: new MemoryStorage() });
  Object.defineProperty(window, 'sessionStorage', { configurable: true, value: new MemoryStorage() });
}

export function storageEvent(init: Pick<StorageEvent, 'key' | 'newValue' | 'storageArea'>) {
  return Object.assign(new Event('storage'), init);
}
