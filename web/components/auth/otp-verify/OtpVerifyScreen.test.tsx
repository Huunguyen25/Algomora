// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OtpVerifyScreen as WebOtp } from "./OtpVerifyScreen";

vi.mock("@/components/brand-mark", () => ({ BrandMark: () => null }));
afterEach(cleanup);

const Otp = WebOtp;

describe('OTP inputs', () => {
  it('keeps both apps’ input markup, behavior, and box styles identical', () => {
    const root = resolve(process.cwd(), 'components/auth/otp-verify');
    const local = readFileSync(resolve(root, 'OtpVerifyScreen.tsx'), 'utf8');
    const extension = readFileSync(resolve(root, '../../../../extension/components/auth/otp-verify/OtpVerifyScreen.tsx'), 'utf8');
    expect(local.slice(local.indexOf('export function'))).toBe(extension.slice(extension.indexOf('export function')));
    const styles = (path: string) => readFileSync(resolve(root, path), 'utf8').split('.otp-field {')[1].split('.signin-hint {')[0];
    expect(styles('otp-verify.css')).toBe(styles('../../../../extension/components/auth/otp-verify/otp-verify.css'));
  });
  function setup(busy: "verify" | null = null) {
    const verify = vi.fn((event) => {
      event.preventDefault();
      return screen.getAllByRole('textbox', { name: /Digit \d of 6/ })
        .map(input => (input as HTMLInputElement).value).join('');
    });
    function Form() {
      const [code, setCode] = useState("");
      return <Otp email="test@example.com" code={code} onCodeChange={setCode}
        onVerify={verify} onResend={() => {}} onDifferentEmail={() => {}}
        busy={busy} cooldown={0} />;
    }
    render(<Form />);
    const digits = screen.getAllByRole('textbox', { name: /Digit \d of 6/ }) as HTMLInputElement[];
    return { digits, verify };
  }

  it('advances while typing and enables verification only after six digits', () => {
    const { digits, verify } = setup();
    const submit = screen.getByRole('button', { name: 'Verify code' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    digits.forEach((input, index) => {
      fireEvent.change(input, { target: { value: String(index + 1) } });
      expect(document.activeElement).toBe(digits[Math.min(index + 1, 5)]);
    });
    expect(digits.map(input => input.value).join('')).toBe('123456');
    expect(submit.disabled).toBe(false);
    expect(verify).toHaveBeenCalledOnce();
    expect(verify).toHaveReturnedWith('123456');
  });

  it('pastes a full code from any box and preserves gaps when deleting', () => {
    const { digits, verify } = setup();
    fireEvent.paste(digits[3], { clipboardData: { getData: () => '123 456' } });
    expect(digits.map(input => input.value).join('')).toBe('123456');
    expect(verify).toHaveBeenCalledOnce();
    expect(verify).toHaveReturnedWith('123456');
    fireEvent.keyDown(digits[3], { key: 'Backspace' });
    expect(digits.map(input => input.value)).toEqual(['1', '2', '3', '', '5', '6']);
    fireEvent.keyDown(digits[3], { key: 'Backspace' });
    expect(document.activeElement).toBe(digits[2]);
    fireEvent.change(digits[2], { target: { value: '9' } });
    expect(digits.map(input => input.value)).toEqual(['1', '2', '9', '', '5', '6']);
    expect((screen.getByRole('button', { name: 'Verify code' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('lets users correct filled codes manually and rearms only after an incomplete entry', () => {
    const verify = vi.fn((event) => event.preventDefault());
    const props = {
      email: 'test@example.com', code: '123456', onCodeChange: vi.fn(),
      onVerify: verify, onResend: vi.fn(), onDifferentEmail: vi.fn(), cooldown: 0,
    };
    const { rerender } = render(<Otp {...props} busy={null} />);
    expect(verify).toHaveBeenCalledOnce();
    rerender(<Otp {...props} busy="verify" />);
    rerender(<Otp {...props} busy={null} error="Invalid code" />);
    expect(verify).toHaveBeenCalledOnce();
    rerender(<Otp {...props} code="923456" busy={null} />);
    rerender(<Otp {...props} code="983456" busy={null} />);
    expect(verify).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Verify code' }));
    expect(verify).toHaveBeenCalledTimes(2);
    rerender(<Otp {...props} code="12345" busy={null} />);
    rerender(<Otp {...props} busy={null} />);
    expect(verify).toHaveBeenCalledTimes(3);
  });

  it('supports arrow navigation and disables every box during verification', () => {
    const { digits } = setup('verify');
    expect(digits.every(input => input.matches(':disabled'))).toBe(true);
    cleanup();
    const active = setup().digits;
    fireEvent.keyDown(active[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(active[1]);
    fireEvent.keyDown(active[1], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(active[0]);
  });
});
