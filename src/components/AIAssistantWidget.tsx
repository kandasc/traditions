"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Bonjour. Dites-moi ce que vous cherchez (occasion, style, budget, taille) et je vous guide.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            data?.reply ??
            "Je suis désolé — je n’ai pas pu répondre. Réessayez.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Erreur réseau. Réessayez dans un instant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed z-50 inline-flex min-h-12 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white shadow-lg hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        style={{
          bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
          right: "max(1rem, env(safe-area-inset-right, 0px))",
        }}
      >
        {open ? "Fermer" : "Assistant"}
      </button>

      {open ? (
        <div
          className="fixed z-50 w-[min(100vw-1.25rem,28rem)] max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-950"
          style={{
            bottom:
              "calc(4.25rem + max(0px, env(safe-area-inset-bottom, 0px)))",
            right: "max(0.625rem, env(safe-area-inset-right, 0px))",
          }}
        >
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Assistant Traditions
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Conseils style, tailles, idées cadeaux.
            </p>
          </div>

          <div className="max-h-[min(52vh,420px)] overflow-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={[
                    "max-w-[90%] rounded-2xl px-4 py-2 text-sm leading-6",
                    m.role === "user"
                      ? "ml-auto bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                      : "mr-auto bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-zinc-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] dark:border-zinc-800">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="Ex: robe pour mariage, 75k, taille M…"
                className="min-h-12 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 sm:text-sm"
              />
              <button
                type="button"
                onClick={send}
                disabled={loading}
                className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
              >
                {loading ? "…" : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

