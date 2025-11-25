import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
export type MenuItem = {
  id: string;
  name: string;
  price: number;
  description?: string;
};
export type MenuCategory = {
  title: string;
  items: MenuItem[];
};
export type Menu = Record<string, MenuCategory>;
interface MenuTabsProps {
  days: string[];
  selectedDay: string;
  onDayChange: (day: string) => void;
  menu: Record<string, MenuCategory>;
  orderQuantities: Record<string, number>;
  onQuantityChange: (itemId: string, newQuantity: number) => void;
  guarnicion: string | null;
  onGuarnicionChange: (value: string) => void;
  guarniciones: MenuItem[];
}
export function MenuTabs({
  days,
  selectedDay,
  onDayChange,
  menu,
  orderQuantities,
  onQuantityChange,
  guarnicion,
  onGuarnicionChange,
  guarniciones
}: MenuTabsProps) {
  return (
    <Tabs value={selectedDay} onValueChange={onDayChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
        {days.map(day => (
          <TabsTrigger key={day} value={day}>{day}</TabsTrigger>
        ))}
      </TabsList>
      {days.map(day => (
        <TabsContent key={day} value={day} className="mt-8 space-y-8">
          {Object.entries(menu).map(([key, category]) => (
            <div key={key}>
              <h2 className="text-2xl font-semibold mb-4">{category.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={orderQuantities[item.id] || 0}
                    onQuantityChange={(newQuantity) => onQuantityChange(item.id, newQuantity)}
                  />
                ))}
              </div>
            </div>
          ))}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Guarniciones</h2>
            <p className="text-muted-foreground mb-4">Elige una guarnición para acompañar tu plato del día.</p>
            <Select onValueChange={onGuarnicionChange} value={guarnicion ?? undefined}>
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Selecciona una guarnición" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Opciones</SelectLabel>
                  {guarniciones.map(g => (
                    <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
}
function MenuItemCard({ item, quantity, onQuantityChange }: MenuItemCardProps) {
  const handleIncrement = () => onQuantityChange(Math.min(10, quantity + 1));
  const handleDecrement = () => onQuantityChange(Math.max(0, quantity - 1));
  const isCheckboxType = item.price === 0; // Heuristic for guarniciones/extras that are toggled
  if (isCheckboxType) {
    return (
        <div className="flex items-center space-x-2">
            <Checkbox id={item.id} checked={quantity > 0} onCheckedChange={(checked) => onQuantityChange(checked ? 1 : 0)} />
            <Label htmlFor={item.id} className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {item.name}
            </Label>
        </div>
    )
  }
  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{item.name}</CardTitle>
          {item.description && <CardDescription>{item.description}</CardDescription>}
        </div>
        <div className="text-lg font-bold text-foreground">
          RD$ {item.price}
        </div>
      </CardHeader>
      <CardContent className="flex justify-end items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDecrement} disabled={quantity === 0}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-lg font-medium w-8 text-center">{quantity}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleIncrement} disabled={quantity === 10}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}