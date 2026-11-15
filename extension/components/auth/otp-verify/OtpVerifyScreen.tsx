import { BrandMark } from "@/components/brand-mark";
import { useEffect, useId, useRef, type FormEvent } from "react";
import "./otp-verify.css";

export type OtpVerifyBusy = "verify" | "resend" | null;

export interface OtpVerifyScreenProps {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onVerify: (event: FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
  onDifferentEmail: () => void;
  busy: OtpVerifyBusy;
  cooldown: number;
  error?: string | null;
  hint?: string;
}

/**
 * Extension OTP verification screen.
 * Keep this presentational — auth/session logic lives in the login page.
 * Markup/classes match the dashboard OTP screen 1:1 (independent copy).
 */
export function OtpVerifyScreen({
  email,
  code,
  onCodeChange,
  onVerify,
  onResend,
  onDifferentEmail,
  busy,
  cooldown,
  error = null,
  hint = "Check your email for the six-digit code.",
}: OtpVerifyScreenProps) {
  const hintId = useId();
  const errorId = useId();
  const form = useRef<HTMLFormElement>(null);
  const hasAutoSubmitted = useRef(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = code.padEnd(6, " ").slice(0, 6).split("");

  // Submit after React commits the sixth digit so the host receives the latest code.
  // Allow corrections after an attempt without submitting every changed digit.
  // Becoming incomplete rearms automatic submission for the next completed entry.
  useEffect(() => {
    if (!/^\d{6}$/.test(code)) {
      hasAutoSubmitted.current = false;
      return;
    }
    if (busy !== null || hasAutoSubmitted.current) return;
    hasAutoSubmitted.current = true;
    form.current?.requestSubmit();
  }, [code, busy]);

  function focusDigit(index: number) {
    const input = inputs.current[Math.max(0, Math.min(5, index))];
    input?.focus();
    input?.select();
  }

  function updateDigits(index: number, value: string) {
    const incoming = value.replace(/\D/g, "");
    if (!incoming) return;
    // Autofill and a full-code paste replace the entire code from any box.
    const start = incoming.length >= 6 ? 0 : index;
    const next = [...digits];
    incoming.slice(0, 6 - start).split("").forEach((digit, offset) => {
      next[start + offset] = digit;
    });
    onCodeChange(next.join("").trimEnd());
    focusDigit(start + Math.min(incoming.length, 6 - start));
  }

  function clearDigit(index: number) {
    const next = [...digits];
    next[index] = " ";
    onCodeChange(next.join("").trimEnd());
  }

  return (
    <div className="signin-page">
      <div className="signin-panel">
        <div className="signin-brand">
          <BrandMark />
          <span className="brand-name">Algomora</span>
        </div>
        <h1>Sign in</h1>
        <p className="signin-lead">
          Use the same email as the extension to load your reviews.
        </p>
        <form ref={form} className="signin-form" onSubmit={onVerify}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              disabled
              readOnly
              autoComplete="email"
              aria-label="Email"
            />
          </label>
          <fieldset className="otp-field" disabled={busy !== null}>
            <legend>Six-digit code</legend>
            <div className="otp-inputs">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(input) => { inputs.current[index] = input; }}
                  className="otp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  value={digit.trim()}
                  onChange={(event) => {
                    if (!event.target.value) clearDigit(index);
                    else updateDigits(index, event.target.value);
                  }}
                  onFocus={(event) => event.target.select()}
                  onClick={(event) => event.currentTarget.select()}
                  onPaste={(event) => {
                    event.preventDefault();
                    updateDigits(index, event.clipboardData.getData("text"));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace") {
                      event.preventDefault();
                      const target = digit.trim() ? index : Math.max(0, index - 1);
                      clearDigit(target);
                      focusDigit(target);
                    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                      event.preventDefault();
                      focusDigit(index + (event.key === "ArrowLeft" ? -1 : 1));
                    } else if (event.key === "Delete") {
                      event.preventDefault();
                      clearDigit(index);
                    }
                  }}
                  autoFocus={index === 0}
                  required
                  pattern="[0-9]"
                  aria-label={`Digit ${index + 1} of 6`}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${hintId} ${errorId}` : hintId}
                />
              ))}
            </div>
          </fieldset>
          <p id={hintId} className="signin-hint">{hint}</p>
          {error ? (
            <p id={errorId} className="signin-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="signin-submit"
            disabled={busy !== null || !/^\d{6}$/.test(code)}
          >
            {busy === "verify" ? "Verifying…" : "Verify code"}
          </button>
        </form>
        <div className="signin-secondary">
          <button
            type="button"
            className="signin-link"
            onClick={onResend}
            disabled={busy !== null || cooldown > 0}
          >
            {busy === "resend"
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Send another code"}
          </button>
          <button
            type="button"
            className="signin-link"
            onClick={onDifferentEmail}
            disabled={busy !== null}
          >
            Different email
          </button>
        </div>
      </div>
    </div>
  );
}
