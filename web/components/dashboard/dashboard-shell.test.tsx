// @vitest-environment jsdom
import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { installTestStorage, storageEvent } from "@/test/storage";
import { DashboardShell } from "./dashboard-shell";

vi.mock("next/navigation", () => ({ usePathname: () => '/', useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("@/components/brand-mark", () => ({ BrandMark: () => null }));
vi.mock("./ui", () => ({ ProblemDrawer: () => null }));
vi.mock("./dashboard-provider", () => ({
  DashboardProvider: ({ children }: { children: ReactNode }) => children,
  useDashboard: () => ({ authConfigured: false, sessionEmail: null, dataStatus: 'unconfigured', signOut: vi.fn() }),
}));
beforeEach(() => {
  installTestStorage();
  document.documentElement.dataset.theme = 'dark';
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('restores the sidebar and writes toggles using only the stable keys', async () => {
  window.localStorage.setItem('dashboard:preferences:sidebar', 'collapsed');
  render(<DashboardShell>Content</DashboardShell>);
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Expand sidebar' })).not.toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
  expect(window.localStorage.getItem('dashboard:preferences:sidebar')).toBe('expanded');
  fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
  expect(window.localStorage.getItem('dashboard:preferences:theme')).toBe('light');
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(window.localStorage.length).toBe(2);
});

it('syncs other-tab changes and restores defaults when storage is cleared', async () => {
  render(<DashboardShell>Content</DashboardShell>);
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeNull());
  act(() => {
    window.dispatchEvent(storageEvent({ key: 'dashboard:preferences:theme', newValue: 'light', storageArea: window.localStorage }));
    window.dispatchEvent(storageEvent({ key: 'dashboard:preferences:sidebar', newValue: 'collapsed', storageArea: window.localStorage }));
  });
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(screen.queryByRole('button', { name: 'Expand sidebar' })).not.toBeNull();
  expect(screen.queryByRole('button', { name: 'Switch to dark theme' })).not.toBeNull();
  act(() => window.dispatchEvent(storageEvent({ key: null, newValue: null, storageArea: window.localStorage })));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeNull();
});

it('keeps toggles functional when storage writes fail', async () => {
  render(<DashboardShell>Content</DashboardShell>);
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Collapse sidebar' })).not.toBeNull());
  vi.spyOn(Object.getPrototypeOf(window.localStorage), 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
  expect(screen.queryByRole('button', { name: 'Expand sidebar' })).not.toBeNull();
  expect(document.documentElement.dataset.theme).toBe('light');
});
