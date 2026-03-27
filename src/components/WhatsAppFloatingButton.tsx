"use client";

export function WhatsAppFloatingButton({
  phoneE164 = "2250710074284",
  label = "WhatsApp",
}: {
  phoneE164?: string;
  label?: string;
}) {
  const href = `https://wa.me/${encodeURIComponent(phoneE164)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-4 right-4 z-[150] inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white shadow-lg shadow-black/15 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
      aria-label="Contacter sur WhatsApp"
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 dark:bg-black/10">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            fill="currentColor"
            d="M20.52 3.49A11.83 11.83 0 0 0 12.06 0C5.5 0 .16 5.35.16 11.93c0 2.1.55 4.14 1.6 5.95L0 24l6.33-1.66a11.86 11.86 0 0 0 5.73 1.47h.01c6.57 0 11.92-5.35 11.92-11.93 0-3.19-1.24-6.18-3.47-8.39ZM12.07 21.8h-.01a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.75.98 1-3.66-.24-.38a9.9 9.9 0 0 1-1.52-5.21c0-5.49 4.46-9.96 9.95-9.96a9.9 9.9 0 0 1 7.04 2.93 9.9 9.9 0 0 1 2.92 7.03c0 5.49-4.46 9.96-9.98 9.96Zm5.76-7.47c-.32-.16-1.9-.94-2.19-1.05-.3-.11-.52-.16-.73.16-.21.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-.32-.16-1.35-.5-2.56-1.6-.94-.84-1.57-1.88-1.75-2.2-.19-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.52-.54-.73-.55h-.62c-.21 0-.57.08-.86.4-.3.32-1.13 1.1-1.13 2.68s1.16 3.11 1.32 3.33c.16.21 2.28 3.49 5.52 4.9.77.33 1.37.52 1.84.66.77.25 1.47.21 2.03.13.62-.09 1.9-.78 2.17-1.54.27-.76.27-1.41.19-1.54-.08-.13-.29-.21-.62-.37Z"
          />
        </svg>
      </span>
      <span>{label}</span>
    </a>
  );
}

