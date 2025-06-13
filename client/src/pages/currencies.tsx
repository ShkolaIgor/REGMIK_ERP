import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatUkrainianDate, formatUkrainianDateTime } from "@/lib/date-utils";
import { DateOnly, DateTime } from "@/components/ui/date-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Settings,
  Download,
  Upload,
} from "lucide-react";



interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBase: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CurrencyWithLatestRate extends Currency {
  latestRate?: string;
  rateDate?: string;
}

interface CurrencyRate {
  id: number;
  currencyCode: string;
  rate: string;
  exchangeDate: string;
  txt: string;
  cc: string;
  r030: number;
  createdAt: string;
  updatedAt: string;
}

interface CurrencySettings {
  id: number;
  autoUpdateEnabled: boolean;
  updateTime: string;
  lastUpdateDate: string | null;
  lastUpdateStatus: string;
  lastUpdateError: string | null;
  enabledCurrencies: string[];
}

const currencySchema = z.object({
  code: z.string().min(3).max(3),
  name: z.string().min(1),
  symbol: z.string().min(1),
  decimalPlaces: z.number().min(0).max(8),
  isBase: z.boolean(),
  isActive: z.boolean(),
});

const rateSchema = z.object({
  rate: z.string().min(1),
  exchangeDate: z.string().min(1),
});

const settingsSchema = z.object({
  autoUpdateEnabled: z.boolean(),
  updateTime: z.string().min(1),
  enabledCurrencies: z.array(z.string()),
});

export default function Currencies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  // Queries
  const { data: currencies = [], isLoading: currenciesLoading, error: currenciesError } = useQuery<CurrencyWithLatestRate[]>({
    queryKey: ["/api/currencies"]
  });

  const { data: rates = [], isLoading: ratesLoading, error: ratesError } = useQuery<CurrencyRate[]>({
    queryKey: ["/api/currency-rates"]
  });

  const { data: settings, error: settingsError } = useQuery<CurrencySettings>({
    queryKey: ["/api/currency-settings"]
  });

  // Handle errors
  useEffect(() => {
    if (currenciesError) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити валюти",
        variant: "destructive"
      });
    }
  }, [currenciesError, toast]);

  useEffect(() => {
    if (ratesError) {
      toast({
        title: "Помилка", 
        description: "Не вдалося завантажити курси",
        variant: "destructive"
      });
    }
  }, [ratesError, toast]);

  useEffect(() => {
    if (settingsError) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити налаштування",
        variant: "destructive"
      });
    }
  }, [settingsError, toast]);

  // Forms
  const currencyForm = useForm<z.infer<typeof currencySchema>>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      code: "",
      name: "",
      symbol: "",
      decimalPlaces: 2,
      isBase: false,
      isActive: true,
    },
  });

  const rateForm = useForm<z.infer<typeof rateSchema>>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      rate: "",
      exchangeDate: new Date().toISOString().split('T')[0],
    },
  });

  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      autoUpdateEnabled: false,
      updateTime: "09:00",
      enabledCurrencies: [],
    },
  });

  // Update settings form when data loads
  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        autoUpdateEnabled: settings.autoUpdateEnabled,
        updateTime: settings.updateTime,
        enabledCurrencies: settings.enabledCurrencies,
      });
    }
  }, [settings, settingsForm]);

  // Mutations
  const createCurrency = useMutation({
    mutationFn: (data: z.infer<typeof currencySchema>) =>
      apiRequest("/api/currencies", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsCurrencyDialogOpen(false);
      currencyForm.reset();
      toast({
        title: "Успіх",
        description: "Валюту створено",
      });
    },
  });

  const updateCurrency = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & z.infer<typeof currencySchema>) =>
      apiRequest(`/api/currencies/${id}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsCurrencyDialogOpen(false);
      setEditingCurrency(null);
      currencyForm.reset();
      toast({
        title: "Успіх",
        description: "Валюту оновлено",
      });
    },
  });

  const deleteCurrency = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/currencies/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Валюту видалено",
      });
    },
  });

  const addRate = useMutation({
    mutationFn: (data: { currencyCode: string; rate: string; exchangeDate: string }) =>
      apiRequest("/api/currency-rates", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsRateDialogOpen(false);
      rateForm.reset();
      toast({
        title: "Успіх",
        description: "Курс додано",
      });
    },
  });

  const updateSettings = useMutation({
    mutationFn: (data: z.infer<typeof settingsSchema>) =>
      apiRequest("/api/currency-settings", {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-settings"] });
      setIsSettingsDialogOpen(false);
      toast({
        title: "Успіх",
        description: "Налаштування збережено",
      });
    },
  });

  const updateRates = useMutation({
    mutationFn: () =>
      apiRequest("/api/currency-rates/update", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/currency-settings"] });
      toast({
        title: "Успіх",
        description: "Курси оновлено",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    currencyForm.reset({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      isBase: currency.isBase,
      isActive: currency.isActive,
    });
    setIsCurrencyDialogOpen(true);
  };

  const handleAddRate = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsRateDialogOpen(true);
  };

  const onCurrencySubmit = (data: z.infer<typeof currencySchema>) => {
    if (editingCurrency) {
      updateCurrency.mutate({ id: editingCurrency.id, ...data });
    } else {
      createCurrency.mutate(data);
    }
  };

  const onRateSubmit = (data: z.infer<typeof rateSchema>) => {
    if (!selectedCurrency) return;
    addRate.mutate({
      currencyCode: selectedCurrency.code,
      rate: data.rate,
      exchangeDate: data.exchangeDate,
    });
  };

  const onSettingsSubmit = (data: z.infer<typeof settingsSchema>) => {
    updateSettings.mutate(data);
  };

  const getLatestRatesForCurrency = (currencyCode: string) => {
    return rates
      .filter(rate => rate.currencyCode === currencyCode)
      .sort((a, b) => new Date(b.exchangeDate).getTime() - new Date(a.exchangeDate).getTime())
      .slice(0, 5);
  };

  if (currenciesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Завантаження валют...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Управління валютами</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => updateRates.mutate()}
            disabled={updateRates.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${updateRates.isPending ? 'animate-spin' : ''}`} />
            Оновити курси
          </Button>
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Налаштування
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Налаштування валют</DialogTitle>
                <DialogDescription>
                  Налаштуйте автоматичне оновлення курсів валют
                </DialogDescription>
              </DialogHeader>
              {settings && (
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
                    <FormField
                      control={settingsForm.control}
                      name="autoUpdateEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Автоматичне оновлення</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Автоматично оновлювати курси валют
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingsForm.control}
                      name="updateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Час оновлення</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="text-sm text-muted-foreground">
                      <p>Останнє оновлення: {formatUkrainianDateTime(settings.lastUpdateDate)}</p>
                      <p>Статус: {settings.lastUpdateStatus}</p>
                      {settings.lastUpdateError && (
                        <p className="text-red-500">Помилка: {settings.lastUpdateError}</p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={updateSettings.isPending}>
                        Зберегти
                      </Button>
                      <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                        Скасувати
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={isCurrencyDialogOpen} onOpenChange={setIsCurrencyDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Додати валюту
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCurrency ? "Редагувати валюту" : "Додати валюту"}
                </DialogTitle>
                <DialogDescription>
                  Введіть дані про валюту
                </DialogDescription>
              </DialogHeader>
              <Form {...currencyForm}>
                <form onSubmit={currencyForm.handleSubmit(onCurrencySubmit)} className="space-y-4">
                  <FormField
                    control={currencyForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Код валюти</FormLabel>
                        <FormControl>
                          <Input placeholder="USD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={currencyForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Назва валюти</FormLabel>
                        <FormControl>
                          <Input placeholder="Долар США" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={currencyForm.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Символ валюти</FormLabel>
                        <FormControl>
                          <Input placeholder="$" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={currencyForm.control}
                    name="decimalPlaces"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Кількість десяткових знаків</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="8" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={currencyForm.control}
                    name="isBase"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Базова валюта</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Ця валюта буде використовуватися як базова для розрахунків
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={currencyForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Активна валюта</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Активні валюти відображаються в списку
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createCurrency.isPending || updateCurrency.isPending}>
                      {editingCurrency ? "Оновити" : "Створити"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsCurrencyDialogOpen(false);
                      setEditingCurrency(null);
                      currencyForm.reset();
                    }}>
                      Скасувати
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="currencies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="currencies">Валюти</TabsTrigger>
          <TabsTrigger value="rates">Курси валют</TabsTrigger>
        </TabsList>

        <TabsContent value="currencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Список валют</CardTitle>
              <CardDescription>
                Управління валютами системи
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код</TableHead>
                    <TableHead>Назва</TableHead>
                    <TableHead>Символ</TableHead>
                    <TableHead>Поточний курс</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Створено</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow key={currency.id}>
                      <TableCell className="font-medium">{currency.code}</TableCell>
                      <TableCell>{currency.name}</TableCell>
                      <TableCell>{currency.symbol}</TableCell>
                      <TableCell>
                        {currency.latestRate ? (
                          <div className="flex items-center gap-2">
                            <span>{parseFloat(currency.latestRate).toFixed(currency.decimalPlaces)}</span>
                            {currency.rateDate && (
                              <span className="text-xs text-muted-foreground">
                                ({formatUkrainianDate(currency.rateDate)})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Немає даних</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {currency.isBase && <Badge variant="secondary">Базова</Badge>}
                          {currency.isActive ? (
                            <Badge variant="default">Активна</Badge>
                          ) : (
                            <Badge variant="outline">Неактивна</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatUkrainianDate(currency.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCurrency(currency)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddRate(currency)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCurrency.mutate(currency.id)}
                            disabled={currency.isBase}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Історія курсів валют</CardTitle>
              <CardDescription>
                Перегляд історичних даних про курси валют
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ratesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Завантаження курсів...
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currencies.filter(c => c.isActive).map((currency) => {
                    const currencyRates = getLatestRatesForCurrency(currency.code);
                    
                    let startDate: Date;
                    let endDate: Date;
                    let trend: 'up' | 'down' | 'stable' = 'stable';
                    
                    if (currencyRates.length >= 2) {
                      const latestRate = parseFloat(currencyRates[0].rate);
                      const previousRate = parseFloat(currencyRates[1].rate);
                      
                      if (latestRate > previousRate) {
                        trend = 'up';
                      } else if (latestRate < previousRate) {
                        trend = 'down';
                      }
                    }

                    return (
                      <Card key={currency.code}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {currency.code} - {currency.name}
                            </CardTitle>
                            {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                            {trend === 'stable' && <DollarSign className="h-4 w-4 text-blue-500" />}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {currencyRates.length > 0 ? (
                            <div className="space-y-2">
                              {currencyRates.map((rate) => (
                                <div key={rate.id} className="flex justify-between items-center text-sm">
                                  <span>{formatUkrainianDate(rate.exchangeDate)}</span>
                                  <span className="font-medium">
                                    {parseFloat(rate.rate).toFixed(currency.decimalPlaces)}
                                  </span>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => handleAddRate(currency)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Додати курс
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-muted-foreground mb-2">Немає курсів</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddRate(currency)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Додати курс
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Exchange Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Додати курс для {selectedCurrency?.name}
            </DialogTitle>
            <DialogDescription>
              Введіть новий курс валюти
            </DialogDescription>
          </DialogHeader>
          <Form {...rateForm}>
            <form onSubmit={rateForm.handleSubmit(onRateSubmit)} className="space-y-4">
              <FormField
                control={rateForm.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Курс</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="41.5000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rateForm.control}
                name="exchangeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата курсу</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={addRate.isPending}>
                  Додати курс
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsRateDialogOpen(false);
                  setSelectedCurrency(null);
                  rateForm.reset();
                }}>
                  Скасувати
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}