import { prisma } from "@/lib/db";

export async function GET() {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, feeXof: true },
  });
  return Response.json({ zones });
}
