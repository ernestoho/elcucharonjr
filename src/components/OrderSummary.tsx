import { motion } from "framer-motion";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Order } from "@/lib/whatsapp";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MenuItem } from "./MenuTabs";
export type GuarnicionSelection = {
  arroz: string | null;
  crema: string | null;
  ensalada: string | null;
};
interface OrderSummaryProps {
  order: Order;
  guarnicion: GuarnicionSelection;
  onGuarnicionChange: (update: Partial<GuarnicionSelection>) => void;
  guarnicionOptions: {
    arroz: MenuItem[];
    crema: MenuItem[];
    ensalada: MenuItem[];
  };
  onClearOrder: () => void;
  onSendOrder: () => void;
}
const formatCurrency = (amount: number) => `RD$ ${amount.toLocaleString('en-US')}`;
function OrderContent({ order, guarnicion, onGuarnicionChange, guarnicionOptions, onClearOrder, onSendOrder }: OrderSummaryProps) {
  const hasItems = order.total > 0;
  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tu Pedido</span>
          {hasItems && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClearOrder}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Limpiar pedido</span>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-4">
        {hasItems ? (
          <div className="space-y-4 text-sm">
            {order.items.length > 0 && (
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-4 pt-2">
                <p className="font-medium">Guarniciones</p>
                <div className="space-y-1.5">
                    <Label htmlFor="arroz-select">Arroz</Label>
                    <Select value={guarnicion.arroz ?? ""} onValueChange={(value) => onGuarnicionChange({ arroz: value || null })}>
                        <SelectTrigger id="arroz-select"><SelectValue placeholder="Elige un arroz" /></SelectTrigger>
                        <SelectContent><SelectGroup><SelectLabel>Arroces</SelectLabel>{guarnicionOptions.arroz.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}</SelectGroup></SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="crema-select">Cremas y Granos</Label>
                    <Select value={guarnicion.crema ?? ""} onValueChange={(value) => onGuarnicionChange({ crema: value || null })}>
                        <SelectTrigger id="crema-select"><SelectValue placeholder="Elige crema o granos" /></SelectTrigger>
                        <SelectContent><SelectGroup><SelectLabel>Opciones</SelectLabel>{guarnicionOptions.crema.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}</SelectGroup></SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="ensalada-select">Ensalada</Label>
                    <Select value={guarnicion.ensalada ?? ""} onValueChange={(value) => onGuarnicionChange({ ensalada: value || null })}>
                        <SelectTrigger id="ensalada-select"><SelectValue placeholder="Elige una ensalada" /></SelectTrigger>
                        <SelectContent><SelectGroup><SelectLabel>Ensaladas</SelectLabel>{guarnicionOptions.ensalada.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}</SelectGroup></SelectContent>
                    </Select>
                </div>
            </div>
            {order.extras.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="font-medium">Extras:</p>
                {order.extras.map(item => (
                  <div key={item.id} className="flex justify-between pl-2">
                    <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
            {order.juices.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="font-medium">Jugos:</p>
                {order.juices.map(item => (
                  <div key={item.id} className="flex justify-between pl-2">
                    <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <ShoppingCart className="mx-auto h-12 w-12" />
            <p className="mt-4">Tu carrito está vacío.</p>
            <p className="text-xs">Agrega productos del menú para comenzar.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4 pt-4">
        <Separator />
        <div className="flex w-full justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
        <Button
          size="lg"
          className="w-full bg-[rgb(243,128,32)] text-white hover:bg-[#e06e15] shadow-primary transition-all hover:-translate-y-0.5"
          disabled={!hasItems}
          onClick={onSendOrder}
        >
          Pedir por WhatsApp
        </Button>
      </CardFooter>
    </>
  );
}
export function OrderSummary(props: OrderSummaryProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const handleSendOrder = () => {
    props.onSendOrder();
    setIsOpen(false);
  };
  if (isMobile) {
    const hasItems = props.order.total > 0;
    if (!hasItems) return null;
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="lg"
              className="w-full h-16 rounded-2xl bg-[rgb(243,128,32)] text-white hover:bg-[#e06e15] shadow-xl flex justify-between items-center text-lg"
            >
              <span>Ver Pedido</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{formatCurrency(props.order.total)}</span>
                <ShoppingCart className="h-5 w-5" />
              </div>
            </Button>
          </SheetTrigger>
        </motion.div>
        <SheetContent side="bottom" className="rounded-t-2xl flex flex-col h-[85vh]">
          <SheetHeader>
            <SheetTitle>Tu Pedido</SheetTitle>
            <SheetDescription>
              Revisa tu pedido y selecciona tus guarniciones antes de enviar.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <OrderContent {...props} onSendOrder={handleSendOrder} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-24"
    >
      <Card className="shadow-soft flex flex-col max-h-[calc(100vh-8rem)]">
        <OrderContent {...props} />
      </Card>
    </motion.div>
  );
}