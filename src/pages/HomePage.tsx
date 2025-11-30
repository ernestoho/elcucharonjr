import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MenuTabs, MenuCategory } from '@/components/MenuTabs';
import { OrderSummary, GuarnicionSelection } from '@/components/OrderSummary';
import { openWhatsApp, Order } from '@/lib/whatsapp';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { errorReporter } from '@/lib/errorReporter';
const FALLBACK_MENU_DATA: Record<string, MenuCategory> = {
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
const GUARNICION_OPTIONS = {
    arroz: [
        { id: "arrozMaiz", name: "Arroz con Maíz", price: 0 },
        { id: "arrozBlanco", name: "Arroz Blanco", price: 0 },
    ],
    crema: [
        { id: "habichuelasNegras", name: "Habichuelas Negras", price: 0 },
        { id: "habichuelasRojas", name: "Habichuelas Rojas", price: 0 },
        { id: "guandules", name: "Guandules", price: 0 },
    ],
    ensalada: [
        { id: "ensaladaVerde", name: "Ensalada Verde", price: 0 },
        { id: "ensaladaPasta", name: "Ensalada de Pasta", price: 0 },
        { id: "ensaladaVegetales", name: "Ensalada de Vegetales", price: 0 },
        { id: "ensaladaTipile", name: "Ensalada Tipile", price: 0 },
    ]
};
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
function getDefaultDay(): string {
  const today = new Date().getDay(); // Sunday = 0, Monday = 1, etc.
  if (today >= 1 && today <= 6) {
    return DAYS[today - 1];
  }
  return DAYS[0]; // Default to Monday
}
const INITIAL_GUARNICION_STATE: GuarnicionSelection = { arroz: null, crema: null, ensalada: null };
export function HomePage() {
  // Guard against React module loading issues
  if (typeof React === 'undefined') {
    return <div>Loading...</div>;
  }
  const [fullMenu, setFullMenu] = useState<{ days: Record<string, Record<string, MenuCategory>> } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getDefaultDay);
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [guarnicion, setGuarnicion] = useState<GuarnicionSelection>(INITIAL_GUARNICION_STATE);
  useEffect(() => {
    async function fetchMenu() {
      try {
        setIsLoading(true);
        const menuData = await api<{ days: Record<string, Record<string, MenuCategory>> }>('/api/menu');
        if (menuData && menuData.days && Object.keys(menuData.days).length > 0) {
          setFullMenu(menuData);
        } else {
          toast.warning('Menú no disponible, usando datos de respaldo.');
        }
      } catch (error) {
        const message = 'Error al cargar el menú, usando datos de respaldo.';
        toast.error(message);
        errorReporter.report({ message, error, source: 'HomePageFetch' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchMenu();
  }, []);
  const menuToUse = useMemo(() => {
    return fullMenu?.days?.[selectedDay] ?? FALLBACK_MENU_DATA;
  }, [fullMenu, selectedDay]);
  const allMenuItems = useMemo(() => Object.values(menuToUse).flatMap(cat => cat.items), [menuToUse]);
  const menuItemsMap = useMemo(() => new Map(allMenuItems.map(item => [item.id, item])), [allMenuItems]);
  const handleQuantityChange = useCallback((itemId: string, newQuantity: number) => {
    setOrderQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
  }, []);
  const handleGuarnicionChange = useCallback((update: Partial<GuarnicionSelection>) => {
    setGuarnicion(prev => ({ ...prev, ...update }));
  }, []);
  const handleClearOrder = useCallback(() => {
    setOrderQuantities({});
    setGuarnicion(INITIAL_GUARNICION_STATE);
    toast.info("Tu pedido ha sido limpiado.");
  }, []);
  const order = useMemo((): Order => {
    const newOrder: Order = { items: [], guarniciones: [], extras: [], juices: [], total: 0 };
    let total = 0;
    for (const [itemId, quantity] of Object.entries(orderQuantities)) {
      if (quantity > 0) {
        const item = menuItemsMap.get(itemId);
        if (item) { // Null check to prevent crash
          total += item.price * quantity;
          const orderItem = { ...item, quantity };
          if (menuToUse.extras?.items.some(i => i.id === itemId)) {
            newOrder.extras.push(orderItem);
          } else if (menuToUse.jugos?.items.some(i => i.id === itemId)) {
            newOrder.juices.push(orderItem);
          } else {
            newOrder.items.push(orderItem);
          }
        }
      }
    }
    if (guarnicion.arroz) newOrder.guarniciones?.push({ id: 'guarn-arroz', name: `Arroz: ${guarnicion.arroz}`, price: 0, quantity: 1 });
    if (guarnicion.crema) newOrder.guarniciones?.push({ id: 'guarn-crema', name: `Crema/Grano: ${guarnicion.crema}`, price: 0, quantity: 1 });
    if (guarnicion.ensalada) newOrder.guarniciones?.push({ id: 'guarn-ensalada', name: `Ensalada: ${guarnicion.ensalada}`, price: 0, quantity: 1 });
    newOrder.total = total;
    return newOrder;
  }, [orderQuantities, guarnicion, menuItemsMap, menuToUse]);
  const handleSendOrder = () => {
    if (order.items.length > 0 && (!guarnicion.arroz || !guarnicion.crema || !guarnicion.ensalada)) {
        toast.error("Por favor, selecciona tus 3 guarniciones.", {
          description: "Elige un arroz, una crema/grano y una ensalada para tu plato."
        });
        return;
    }
    openWhatsApp(order, { day: selectedDay });
  };
  const renderLoadingSkeleton = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start">
          <div className="md:col-span-2 lg:col-span-3 space-y-8">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
          <div className="hidden md:block md:col-span-1 lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <header className="relative text-center py-20 md:py-32 lg:py-40 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[rgb(243,128,32)]/20 via-transparent to-[rgb(88,52,181)]/20"
          style={{
            maskImage: 'radial-gradient(ellipse at center, white 20%, transparent 70%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <img
              src="https://ik.imagekit.io/l46c6n0qda/elcucharon-restaurant.png"
              alt="El Cucharon JR Logo"
              className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-4 shadow-lg"
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground"
          >
            El Cucharon JR
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
        {isLoading ? renderLoadingSkeleton() : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8 md:py-10 lg:py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start">
                <div className="md:col-span-2 lg:col-span-3">
                  <MenuTabs
                    days={DAYS}
                    selectedDay={selectedDay}
                    onDayChange={setSelectedDay}
                    menu={menuToUse}
                    orderQuantities={orderQuantities}
                    onQuantityChange={handleQuantityChange}
                  />
                </div>
                <div className="hidden md:block md:col-span-1 lg:col-span-1">
                  <OrderSummary
                    order={order}
                    guarnicion={guarnicion}
                    onGuarnicionChange={handleGuarnicionChange}
                    guarnicionOptions={GUARNICION_OPTIONS}
                    onClearOrder={handleClearOrder}
                    onSendOrder={handleSendOrder}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Mobile Order Summary */}
      <div className="md:hidden">
        <OrderSummary
          order={order}
          guarnicion={guarnicion}
          onGuarnicionChange={handleGuarnicionChange}
          guarnicionOptions={GUARNICION_OPTIONS}
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