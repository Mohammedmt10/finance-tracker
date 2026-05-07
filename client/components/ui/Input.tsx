/**
 * Input Component
 *
 * Styled text input with an optional label, error message,
 * and left-side icon slot. Built for the dark design system.
 */

"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className = "",
  id,
  ...rest
}: InputProps) {
  // Generate a stable id from the label if none is provided
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-300"
        >
          {label}
        </label>
      )}

      {/* Input wrapper (with optional icon) */}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          className={`
            w-full rounded-xl
            bg-surface-800 border border-surface-600
            text-slate-100 placeholder:text-slate-500
            px-4 py-2.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
            transition-all duration-200
            ${icon ? "pl-10" : ""}
            ${error ? "border-red-500 focus:ring-red-500/50" : ""}
            ${className}
          `}
          {...rest}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
}
