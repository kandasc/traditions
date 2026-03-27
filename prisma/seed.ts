import bcrypt from "bcryptjs";
import slugify from "slugify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "traditions-rebuild-bot/1.0 (+https://localhost; for seeding)",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

type ScrapedProduct = {
  legacyId: number;
  name: string;
  priceXof?: number;
  priceEurCents?: number;
  priceUsdCents?: number;
  description?: string;
  details?: string;
  imageUrls: string[];
  sizes: string[];
  colors: { hex: string; imageUrl?: string }[];
};

function parseMoneyToInt(raw: string) {
  const cleaned = raw.replace(/\s/g, "").replace(/[^\d]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function parseEuroToCents(raw: string) {
  const n = parseMoneyToInt(raw);
  return n === undefined ? undefined : n * 100;
}

async function scrapeProductsFromTraditions(): Promise<ScrapedProduct[]> {
  const base = "https://www.traditions-mode.com";
  const shopHtml = await fetchHtml(`${base}/shop`);
  const $ = (await import("cheerio")).load(shopHtml);

  const ids = new Set<number>();
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") || "").trim();
    const m =
      href.match(/^\/shop\/(\d+)$/) ||
      href.match(/^https?:\/\/www\.traditions-mode\.com\/shop\/(\d+)$/);
    if (m) ids.add(Number(m[1]));
  });

  const out: ScrapedProduct[] = [];
  for (const legacyId of [...ids].sort((a, b) => a - b)) {
    const html = await fetchHtml(`${base}/shop/${legacyId}`);
    const $$ = (await import("cheerio")).load(html);

    const name =
      $$(".article-title").first().text().trim() ||
      $$("h4").first().text().trim();

    const prices = $$(".price")
      .toArray()
      .map((el) => $$(el).text().trim())
      .filter(Boolean);

    const priceXof = prices.find((p) => p.includes("FCFA"));
    const priceEur = prices.find((p) => p.includes("€"));
    const priceUsd = prices.find((p) => p.includes("$"));

    const imageUrls: string[] = [];
    const hero = $$(".pic-article").attr("src");
    if (hero) imageUrls.push(hero);

    const sizes: string[] = [];
    $$(".btn-select[data-size]").each((_, el) => {
      const t = $$(el).text().trim();
      if (t) sizes.push(t);
    });

    const colors: { hex: string; imageUrl?: string }[] = [];
    $$(".pic-color[data-color]").each((_, el) => {
      const hex = ($$(el).attr("data-color") || "").trim();
      const imageUrl = ($$(el).attr("data-pic") || "").trim();
      if (hex) colors.push({ hex, imageUrl: imageUrl || undefined });
    });

    const descText = $$(".desc-text")
      .toArray()
      .map((el) => $$(el).text().trim())
      .filter(Boolean);

    const description = descText[0];
    const details = descText[1];

    out.push({
      legacyId,
      name: name || `Produit ${legacyId}`,
      priceXof: priceXof ? parseMoneyToInt(priceXof) : undefined,
      priceEurCents: priceEur ? parseEuroToCents(priceEur) : undefined,
      priceUsdCents: priceUsd ? parseEuroToCents(priceUsd) : undefined,
      description,
      details,
      imageUrls: [...new Set(imageUrls)],
      sizes: [...new Set(sizes.map((s) => s.toUpperCase()))],
      colors,
    });
  }

  return out;
}

async function main() {
  const adminEmail = "admin@local";
  const adminPassword = "admin123";

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Admin",
      role: "admin",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
    update: {
      role: "admin",
    },
  });

  await prisma.page.upsert({
    where: { slug: "about" },
    create: {
      slug: "about",
      title: "Qui sommes-nous ?",
      body: [
        "Traditions, c'est bien plus qu'une marque de vêtements. C'est un héritage, une histoire transmise de mère en fille depuis quatre générations.",
        "",
        "Née au Mali, notre marque incarne l'essence même de l'élégance africaine à travers des étoffes nobles et intemporelles : le bogolan, le pagne tissé, le Wax, le Bazin et l'indigo.",
        "",
        "Fondée par Mariétou Mariette DICKO, créatrice de mode et styliste reconnue, surnommée affectueusement “La reine du Bogolan”, Traditions reflète la passion et le savoir-faire transmis de sa propre mère, une véritable fashionista avant l'heure.",
        "",
        "Chez Traditions, chaque pièce raconte une histoire. Une histoire de femmes, de famille, d'art et de transmission.",
        "",
        "“Bienvenue là où authenticité et traditions riment avec modernisme.”",
      ].join("\n"),
      isActive: true,
    },
    update: {},
  });

  await prisma.page.upsert({
    where: { slug: "atelier" },
    create: {
      slug: "atelier",
      title: "L'ATELIER BY TRADITIONS",
      body: [
        "L'ATELIER BY TRADITIONS est la ligne de Traditions consacrée exclusivement à la confection sur mesure pour femmes, hommes et enfants.",
        "",
        "Pour demander un rendez-vous : https://wa.me/2250710074284",
      ].join("\n"),
      isActive: true,
    },
    update: {},
  });

  await prisma.siteSetting.upsert({
    where: { key: "brand.name" },
    create: { key: "brand.name", value: "Traditions" },
    update: { value: "Traditions" },
  });

  const defaultCategories = [
    { name: "ICON", slug: "icon", sortOrder: 10 },
    { name: "HÉRITAGE", slug: "heritage", sortOrder: 20 },
    { name: "MAISON", slug: "maison", sortOrder: 30 },
    { name: "ACCESSOIRES", slug: "accessoires", sortOrder: 40 },
  ];
  for (const c of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { ...c, isActive: true },
      update: { name: c.name, sortOrder: c.sortOrder, isActive: true },
    });
  }

  const categoriesBySlug = new Map(
    (
      await prisma.category.findMany({
        select: { id: true, slug: true },
      })
    ).map((c) => [c.slug, c.id] as const),
  );

  const products = await scrapeProductsFromTraditions();

  for (const p of products) {
    const slug = slugify(p.name, { lower: true, strict: true }) || `p-${p.legacyId}`;

    const product = await prisma.product.upsert({
      where: { legacyId: p.legacyId },
      create: {
        legacyId: p.legacyId,
        name: p.name,
        slug,
        description: p.description,
        details: p.details,
        isActive: true,
        priceXof: p.priceXof,
        priceEurCents: p.priceEurCents,
        priceUsdCents: p.priceUsdCents,
        images: {
          create: p.imageUrls.map((url, idx) => ({ url, alt: p.name, sortOrder: idx })),
        },
        variants: {
          create:
            p.colors.length > 0
              ? p.colors.flatMap((c) =>
                  (p.sizes.length > 0 ? p.sizes : [""]).map((s) => ({
                    colorHex: c.hex,
                    imageUrl: c.imageUrl,
                    sizeLabel: s || null,
                    isActive: true,
                  })),
                )
              : (p.sizes.length > 0 ? p.sizes : [""]).map((s) => ({
                  sizeLabel: s || null,
                  isActive: true,
                })),
        },
      },
      update: {
        name: p.name,
        slug,
        description: p.description,
        details: p.details,
        isActive: true,
        priceXof: p.priceXof,
        priceEurCents: p.priceEurCents,
        priceUsdCents: p.priceUsdCents,
      },
    });

    // Keep images/variants fresh (simple strategy: wipe + recreate)
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: p.imageUrls.map((url, idx) => ({
        productId: product.id,
        url,
        alt: p.name,
        sortOrder: idx,
      })),
    });
    if (p.colors.length > 0) {
      await prisma.productVariant.createMany({
        data: p.colors.flatMap((c) =>
          (p.sizes.length > 0 ? p.sizes : [""]).map((s) => ({
            productId: product.id,
            colorHex: c.hex,
            imageUrl: c.imageUrl,
            sizeLabel: s || null,
            isActive: true,
          })),
        ),
      });
    } else {
      await prisma.productVariant.createMany({
        data: (p.sizes.length > 0 ? p.sizes : [""]).map((s) => ({
          productId: product.id,
          sizeLabel: s || null,
          isActive: true,
        })),
      });
    }

    // Best-effort auto-categorization for products without a category.
    // Never overwrite manual assignments: only set when the product has no categories.
    const alreadyCategorized = await prisma.product.count({
      where: { id: product.id, categories: { some: {} } },
    });
    if (!alreadyCategorized) {
      const blob = `${p.name}\n${p.description ?? ""}\n${p.details ?? ""}`.toLowerCase();
      const slugs: string[] = [];
      // Map legacy keywords to the new "univers" categories (best effort).
      if (blob.includes("bogolan") || blob.includes("wax") || blob.includes("indigo"))
        slugs.push("heritage");
      if (/\bkimono\b/.test(blob) || /\brobe(s)?\b/.test(blob) || /\bkaftan(s)?\b/.test(blob) || /\bcaftan(s)?\b/.test(blob))
        slugs.push("icon");
      if (blob.includes("parfum") || blob.includes("bougie") || blob.includes("maison"))
        slugs.push("maison");
      if (blob.includes("sac") || blob.includes("ceinture") || blob.includes("accessoire"))
        slugs.push("accessoires");

      const ids = [...new Set(slugs)]
        .map((s) => categoriesBySlug.get(s))
        .filter((x): x is string => typeof x === "string");
      if (ids.length > 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: { categories: { set: ids.map((id) => ({ id })) } },
        });
      }
    }
  }

  const defaultZones = [
    {
      name: "Abidjan — Cocody / Riviera",
      slug: "abidjan-cocody",
      feeXof: 2000,
      sortOrder: 10,
    },
    {
      name: "Abidjan — autres communes",
      slug: "abidjan-autres",
      feeXof: 3500,
      sortOrder: 20,
    },
    {
      name: "Hors Abidjan (Côte d’Ivoire)",
      slug: "hors-abidjan-ci",
      feeXof: 8000,
      sortOrder: 30,
    },
  ];
  for (const z of defaultZones) {
    await prisma.deliveryZone.upsert({
      where: { slug: z.slug },
      create: { ...z, isActive: true },
      update: {
        name: z.name,
        feeXof: z.feeXof,
        sortOrder: z.sortOrder,
      },
    });
  }

  console.log(`Seeded ${products.length} products.`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
