import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200/70 bg-white dark:border-zinc-700/70 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))] text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:text-zinc-400">
        <div className="flex flex-col gap-1 text-zinc-500 sm:flex-row sm:items-center sm:gap-3 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} Traditions</p>
          <p className="text-xs sm:text-sm">
            Built by{" "}
            <a
              className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-950 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-white"
              href="https://sayele.co"
              target="_blank"
              rel="noreferrer"
            >
              SAYELE
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link className="hover:text-zinc-950 dark:hover:text-white" href="/contacts">
            Contacts
          </Link>
          <a
            className="hover:text-zinc-950 dark:hover:text-white"
            href="https://www.facebook.com/share/3DE39quvWo8VvnRP/?mibextid=LQQJ4d"
            target="_blank"
            rel="noreferrer"
          >
            Facebook
          </a>
          <a
            className="hover:text-zinc-950 dark:hover:text-white"
            href="https://www.instagram.com/__.traditions.__?igsh=MWN3cW5xMTlrc2Zqdg=="
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
          <a
            className="hover:text-zinc-950 dark:hover:text-white"
            href="https://snapchat.com/t/jM3nyGWc"
            target="_blank"
            rel="noreferrer"
          >
            Snapchat
          </a>
          <a
            className="hover:text-zinc-950 dark:hover:text-white"
            href="https://www.tiktok.com/@traditionsontiktok?_t=8qjtLOjabCq&_r=1"
            target="_blank"
            rel="noreferrer"
          >
            TikTok
          </a>
        </div>
      </div>
    </footer>
  );
}

