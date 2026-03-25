import { prisma } from "@/lib/db";
import {
  getCartPayload,
  resolveCart,
  setGuestCartCookie,
} from "@/lib/cart";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    productId?: string;
    variantId?: string | null;
    quantity?: number;
  };

  const productId = body.productId?.toString();
  const quantity = Math.max(1, Number(body.quantity ?? 1) || 1);
  const variantId =
    body.variantId === undefined || body.variantId === ""
      ? null
      : (body.variantId as string);

  if (!productId) {
    return Response.json({ error: "productId requis" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: { where: { isActive: true } } },
  });
  if (!product?.isActive || product.priceXof == null) {
    return Response.json({ error: "Produit indisponible" }, { status: 400 });
  }

  if (variantId) {
    const v = product.variants.find((x) => x.id === variantId);
    if (!v) {
      return Response.json({ error: "Variante invalide" }, { status: 400 });
    }
  } else if (product.variants.length > 0) {
    return Response.json(
      { error: "Choisissez une variante (taille / couleur)" },
      { status: 400 },
    );
  }

  const { cartId, createdGuestToken } = await resolveCart();
  if (createdGuestToken) {
    await setGuestCartCookie(createdGuestToken);
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId, variantId },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId, productId, variantId, quantity },
    });
  }

  const payload = await getCartPayload();
  return Response.json({
    ok: true,
    itemCount: payload.itemCount,
    subtotalXof: payload.subtotalXof,
  });
}
