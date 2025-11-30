import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Image } from "lucide-react";
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
}
export function MenuTabs({
  days,
  selectedDay,
  onDayChange,
  menu,
  orderQuantities,
  onQuantityChange,
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
function getMenuItemImageUrl(name: string): string {
  const baseUrl = "https://placehold.co/200x150/F38020/FFFFFF?font=roboto&text=";
  const lowerName = name.toLowerCase();
  if (lowerName.includes("sancocho") || lowerName.includes("mondongo")) return `${baseUrl}Sancocho`;
  if (lowerName.includes("pati mongó")) return `${baseUrl}Pati+Mongó`;
  if (lowerName.includes("pollo")) return `${baseUrl}Pollo`;
  if (lowerName.includes("cerdo")) return `${baseUrl}Cerdo`;
  if (lowerName.includes("bistec") || lowerName.includes("res")) return `${baseUrl}Bistec/Res`;
  if (lowerName.includes("pechuga") || lowerName.includes("pechurina")) return `${baseUrl}Pechuga`;
  if (lowerName.includes("tostones")) return `${baseUrl}Tostones`;
  if (lowerName.includes("arepita")) return `${baseUrl}Arepita`;
  if (lowerName.includes("batata")) return `${baseUrl}Batata`;
  if (lowerName.includes("cereza")) return `${baseUrl}Cereza`;
  if (lowerName.includes("limón")) return `${baseUrl}Limón`;
  if (lowerName.includes("chinola")) return `${baseUrl}Chinola`;
  if (lowerName.includes("tamarindo")) return `${baseUrl}Tamarindo`;
  return `${baseUrl}${encodeURIComponent(name.split(' ')[0])}`;
}
function MenuItemCard({ item, quantity, onQuantityChange }: MenuItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const handleIncrement = () => onQuantityChange(Math.min(10, quantity + 1));
  const handleDecrement = () => onQuantityChange(Math.max(0, quantity - 1));
  return (
    <Card className="transition-all duration-200 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
      {imageError ? (
            <div className="w-full h-32 bg-muted flex items-center justify-center">
            <Image className="w-12 h-12 text-muted-foreground" />
        </div>
      ) : (
        <img
          src={getMenuItemImageUrl(item.name)}
          alt={`Imagen de ${item.name}`}
          loading="lazy"
          className="w-full h-32 object-cover"
          onError={() => setImageError(true)}
        />
      )}
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{item.name}</CardTitle>
          {item.description && <CardDescription>{item.description}</CardDescription>}
        </div>
        <div className="text-lg font-bold text-foreground shrink-0 ml-2">
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