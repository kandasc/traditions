import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { GUEST_CART_COOKIE, mergeGuestCartIntoUser } from "@/lib/cart";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "Non connecté" }, { status: 401 });
  }

  const guestToken = (await cookies()).get(GUEST_CART_COOKIE)?.value ?? null;
  await mergeGuestCartIntoUser(userId, guestToken);

  return Response.json({ ok: true });
}
