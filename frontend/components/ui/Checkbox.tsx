// components/ui/Checkbox.tsx
export function Checkbox({ label }: { label: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
      <input type="checkbox" className="accent-[var(--primary-start)]" />
      {label}
    </label>
  );
}
