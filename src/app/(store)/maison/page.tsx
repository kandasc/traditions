export default function MaisonPage() {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          La Maison Traditions
        </h1>
      </header>

      <div className="flex flex-col gap-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        <p>Traditions est une histoire de transmission.</p>
        <p>
          La marque a été fondée au début des années 2000 par Mariatou Mariette
          Dicko, créatrice passionnée, profondément attachée à la richesse des
          étoffes africaines.
        </p>
        <p>
          À travers ses créations, elle a toujours cherché à valoriser des
          matières emblématiques comme le bogolan, le pagne tissé ou l’indigo.
        </p>
        <p>
          En 2023, sa fille Renée Mariame reprend la marque avec une ambition
          claire : préserver cet héritage tout en le réinventant pour une
          nouvelle génération.
        </p>
        <p>
          Aujourd’hui, Traditions devient une maison. Une maison qui évolue
          entre héritage et modernité.
        </p>
      </div>
    </article>
  );
}

