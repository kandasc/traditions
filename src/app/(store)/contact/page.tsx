export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Contact
        </h1>
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Une question, une demande, une envie sur mesure ? <br />
          Contactez-nous directement via WhatsApp.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <a
          href="https://wa.me/2250710074284"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-base font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          Contacter sur WhatsApp
        </a>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Email
          </p>
          <p className="mt-2 font-semibold text-zinc-950 dark:text-zinc-50">
            contact@traditions-mode.com
          </p>
        </div>
      </div>
    </div>
  );
}

