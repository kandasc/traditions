"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import slugify from "slugify";

function parseImageLines(raw: string): { url: string; alt: string | null }[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf("\t");
      if (tab === -1) return { url: line, alt: null };
      return {
        url: line.slice(0, tab).trim(),
        alt: line.slice(tab + 1).trim() || null,
      };
    })
    .filter((x) => x.url.length > 0);
}

function parseVariantLines(raw: string) {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: {
    sizeLabel: string | null;
    colorHex: string | null;
    imageUrl: string | null;
  }[] = [];
  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    let sizeLabel = parts[0] || null;
    let colorHex = parts[1] || null;
    const imageUrl = parts[2] || null;
    if (colorHex && !colorHex.startsWith("#")) colorHex = `#${colorHex}`;
    if (sizeLabel === "") sizeLabel = null;
    out.push({ sizeLabel, colorHex, imageUrl });
  }
  return out;
}

function normalizeHex(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
  if (/^[0-9A-Fa-f]{6}$/.test(s)) return `#${s}`;
  return null;
}

function parseImagesJson(raw: string): { url: string; alt: string | null }[] {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const out: { url: string; alt: string | null }[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const url = String(rec.url ?? "").trim();
      if (!url) continue;
      const altRaw = rec.alt;
      const alt =
        typeof altRaw === "string" && altRaw.trim() ? altRaw.trim() : null;
      out.push({ url, alt });
    }
    return out;
  } catch {
    return [];
  }
}

function parseVariantsJson(raw: string) {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const out: {
      sizeLabel: string | null;
      colorHex: string | null;
      imageUrl: string | null;
    }[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const sizeLabel = String(rec.sizeLabel ?? "").trim() || null;
      const colorHex = normalizeHex(
        typeof rec.colorHex === "string" ? rec.colorHex : null,
      );
      const imageUrl = String(rec.imageUrl ?? "").trim() || null;
      if (!sizeLabel && !colorHex && !imageUrl) continue;
      out.push({ sizeLabel, colorHex, imageUrl });
    }
    return out;
  } catch {
    return [];
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  const featured = formData.get("featured") === "on";
  const categoryIdsJson = String(formData.get("categoryIdsJson") ?? "").trim();
  const priceXofRaw = String(formData.get("priceXof") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const imagesJson = String(formData.get("imagesJson") ?? "").trim();
  const variantsJson = String(formData.get("variantsJson") ?? "").trim();
  const imageBlock = String(formData.get("imageUrls") ?? "");
  const variantBlock = String(formData.get("variants") ?? "");

  if (!name) throw new Error("Name is required");

  const slug =
    slugify(slugRaw || name, { lower: true, strict: true }) ||
    `produit-${id}`;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new Error("Not found");

  if (slug !== existing.slug) {
    const conflict = await prisma.product.findUnique({ where: { slug } });
    if (conflict) throw new Error("Slug already exists");
  }

  const priceXof = priceXofRaw ? Number(priceXofRaw) : null;
  const images = imagesJson
    ? parseImagesJson(imagesJson)
    : parseImageLines(imageBlock);
  const variantRows = variantsJson
    ? parseVariantsJson(variantsJson)
    : parseVariantLines(variantBlock);

  const categoryIds = (() => {
    if (!categoryIdsJson) return [] as string[];
    try {
      const v = JSON.parse(categoryIdsJson) as unknown;
      if (!Array.isArray(v)) return [];
      return v
        .map((x) => String(x ?? "").trim())
        .filter((x) => x.length > 0);
    } catch {
      return [];
    }
  })();

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.productVariant.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        isActive,
        featured,
        priceXof: Number.isFinite(priceXof as number) ? priceXof : null,
        description: description || null,
        details: details || null,
        categories: {
          set: categoryIds.map((cid) => ({ id: cid })),
        },
      },
    }),
  ]);

  if (images.length > 0) {
    await prisma.productImage.createMany({
      data: images.map((im, idx) => ({
        productId: id,
        url: im.url,
        alt: im.alt,
        sortOrder: idx,
      })),
    });
  }

  if (variantRows.length > 0) {
    await prisma.productVariant.createMany({
      data: variantRows.map((v) => ({
        productId: id,
        sizeLabel: v.sizeLabel,
        colorHex: v.colorHex,
        imageUrl: v.imageUrl,
        isActive: true,
      })),
    });
  }

  redirect(`/admin/products/${id}`);
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  redirect("/admin/products");
}
