// components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="
        w-full h-12
        rounded-xl
        text-white text-sm font-medium
        bg-gradient-to-r from-[var(--primary-start)] to-[var(--primary-end)]
        hover:opacity-90 transition
      "
    >
      {children}
    </button>
  );
}
