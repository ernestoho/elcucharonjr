import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MenuTabs, MenuItem, MenuCategory } from '@/components/MenuTabs';
import { OrderSummary } from '@/components/OrderSummary';
import { openWhatsApp, Order } from '@/lib/whatsapp';
const MENU_DATA: Record<string, MenuCategory> = {
  especial: {
    title: "ESPECIAL",
    items: [
      { id: "sancocho", name: "Sancocho de 3 Carnes", price: 375 },
      { id: "mondongo", name: "Mondongo a la Criolla", price: 375 },
      { id: "patimongo", name: "Pati Mongó y Compañía", price: 350 },
    ],
  },
  platoDelDia: {
    title: "PLATO DEL DÍA",
    items: [
      { id: "cerdoGuisado", name: "Cerdo Guisado Criollo", price: 250 },
      { id: "bistec", name: "Bistec Encebollado", price: 275 },
      { id: "resGuisada", name: "Res Guisada Tradicional", price: 250 },
      { id: "polloGuisado", name: "Pollo Guisado Casero", price: 250 },
      { id: "polloFrito", name: "Pollo Frito Crocante", price: 250 },
      { id: "polloHorno", name: "Pollo al Horno Doradito", price: 250 },
      { id: "pechurina", name: "Pechurina Empanizada", price: 250 },
      { id: "pechugaPlancha", name: "Pechuga a la Plancha", price: 400 },
      { id: "pechugaSalteada", name: "Pechuga Salteada Vegetales", price: 400 },
      { id: "pechugaCrema", name: "Pechuga a la Crema", price: 400 },
    ],
  },
  extras: {
    title: "EXTRAS",
    items: [
      { id: "tostones", name: "Tostones", price: 100 },
      { id: "arepitaMaiz", name: "Arepita Maíz", price: 25 },
      { id: "arepitaYuca", name: "Arepita Yuca", price: 25 },
      { id: "batataFrita", name: "Batata Frita", price: 100 },
    ],
  },
  jugos: {
    title: "JUGOS",
    items: [
      { id: "cereza", name: "Cereza", price: 100 },
      { id: "limon", name: "Limón", price: 100 },
      { id: "chinola", name: "Chinola", price: 100 },
      { id: "tamarindo", name: "Tamarindo", price: 100 },
    ],
  },
};
const GUARNICIONES: MenuItem[] = [
    { id: "arrozMaiz", name: "Arroz con Maíz", price: 0 },
    { id: "arrozBlanco", name: "Arroz Blanco", price: 0 },
    { id: "habichuelasNegras", name: "Habichuelas Negras", price: 0 },
    { id: "habichuelasRojas", name: "Habichuelas Rojas", price: 0 },
    { id: "guandules", name: "Guandules", price: 0 },
    { id: "ensaladaVerde", name: "Ensalada Verde", price: 0 },
    { id: "ensaladaPasta", name: "Ensalada de Pasta", price: 0 },
    { id: "ensaladaVegetales", name: "Ensalada de Vegetales", price: 0 },
    { id: "ensaladaTipile", name: "Ensalada Tipile", price: 0 },
];
const ALL_MENU_ITEMS = Object.values(MENU_DATA).flatMap(cat => cat.items).concat(GUARNICIONES);
const MENU_ITEMS_MAP = new Map(ALL_MENU_ITEMS.map(item => [item.id, item]));
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
function getDefaultDay(): string {
  const today = new Date().getDay(); // Sunday = 0, Monday = 1, etc.
  if (today >= 1 && today <= 6) {
    return DAYS[today - 1];
  }
  return DAYS[0]; // Default to Monday
}
export function HomePage() {
  const [selectedDay, setSelectedDay] = useState(getDefaultDay);
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [guarnicion, setGuarnicion] = useState<string | null>(null);
  const handleQuantityChange = useCallback((itemId: string, newQuantity: number) => {
    setOrderQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
  }, []);
  const handleClearOrder = useCallback(() => {
    setOrderQuantities({});
    setGuarnicion(null);
    toast.info("Tu pedido ha sido limpiado.");
  }, []);
  const order = useMemo((): Order => {
    const order: Order = { items: [], extras: [], juices: [], guarnicion, total: 0 };
    let total = 0;
    for (const [itemId, quantity] of Object.entries(orderQuantities)) {
      if (quantity > 0) {
        const item = MENU_ITEMS_MAP.get(itemId);
        if (item) {
          const itemTotal = item.price * quantity;
          total += itemTotal;
          const orderItem = { ...item, quantity };
          if (MENU_DATA.extras.items.some(i => i.id === itemId)) {
            order.extras.push(orderItem);
          } else if (MENU_DATA.jugos.items.some(i => i.id === itemId)) {
            order.juices.push(orderItem);
          } else {
            order.items.push(orderItem);
          }
        }
      }
    }
    order.total = total;
    return order;
  }, [orderQuantities, guarnicion]);
  const handleSendOrder = () => {
    if (order.items.length > 0 && !guarnicion) {
        toast.error("Por favor, selecciona una guarnición.");
        return;
    }
    openWhatsApp(order, { day: selectedDay });
  };
  useEffect(() => {
    // Reset order when day changes, if desired
    // setOrderQuantities({});
    // setGuarnicion(null);
  }, [selectedDay]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4" />
      <header className="relative text-center py-20 md:py-32 lg:py-40 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[rgb(243,128,32)]/20 via-transparent to-[rgb(88,52,181)]/20"
          style={{
            maskImage: 'radial-gradient(ellipse at center, white 20%, transparent 70%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground"
          >
            SazónLink
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            El menú diario de tu restaurante favorito. Ordena fácil y rápido por WhatsApp.
          </motion.p>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start">
              <div className="md:col-span-2 lg:col-span-3">
                <MenuTabs
                  days={DAYS}
                  selectedDay={selectedDay}
                  onDayChange={setSelectedDay}
                  menu={MENU_DATA}
                  orderQuantities={orderQuantities}
                  onQuantityChange={handleQuantityChange}
                  guarnicion={guarnicion}
                  onGuarnicionChange={setGuarnicion}
                  guarniciones={GUARNICIONES}
                />
              </div>
              <div className="hidden md:block md:col-span-1 lg:col-span-1">
                <OrderSummary
                  order={order}
                  onClearOrder={handleClearOrder}
                  onSendOrder={handleSendOrder}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Mobile Order Summary */}
      <div className="md:hidden">
        <OrderSummary
          order={order}
          onClearOrder={handleClearOrder}
          onSendOrder={handleSendOrder}
        />
      </div>
      <footer className="py-8 text-center text-muted-foreground/80">
        <p>Built with ❤️ at Cloudflare</p>
      </footer>
      <Toaster richColors closeButton />
    </div>
  );
}