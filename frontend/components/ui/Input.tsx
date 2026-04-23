export function Input({
  placeholder,
  type = "text",
}: {
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="
        w-full h-12 px-4
        rounded-xl
        border border-[var(--border)]
        bg-white
        text-sm
        outline-none
        focus:ring-2 focus:ring-[var(--primary-start)]
      "
    />
  );
}
