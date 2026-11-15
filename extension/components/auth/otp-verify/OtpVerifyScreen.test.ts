import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OtpVerifyScreen, type OtpVerifyScreenProps } from "./OtpVerifyScreen";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it('submits completion once, allows manual corrections, and rearms after clearing', () => {
  const verify = vi.fn((event) => event.preventDefault());
  const props: OtpVerifyScreenProps = {
    email: 'test@example.com', code: '123456', busy: null, cooldown: 0,
    onCodeChange: vi.fn(), onVerify: verify, onResend: vi.fn(), onDifferentEmail: vi.fn(),
  };
  const render = (changes: Partial<OtpVerifyScreenProps>) => {
    act(() => root.render(createElement(OtpVerifyScreen, { ...props, ...changes })));
  };
  render({});
  expect(verify).toHaveBeenCalledOnce();
  render({ busy: 'verify' });
  render({ error: 'Invalid code' });
  render({ code: '923456' });
  render({ code: '983456' });
  expect(verify).toHaveBeenCalledOnce();
  act(() => container.querySelector('form')!.requestSubmit());
  expect(verify).toHaveBeenCalledTimes(2);
  render({ code: '12345' });
  render({ code: '123456' });
  expect(verify).toHaveBeenCalledTimes(3);
});
