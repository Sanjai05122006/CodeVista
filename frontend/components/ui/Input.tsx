import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({
  className = "",
  type = "text",
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      className={`h-10 w-full rounded-md border border-[var(--hairline)] bg-[var(--canvas)] px-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--mute)] focus:border-[var(--hairline-strong)] ${className}`}
      {...props}
    />
  );
}
