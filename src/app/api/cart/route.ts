import { getCartPayload, setGuestCartCookie } from "@/lib/cart";

export async function GET() {
  const { cart, createdGuestToken, itemCount, subtotalXof } =
    await getCartPayload();
  if (createdGuestToken) {
    await setGuestCartCookie(createdGuestToken);
  }
  return Response.json({
    cart,
    itemCount,
    subtotalXof,
  });
}
