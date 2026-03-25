import { prisma } from "@/lib/db";

export async function resolveActiveDeliveryZone(zoneId: string | undefined | null) {
  const id = zoneId?.toString().trim();
  if (!id) return { error: "Choisissez une zone de livraison." as const };
  const zone = await prisma.deliveryZone.findFirst({
    where: { id, isActive: true },
  });
  if (!zone) {
    return { error: "Zone de livraison invalide ou inactive." as const };
  }
  return { zone };
}

export function normalizeCustomerPhone(raw: string | undefined | null) {
  const s = raw?.toString().trim() ?? "";
  return s.replace(/\s+/g, " ");
}

export function normalizeCustomerAddress(raw: string | undefined | null) {
  return raw?.toString().trim() ?? "";
}

export function validateCheckoutShipping(
  phone: string,
  address: string,
): { error: string } | { ok: true } {
  if (phone.length < 8) {
    return { error: "Numéro de téléphone trop court." };
  }
  if (address.length < 8) {
    return { error: "Adresse de livraison trop courte." };
  }
  return { ok: true };
}
