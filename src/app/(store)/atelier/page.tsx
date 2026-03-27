export default async function AtelierPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/sayele-logo-black.svg"
            alt=""
            className="h-7 w-auto object-contain dark:hidden"
          />
          <img
            src="/sayele-logo-white.svg"
            alt=""
            className="hidden h-7 w-auto object-contain dark:block"
          />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          L’Atelier by Traditions
        </h1>
        <div className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
          <p>Chaque pièce de l’Atelier est une rencontre.</p>
          <p>Entre vos envies, votre histoire et notre savoir-faire.</p>
          <div className="h-2" />
          <p>
            De la prise de mesure à la livraison, nous créons des pièces uniques,
            pensées pour vous.
          </p>
        </div>
        <a
          className="inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-zinc-950 px-6 text-base font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          href="https://wa.me/2250710074284"
          target="_blank"
          rel="noreferrer"
        >
          Prendre rendez-vous
        </a>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Process
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {[
            "Rendez-vous (physique ou téléphonique)",
            "Prise de mesure",
            "Création",
            "Essayage",
            "Livraison",
          ].map((step, idx) => (
            <li
              key={step}
              className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Étape {idx + 1}
              </p>
              <p className="mt-2 font-semibold text-zinc-950 dark:text-zinc-50">
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Galerie
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
            />
          ))}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Photos à venir (tu me les enverras).
        </p>
      </section>
    </div>
  );
}

