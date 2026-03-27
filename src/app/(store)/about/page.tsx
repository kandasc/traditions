import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AboutPage() {
  // Keep legacy route, redirect to new "La Maison" page.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = await prisma.page.findUnique({ where: { slug: "about" } });
  redirect("/maison");
}

