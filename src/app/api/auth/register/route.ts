import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
  };

  const email = body.email?.toLowerCase().trim();
  const password = body.password ?? "";
  const name = body.name?.trim() || null;

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Email invalide" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json(
      { error: "Mot de passe : 8 caractères minimum" },
      { status: 400 },
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return Response.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "customer",
    },
  });

  return Response.json({ ok: true });
}
