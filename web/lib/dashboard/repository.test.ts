// @vitest-environment jsdom
import { installTestStorage } from "@/test/storage";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { listDashboardReviews, readCachedReviews } from "./repository";

const query = vi.hoisted(() => ({ order: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: () => ({ select: () => ({ eq: () => query }) }) }),
}));
const cacheKey = 'dashboard:reviews:user';

beforeEach(() => {
  installTestStorage();

  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'test');
  query.order.mockResolvedValue({ data: [{ problem_slug: 'two-sum', mastery: 4 }], error: null });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

it('writes fetched reviews to the user-scoped cache', async () => {
  expect(readCachedReviews('user')).toBeNull();
  const reviews = await listDashboardReviews('user');
  expect(reviews[0].problemSlug).toBe('two-sum');
  expect(window.localStorage.getItem(cacheKey)).not.toBeNull();
  expect(readCachedReviews('user')?.reviews).toEqual(reviews);
  expect(readCachedReviews('another-user')).toBeNull();
});

it.each(['QuotaExceededError', 'SecurityError'])('returns live rows when storage throws %s', async (name) => {
  vi.spyOn(Object.getPrototypeOf(window.localStorage), 'setItem').mockImplementation(() => { throw new DOMException('Unavailable', name); });
  const reviews = await listDashboardReviews('user');
  expect(reviews[0].problemSlug).toBe('two-sum');
});

it('still rejects a failed server query', async () => {
  query.order.mockResolvedValue({ data: null, error: new Error('offline') });
  await expect(listDashboardReviews('user')).rejects.toThrow('offline');
});
