import Link from "next/link";

export default function ContactsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Contacts
        </h1>
        <p className="text-sm leading-7 text-zinc-600">
          Retrouvez Traditions sur les réseaux ou écrivez-nous via les canaux
          officiels.
        </p>
      </div>

      <ul className="flex flex-col gap-4 text-sm text-zinc-700">
        <li>
          <span className="font-semibold text-zinc-950">Facebook</span>
          <br />
          <a
            className="text-zinc-950 underline hover:no-underline"
            href="https://www.facebook.com/share/3DE39quvWo8VvnRP/?mibextid=LQQJ4d"
            target="_blank"
            rel="noreferrer"
          >
            Page Traditions
          </a>
        </li>
        <li>
          <span className="font-semibold text-zinc-950">Instagram</span>
          <br />
          <a
            className="text-zinc-950 underline hover:no-underline"
            href="https://www.instagram.com/__.traditions.__?igsh=MWN3cW5xMTlrc2Zqdg=="
            target="_blank"
            rel="noreferrer"
          >
            @__.traditions.__
          </a>
        </li>
        <li>
          <span className="font-semibold text-zinc-950">Atelier (RDV)</span>
          <br />
          <a
            className="text-zinc-950 underline hover:no-underline"
            href="https://wa.me/2250710074284"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp — demander un rendez-vous
          </a>
        </li>
      </ul>

      <Link
        href="/"
        className="text-sm font-semibold text-zinc-950 hover:underline"
      >
        ← Retour à l’accueil
      </Link>
    </div>
  );
}
