import type { InputHTMLAttributes, ReactNode } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
};

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--body)]">
      <input
        type="checkbox"
        className={`h-4 w-4 rounded border border-[var(--hairline-strong)] accent-[var(--ink)] ${className}`}
        {...props}
      />
      {label}
    </label>
  );
}
