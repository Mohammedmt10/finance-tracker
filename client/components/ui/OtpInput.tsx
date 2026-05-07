/**
 * OTP Input Component
 *
 * Four individual digit boxes with auto-focus-advance.
 * Returns the combined 4-digit string via the `onComplete` callback.
 */

"use client";

import React, { useRef, useState, useCallback } from "react";

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export default function OtpInput({ length = 4, onComplete }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback(
    (index: number, digit: string) => {
      // Accept only single digits
      if (!/^\d?$/.test(digit)) return;

      const updated = [...values];
      updated[index] = digit;
      setValues(updated);

      // Auto-advance to the next input
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Fire callback when all digits are filled
      if (updated.every((v) => v !== "")) {
        onComplete(updated.join(""));
      }
    },
    [values, length, onComplete]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      // Move focus back on Backspace when the current box is empty
      if (e.key === "Backspace" && !values[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [values]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").slice(0, length);
      if (!/^\d+$/.test(pasted)) return;

      const updated = [...values];
      pasted.split("").forEach((ch, i) => {
        updated[i] = ch;
      });
      setValues(updated);

      // Focus the last filled input (or the next empty one)
      const focusIdx = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIdx]?.focus();

      if (updated.every((v) => v !== "")) {
        onComplete(updated.join(""));
      }
    },
    [values, length, onComplete]
  );

  return (
    <div className="flex gap-3 justify-center">
      {values.map((val, idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={idx === 0 ? handlePaste : undefined}
          className="
            w-14 h-14 text-center text-2xl font-bold
            rounded-xl
            bg-surface-800 border border-surface-600
            text-white
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
            transition-all duration-200
          "
          aria-label={`OTP digit ${idx + 1}`}
        />
      ))}
    </div>
  );
}
