"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "customer");

  if (!email.includes("@")) throw new Error("Email invalide");
  if (password.length < 8) throw new Error("Mot de passe trop court");
  if (role !== "admin" && role !== "customer") throw new Error("Rôle invalide");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email déjà utilisé");

  await prisma.user.create({
    data: {
      email,
      name,
      role,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUser(userId: string) {
  const adminId = await requireAdmin();
  if (userId === adminId) throw new Error("Impossible de supprimer votre propre compte");

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}
