// TODO: replace with the real WhatsApp number (digits only, country code, no +/spaces).
export const STORE_WHATSAPP_NUMBER = "94700000000";

export function buildWhatsAppLink(bankTitle: string): string {
  const message = `Hi, I'm interested in "${bankTitle}" on StudyPal.`;
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
