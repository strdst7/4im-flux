"use client";

import type { ReactNode } from "react";

/* Minimal, house-styled control primitives for the 4IM/Flux studio. */

export function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="border-t border-bone/10 px-6 py-6">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h3 className="eyebrow text-[0.625rem] text-gold/80">{title}</h3>
        {right}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  disabled?: boolean;
}) {
  return (
    <label className={`block ${disabled ? "opacity-40" : ""}`}>
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-mist">
          {label}
        </span>
        <span className="font-mono text-[0.6875rem] text-bone/70">
          {format ? format(value) : value.toFixed(2)}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="fluid-range mt-2 w-full"
      />
    </label>
  );
}

export function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between gap-4 text-left ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-mist">
        {label}
      </span>
      <span
        className={`relative h-[18px] w-[34px] shrink-0 border transition-colors duration-500 ${
          value ? "border-gold/60 bg-gold/25" : "border-bone/15 bg-transparent"
        }`}
      >
        <span
          className={`absolute top-[2px] h-[12px] w-[12px] transition-all duration-500 ${
            value ? "left-[18px] bg-gold" : "left-[2px] bg-bone/35"
          }`}
        />
      </span>
    </button>
  );
}

export function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[0.6875rem] uppercase tracking-[0.18em] text-mist">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`border px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.2em] transition-colors duration-300 ${
              option.value === value
                ? "border-gold/60 text-gold-soft"
                : "border-bone/12 text-mist hover:border-gold/35 hover:text-bone"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Action({
  children,
  onClick,
  tone = "quiet",
  disabled,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "quiet" | "gold" | "danger";
  disabled?: boolean;
  full?: boolean;
}) {
  const tones = {
    quiet: "border-bone/15 text-mist hover:border-gold/40 hover:text-bone",
    gold: "border-gold/50 text-gold-soft hover:bg-gold/10",
    danger: "border-red-400/30 text-red-300/80 hover:border-red-400/60",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`border px-3 py-2 text-[0.625rem] uppercase tracking-[0.22em] transition-all duration-300 disabled:opacity-40 ${
        tones[tone]
      } ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { r: number; g: number; b: number };
  onChange: (value: { r: number; g: number; b: number }) => void;
}) {
  const hex =
    "#" +
    [value.r, value.g, value.b]
      .map(v =>
        Math.max(0, Math.min(255, Math.round(v * 255)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("");

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-mist">
        {label}
      </span>
      <span className="flex items-center gap-3">
        <span className="font-mono text-[0.625rem] text-bone/50">{hex}</span>
        <input
          type="color"
          value={hex}
          onChange={e => {
            const int = parseInt(e.target.value.slice(1), 16);
            onChange({
              r: ((int >> 16) & 255) / 255,
              g: ((int >> 8) & 255) / 255,
              b: (int & 255) / 255,
            });
          }}
          className="h-7 w-10 cursor-pointer border border-bone/15 bg-transparent p-0"
        />
      </span>
    </div>
  );
}
