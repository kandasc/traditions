import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { message } = (await req.json().catch(() => ({}))) as {
    message?: string;
  };

  const userMessage = (message ?? "").toString().trim();
  if (!userMessage) {
    return Response.json({ error: "Missing message" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 24,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    select: {
      name: true,
      slug: true,
      priceXof: true,
      description: true,
      details: true,
    },
  });

  const catalogSnippet = products
    .map(
      (p) =>
        `- ${p.name} (/shop/${p.slug}) — ${
          p.priceXof ? `${p.priceXof} FCFA` : "prix à confirmer"
        } — ${[p.description, p.details].filter(Boolean).join(" | ")}`.slice(
          0,
          240,
        ),
    )
    .join("\n");

  if (!apiKey) {
    return Response.json({
      reply:
        "Le chat AI est prêt, mais la clé API n’est pas configurée. Ajoutez `OPENAI_API_KEY` dans `.env`, puis relancez le serveur.",
    });
  }

  const system = [
    "Tu es l’assistant shopping de la marque Traditions.",
    "Objectifs: aider à choisir une pièce, guider vers une taille/couleur, proposer des alternatives, et orienter vers l’atelier sur mesure si besoin.",
    "Réponds en français, ton chaleureux, phrases courtes.",
    "Quand tu proposes un produit, fournis le lien /shop/<slug>.",
    "",
    "Catalogue (extrait):",
    catalogSnippet,
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return Response.json(
      { error: "AI request failed", details: text },
      { status: 500 },
    );
  }

  const data = (await res.json()) as any;
  const reply = data?.choices?.[0]?.message?.content ?? "Désolé, je n’ai pas compris.";

  return Response.json({ reply });
}

