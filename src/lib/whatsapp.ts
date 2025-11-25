import { toast } from "sonner";
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
export interface Order {
  items: OrderItem[];
  guarniciones?: OrderItem[];
  extras: OrderItem[];
  juices: OrderItem[];
  total: number;
}
export interface OrderMeta {
  day: string;
}
const PHONE_NUMBER = "18097898010"; // Dominican Republic country code 1 + area code 809
/**
 * Builds a formatted, human-readable WhatsApp message from an order object.
 * @param order The customer's order.
 * @param meta Additional metadata like the day of the week.
 * @returns A formatted string ready for WhatsApp.
 *
 * Example:
 * *Pedido El Cucharon JR - Lunes*
 * --------------------
 * *Platos:*
 * - 1x Cerdo Guisado Criollo
 * --------------------
 * *Guarniciones:*
 * - Arroz: Arroz con Maíz
 * - Crema: Habichuelas Rojas
 * --------------------
 * *Extras:*
 * - 2x Tostones
 * --------------------
 * *Total: RD$ 550*
 * (Pedido generado: 2024-08-12 14:30)
 */
export function buildWhatsAppMessage(order: Order, meta: OrderMeta): string {
  const parts: string[] = [];
  parts.push(`*Pedido El Cucharon JR - ${meta.day}*`);
  parts.push("--------------------");
  if (order.items.length > 0) {
    parts.push("*Platos:*");
    order.items.forEach(item => {
      parts.push(`- ${item.quantity}x ${item.name}`);
    });
    parts.push("--------------------");
  }
  if (order.guarniciones && order.guarniciones.length > 0) {
    parts.push("*Guarniciones:*");
    order.guarniciones.forEach(item => {
      parts.push(`- ${item.name}`);
    });
    parts.push("--------------------");
  }
  if (order.extras.length > 0) {
    parts.push("*Extras:*");
    order.extras.forEach(item => {
      parts.push(`- ${item.quantity}x ${item.name}`);
    });
    parts.push("--------------------");
  }
  if (order.juices.length > 0) {
    parts.push("*Jugos:*");
    order.juices.forEach(item => {
      parts.push(`- ${item.quantity}x ${item.name}`);
    });
    parts.push("--------------------");
  }
  parts.push(`*Total: RD$ ${order.total.toLocaleString("en-US")}*`);
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  parts.push(`(Pedido generado: ${timestamp})`);
  return parts.join("\n");
}
/**
 * Opens a WhatsApp chat with a pre-filled message.
 * @param order The customer's order.
 * @param meta Additional metadata.
 * @param phone The international phone number (default is pre-configured).
 */
export function openWhatsApp(order: Order, meta: OrderMeta, phone: string = PHONE_NUMBER): void {
  if (order.total === 0) {
    toast.error("Tu carrito está vacío.", {
      description: "Agrega algunos productos antes de hacer el pedido.",
    });
    return;
  }
  const message = buildWhatsAppMessage(order, meta);
  const encodedMessage = encodeURIComponent(message);
  // Truncate message if it's too long for some devices, though this is a generous limit.
  if (encodedMessage.length > 1800) {
    toast.warning("Tu pedido es muy grande para enviarlo de una vez.", {
      description: "Por favor, considera hacer dos pedidos separados.",
    });
    return;
  }
  const url = `https://wa.me/${phone}?text=${encodedMessage}`;
  window.open(url, "_blank", "noopener,noreferrer");
}