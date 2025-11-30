import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { produce } from 'immer';
import { Toaster, toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, PlusCircle, LogIn, Save, LogOut } from 'lucide-react';
import { api } from '@/lib/api-client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { errorReporter } from '@/lib/errorReporter';
const AUTH_TOKEN_KEY = 'sazonlink-admin-token';
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const CATEGORIES = ["especial", "platoDelDia", "extras", "jugos"];
const CATEGORY_TITLES: Record<string, string> = {
  especial: "Especiales",
  platoDelDia: "Platos del Día",
  extras: "Extras",
  jugos: "Jugos",
};
interface MenuItem {
  id: string;
  name:string;
  price: number;
  description?: string;
}
type MenuData = {
  days: Record<string, Record<string, MenuItem[]>>;
};
function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { token } = await api<{ token: string }>('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      onLogin(token);
      toast.success('Login successful!');
    } catch (error) {
      errorReporter.report({
        error,
        source: 'AdminLogin',
        message: 'Login failed. Please check your password.',
        level: 'error',
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-sm shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl font-display text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                <LogIn className="mr-2 h-4 w-4" /> {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fetchMenu = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api<MenuData>('/api/menu');
      const fullMenu: MenuData = { days: {} };
      for (const day of DAYS) {
        fullMenu.days[day] = {};
        for (const cat of CATEGORIES) {
          fullMenu.days[day][cat] = data?.days?.[day]?.[cat] || [];
        }
      }
      setMenu(fullMenu);
    } catch (error) {
      errorReporter.report({
        error,
        source: 'AdminFetchMenu',
        message: 'Failed to load menu data.',
        level: 'error',
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);
  const handleItemChange = (day: string, category: string, itemIndex: number, field: keyof MenuItem, value: string | number) => {
    if (!menu) return;
    const nextState = produce(menu, draft => {
      const item = draft.days[day][category][itemIndex];
      if (field === 'price') {
        item[field] = Number(value) || 0;
      } else {
        (item[field] as string) = String(value);
      }
    });
    setMenu(nextState);
  };
  const addItem = (day: string, category: string) => {
    if (!menu) return;
    const nextState = produce(menu, draft => {
      draft.days[day][category].push({ id: crypto.randomUUID(), name: '', price: 0, description: '' });
    });
    setMenu(nextState);
  };
  const removeItem = (day: string, category: string, itemIndex: number) => {
    if (!menu) return;
    const nextState = produce(menu, draft => {
      draft.days[day][category].splice(itemIndex, 1);
    });
    setMenu(nextState);
  };
  const handleSaveChanges = async () => {
    if (!menu) return;
    // Validation
    for (const day of DAYS) {
      for (const category of CATEGORIES) {
        for (const item of menu.days[day][category]) {
          if (!item.name.trim() || item.price <= 0) {
            toast.warning(`Invalid item in ${day}, ${CATEGORY_TITLES[category]}`, {
              description: 'All items must have a name and a price greater than 0.',
            });
            return;
          }
        }
      }
    }
    setIsSaving(true);
    try {
      await api('/api/menu', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(menu),
      });
      toast.success('Menu saved successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error && error.message.includes('401')
        ? 'Failed to save menu. Your session may have expired.'
        : 'An unexpected error occurred while saving.';
      errorReporter.report({
        error,
        source: 'AdminSaveMenu',
        message: errorMessage,
        level: 'error',
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-1/3" />
          <div className="flex gap-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-10 w-24" /></div>
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <div className="space-y-4">
          {CATEGORIES.map(cat => (
            <div key={cat} className="border rounded-lg p-4 space-y-4">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-display font-bold">Menu Dashboard</h1>
          <div className="flex items-center gap-4">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
        <Tabs defaultValue={DAYS[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            {DAYS.map(day => <TabsTrigger key={day} value={day}>{day}</TabsTrigger>)}
          </TabsList>
          {DAYS.map(day => (
            <TabsContent key={day} value={day} className="mt-6">
              <Accordion type="multiple" defaultValue={CATEGORIES} className="w-full space-y-4">
                {CATEGORIES.map(category => (
                  <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <AccordionItem value={category} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-xl font-semibold">{CATEGORY_TITLES[category]}</AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-4">
                          {menu?.days[day]?.[category]?.map((item, index) => (
                            <Card key={item.id} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
                                <Input
                                  placeholder="Item Name"
                                  value={item.name}
                                  onChange={e => handleItemChange(day, category, index, 'name', e.target.value)}
                                  className="md:col-span-3"
                                />
                                <Input
                                  placeholder="Description"
                                  value={item.description || ''}
                                  onChange={e => handleItemChange(day, category, index, 'description', e.target.value)}
                                  className="md:col-span-3"
                                />
                                <Input
                                  type="number"
                                  placeholder="Price"
                                  value={item.price}
                                  onChange={e => handleItemChange(day, category, index, 'price', e.target.value)}
                                  className="md:col-span-1"
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeItem(day, category, index)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                          <Button variant="outline" onClick={() => addItem(day, category)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Item to {CATEGORY_TITLES[category]}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
export function AdminPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const handleLogin = (newToken: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    setToken(newToken);
  };
  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    toast.info('You have been logged out.');
  };
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      {token ? <AdminDashboard token={token} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />}
      <Toaster richColors closeButton />
    </>
  );
}