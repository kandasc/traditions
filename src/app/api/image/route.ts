import crypto from "crypto";
import path from "path";
import sharp from "sharp";

export const runtime = "nodejs";
/** Large AVIF/WebP encodes can OOM on serverless; keep outputs light on Vercel. */
export const maxDuration = 60;

const ALLOWED_HOSTNAMES = new Set([
  "admin.traditions-mode.com",
  "traditions-mode.com",
  "www.traditions-mode.com",
]);

function clampInt(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getCacheDir() {
  // On Vercel serverless, disk is ephemeral and may be read-only.
  // We rely on CDN caching via Cache-Control instead.
  if (process.env.VERCEL) return null;
  return (
    process.env.IMAGE_CACHE_DIR ??
    path.join(process.cwd(), ".next", "cache", "traditions-images")
  );
}

function pickFormat(acceptHeader: string | null) {
  if (process.env.VERCEL) return "jpeg" as const;
  const a = (acceptHeader ?? "").toLowerCase();
  if (a.includes("image/avif")) return "avif" as const;
  if (a.includes("image/webp")) return "webp" as const;
  return "jpeg" as const;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const urlParam = searchParams.get("url");
  const wParam = Number(searchParams.get("w") ?? "");
  const qParam = Number(searchParams.get("q") ?? "");

  if (!urlParam) {
    return Response.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return Response.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return Response.json({ error: "Invalid protocol" }, { status: 400 });
  }
  if (!ALLOWED_HOSTNAMES.has(target.hostname)) {
    return Response.json({ error: "Hostname not allowed" }, { status: 403 });
  }

  const width = clampInt(Number.isFinite(wParam) ? wParam : 900, 120, 2000);
  const quality = clampInt(Number.isFinite(qParam) ? qParam : 72, 40, 90);
  const format = pickFormat(req.headers.get("accept"));

  const key = crypto
    .createHash("sha256")
    .update(`${target.toString()}|w=${width}|q=${quality}|f=${format}`)
    .digest("hex");

  const cacheDir = getCacheDir();
  const filePath = cacheDir ? path.join(cacheDir, `${key}.${format}`) : null;

  // Fast path: serve from disk cache when supported.
  if (cacheDir && filePath) {
    const { readFile } = await import("fs/promises");
    try {
      const buf = await readFile(filePath);
      return new Response(buf as unknown as BodyInit, {
        headers: {
          "content-type": `image/${format === "jpeg" ? "jpeg" : format}`,
          "cache-control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // cache miss
    }
  }

  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 25_000);
    let upstream: Response;
    try {
      upstream = await fetch(target, {
        headers: { "user-agent": "traditions-image-proxy/1.0" },
        signal: ac.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!upstream.ok) {
      return Response.json(
        { error: "Upstream fetch failed", status: upstream.status },
        { status: 502 },
      );
    }

    const input = Buffer.from(await upstream.arrayBuffer());
    if (input.length === 0) {
      return Response.json({ error: "Empty upstream body" }, { status: 502 });
    }

    let out: Buffer;
    try {
      const img = sharp(input, { failOn: "none" }).rotate().resize({
        width,
        withoutEnlargement: true,
      });

      out =
        format === "avif"
          ? await img.avif({ quality }).toBuffer()
          : format === "webp"
            ? await img.webp({ quality }).toBuffer()
            : await img.jpeg({ quality, mozjpeg: true }).toBuffer();
    } catch {
      // Passthrough original bytes if sharp fails (corrupt EXIF, OOM edge cases).
      const ct =
        upstream.headers.get("content-type")?.split(";")[0] || "image/jpeg";
      return new Response(new Uint8Array(input), {
        headers: {
          "content-type": ct,
          "cache-control": "public, max-age=86400",
        },
      });
    }

    // Best-effort disk caching when available (non-Vercel / persistent volume)
    if (cacheDir && filePath) {
      const { mkdir, readFile, writeFile } = await import("fs/promises");
      try {
        const cached = await readFile(filePath);
        return new Response(cached as unknown as BodyInit, {
          headers: {
            "content-type": `image/${format === "jpeg" ? "jpeg" : format}`,
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      } catch {
        // ignore
      }
      await mkdir(cacheDir, { recursive: true });
      await writeFile(filePath, out);
    }

    return new Response(new Uint8Array(out), {
      headers: {
        "content-type": `image/${format === "jpeg" ? "jpeg" : format}`,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("[api/image]", e);
    return Response.json({ error: "Image processing failed" }, { status: 500 });
  }
}

