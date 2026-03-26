import { put } from "@vercel/blob";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return Response.json(
      {
        error:
          "Téléversement désactivé : ajoutez BLOB_READ_WRITE_TOKEN (Vercel Blob) ou saisissez une URL d’image.",
        code: "BLOB_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Fichier manquant" }, { status: 400 });
  }

  const maxBytes = 12 * 1024 * 1024;
  if (file.size > maxBytes) {
    return Response.json({ error: "Fichier trop volumineux (max 12 Mo)" }, { status: 400 });
  }

  const allowed = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ]);
  if (file.type && !allowed.has(file.type)) {
    return Response.json(
      { error: "Type non supporté (JPEG, PNG, WebP, GIF, AVIF)" },
      { status: 400 },
    );
  }

  const productId = String(form.get("productId") ?? "")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .trim();
  const categoryId = String(form.get("categoryId") ?? "")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .trim();
  const bucket = categoryId
    ? `categories/${categoryId}`
    : productId
      ? `products/${productId}`
      : "misc";
  const orig = file.name.replace(/[^a-zA-Z0-9._-]/g, "") || "image";
  const ext = orig.includes(".") ? orig.slice(orig.lastIndexOf(".") + 1).slice(0, 8) : "jpg";
  const pathname = `traditions/admin/${bucket}/${nanoid(10)}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    token,
  });

  return Response.json({ url: blob.url });
}
