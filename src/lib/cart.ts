import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

export const GUEST_CART_COOKIE = "traditions_cart_guest";

function guestCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  };
}

export async function setGuestCartCookie(token: string) {
  (await cookies()).set(GUEST_CART_COOKIE, token, guestCookieOptions());
}

export async function clearGuestCartCookie() {
  (await cookies()).delete(GUEST_CART_COOKIE);
}

export async function resolveCart() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_CART_COOKIE)?.value ?? null;

  if (userId) {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    return { cartId: cart.id, userId, guestToken, createdGuestToken: null as string | null };
  }

  if (guestToken) {
    const existing = await prisma.cart.findUnique({
      where: { guestToken },
    });
    if (existing) {
      return {
        cartId: existing.id,
        userId: undefined,
        guestToken,
        createdGuestToken: null as string | null,
      };
    }
  }

  const newToken = nanoid(32);
  const cart = await prisma.cart.create({ data: { guestToken: newToken } });
  return {
    cartId: cart.id,
    userId: undefined,
    guestToken: newToken,
    createdGuestToken: newToken,
  };
}

export async function getCartPayload() {
  const { cartId, createdGuestToken } = await resolveCart();
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
          variant: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!cart) return { cart: null, createdGuestToken, itemCount: 0, subtotalXof: 0 };

  let subtotalXof = 0;
  const items = [];
  for (const line of cart.items) {
    if (!line.product?.isActive || line.product.priceXof == null) continue;
    if (
      line.variantId &&
      line.variant?.stock != null &&
      line.variant.stock <= 0 &&
      !line.variant.isPreorder
    )
      continue;
    const lineTotal = line.product.priceXof * line.quantity;
    subtotalXof += lineTotal;
    items.push({
      id: line.id,
      quantity: line.quantity,
      productId: line.productId,
      variantId: line.variantId,
      name: line.product.name,
      slug: line.product.slug,
      unitPriceXof: line.product.priceXof,
      imageUrl: line.product.images[0]?.url ?? null,
      sizeLabel: line.variant?.sizeLabel ?? null,
      colorHex: line.variant?.colorHex ?? null,
      isPreorder: line.variant?.isPreorder ?? false,
    });
  }

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  return { cart: { id: cart.id, items }, createdGuestToken, itemCount, subtotalXof };
}

export type CartCheckoutLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  unitPriceXof: number;
  metaJson: string;
};

export async function getValidatedCartLinesForCheckout(): Promise<{
  cartId: string;
  lines: CartCheckoutLine[];
  subtotalXof: number;
  userId?: string;
  guestToken: string | null;
} | null> {
  const { cartId, userId, guestToken } = await resolveCart();
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { product: true, variant: true },
      },
    },
  });
  if (!cart || cart.items.length === 0) return null;

  const lines: CartCheckoutLine[] = [];
  let subtotalXof = 0;

  for (const line of cart.items) {
    const p = line.product;
    if (!p || !p.isActive || p.priceXof == null) continue;
    if (line.variantId) {
      const v = line.variant;
      if (!v || v.productId !== p.id || !v.isActive) continue;
      if (!v.isPreorder && v.stock != null && v.stock <= 0) continue;
    }
    const qty = Math.max(1, line.quantity);
    const unit = p.priceXof;
    subtotalXof += unit * qty;
    const meta = {
      variantId: line.variantId,
      sizeLabel: line.variant?.sizeLabel ?? null,
      colorHex: line.variant?.colorHex ?? null,
      isPreorder: line.variant?.isPreorder ?? false,
    };
    lines.push({
      productId: p.id,
      variantId: line.variantId,
      quantity: qty,
      name: p.name,
      unitPriceXof: unit,
      metaJson: JSON.stringify(meta),
    });
  }

  if (lines.length === 0) return null;
  return { cartId, lines, subtotalXof, userId, guestToken };
}

export async function emptyCartById(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
}

export async function mergeGuestCartIntoUser(userId: string, guestToken: string | null) {
  if (!guestToken) return;
  const guestCart = await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) {
    await clearGuestCartCookie();
    return;
  }

  let target = await prisma.cart.findUnique({ where: { userId } });
  if (!target) {
    target = await prisma.cart.create({ data: { userId } });
  }

  for (const g of guestCart.items) {
    const match = await prisma.cartItem.findFirst({
      where: {
        cartId: target.id,
        productId: g.productId,
        variantId: g.variantId,
      },
    });
    if (match) {
      await prisma.cartItem.update({
        where: { id: match.id },
        data: { quantity: match.quantity + g.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: target.id,
          productId: g.productId,
          variantId: g.variantId,
          quantity: g.quantity,
        },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  await clearGuestCartCookie();
}
