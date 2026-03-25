import { prisma } from "@/lib/db";
import { getCartPayload, resolveCart, setGuestCartCookie } from "@/lib/cart";

type Ctx = { params: Promise<{ itemId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { itemId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { quantity?: number };
  const quantity = Math.max(0, Number(body.quantity ?? 0) || 0);

  const { cartId, createdGuestToken } = await resolveCart();
  if (createdGuestToken) await setGuestCartCookie(createdGuestToken);

  const line = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId },
  });
  if (!line) {
    return Response.json({ error: "Ligne introuvable" }, { status: 404 });
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  const payload = await getCartPayload();
  return Response.json({
    ok: true,
    itemCount: payload.itemCount,
    subtotalXof: payload.subtotalXof,
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { itemId } = await ctx.params;
  const { cartId, createdGuestToken } = await resolveCart();
  if (createdGuestToken) await setGuestCartCookie(createdGuestToken);

  const line = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId },
  });
  if (!line) {
    return Response.json({ error: "Ligne introuvable" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  const payload = await getCartPayload();
  return Response.json({
    ok: true,
    itemCount: payload.itemCount,
    subtotalXof: payload.subtotalXof,
  });
}
