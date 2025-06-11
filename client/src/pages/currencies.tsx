import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Pencil, Trash2, RefreshCw, Calendar, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

const CurrencyFormSchema = z.object({
  code: z.string().min(1, "Код обов'язковий").max(3, "Код не може бути більше 3 символів"),
  name: z.string().min(1, "Назва обов'язкова"),
  symbol: z.string().min(1, "Символ обов'язковий"),
  decimalPlaces: z.number().int().min(0).max(6),
  isBase: z.boolean(),
  isActive: z.boolean(),
});

type CurrencyFormData = z.infer<typeof CurrencyFormSchema>;

export default function Currencies() {
  const [activeTab, setActiveTab] = useState("currencies");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [updateTime, setUpdateTime] = useState("10:00");
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CurrencyFormData>({
    resolver: zodResolver(CurrencyFormSchema),
    defaultValues: {
      code: "",
      name: "",
      symbol: "",
      decimalPlaces: 2,
      isBase: false,
      isActive: true,
    },
  });

  const { data: currencies = [], isLoading } = useQuery<CurrencyWithLatestRate[]>({
    queryKey: ["/api/currencies"],
  });

  const { data: rates = [], isLoading: ratesLoading } = useQuery<CurrencyRate[]>({
    queryKey: ["/api/currency-rates"],
  });

  const { data: settings } = useQuery<CurrencySettings>({
    queryKey: ["/api/currency-settings"],
  });

  const filteredCurrencies = currencies.filter((currency) =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatExchangeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Chart data preparation
  const chartData = (() => {
    if (!settings || !rates.length) return [];
    
    const filteredRates = rates.filter(rate => 
      settings.enabledCurrencies?.includes(rate.currencyCode)
    );
    
    const groupedByDate = filteredRates.reduce((acc, rate) => {
      const date = rate.exchangeDate;
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][rate.currencyCode] = parseFloat(rate.rate);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByDate)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
  })();

  const currencyColors = {
    USD: '#3b82f6',
    EUR: '#10b981', 
    GBP: '#f59e0b',
    PLN: '#ef4444',
    CHF: '#8b5cf6',
    JPY: '#f97316',
    CAD: '#06b6d4',
    AUD: '#84cc16'
  };

  const createCurrencyMutation = useMutation({
    mutationFn: async (data: CurrencyFormData) => {
      await apiRequest("/api/currencies", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Валюту створено успішно",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CurrencyFormData }) => {
      await apiRequest(`/api/currencies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsDialogOpen(false);
      setEditingCurrency(null);
      form.reset();
      toast({
        title: "Успіх",
        description: "Валюту оновлено успішно",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCurrencyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/currencies/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Валюту видалено успішно",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRatesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/nbu/update-current-rates", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      toast({
        title: "Успіх",
        description: "Курси валют оновлено успішно",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: {
      autoUpdateEnabled: boolean;
      updateTime: string;
      enabledCurrencies: string[];
    }) => {
      await apiRequest("/api/currency-settings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-settings"] });
      toast({
        title: "Успіх",
        description: "Налаштування збережено успішно",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (settings) {
      setAutoUpdateEnabled(settings.autoUpdateEnabled);
      setUpdateTime(settings.updateTime);
      setEnabledCurrencies(settings.enabledCurrencies || []);
    }
  }, [settings]);

  const handleCreateCurrency = () => {
    setEditingCurrency(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    form.reset({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      isBase: currency.isBase,
      isActive: currency.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteCurrency = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цю валюту?")) {
      deleteCurrencyMutation.mutate(id);
    }
  };

  const onSubmit = (data: CurrencyFormData) => {
    if (editingCurrency) {
      updateCurrencyMutation.mutate({ id: editingCurrency.id, data });
    } else {
      createCurrencyMutation.mutate(data);
    }
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      autoUpdateEnabled,
      updateTime,
      enabledCurrencies,
    });
  };

  const handleCurrencyToggle = (currencyCode: string, enabled: boolean) => {
    if (enabled) {
      setEnabledCurrencies(prev => [...prev, currencyCode]);
    } else {
      setEnabledCurrencies(prev => prev.filter(c => c !== currencyCode));
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Валюти</h1>
        <Button onClick={handleCreateCurrency} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Додати валюту
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="currencies">Валюти</TabsTrigger>
          <TabsTrigger value="nbu">Курси НБУ</TabsTrigger>
          <TabsTrigger value="settings">Налаштування</TabsTrigger>
        </TabsList>

        <TabsContent value="currencies" className="flex-1 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук валют..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Card className="flex-1">
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код</TableHead>
                    <TableHead>Назва</TableHead>
                    <TableHead>Символ</TableHead>
                    <TableHead>Знаків після коми</TableHead>
                    <TableHead className="text-center">Базова</TableHead>
                    <TableHead className="text-center">Активна</TableHead>
                    <TableHead className="text-center">Останній курс</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCurrencies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "Валют не знайдено" : "Валют немає"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCurrencies.map((currency) => (
                      <TableRow key={currency.id}>
                        <TableCell className="font-medium">{currency.code}</TableCell>
                        <TableCell>{currency.name}</TableCell>
                        <TableCell className="font-mono">{currency.symbol}</TableCell>
                        <TableCell className="text-center">{currency.decimalPlaces}</TableCell>
                        <TableCell className="text-center">
                          {currency.isBase ? (
                            <Badge variant="default">Так</Badge>
                          ) : (
                            <span className="text-muted-foreground">Ні</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {currency.isActive ? (
                            <Badge variant="secondary">Активна</Badge>
                          ) : (
                            <Badge variant="outline">Неактивна</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {currency.latestRate ? (
                            <div className="text-sm">
                              <div className="font-mono">{parseFloat(currency.latestRate).toFixed(4)}</div>
                              {currency.rateDate && (
                                <div className="text-xs text-muted-foreground">
                                  {formatExchangeDate(currency.rateDate)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Немає даних</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCurrency(currency)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCurrency(currency.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="nbu" className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Оновлення курсів
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => updateRatesMutation.mutate()}
                  disabled={updateRatesMutation.isPending}
                  className="w-full"
                >
                  {updateRatesMutation.isPending ? "Оновлення..." : "Оновити курси НБУ"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Статистика
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Всього курсів:</span>
                    <span className="font-medium">{rates.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Останнє оновлення:</span>
                    <span className="font-medium">
                      {rates[0]?.exchangeDate ? formatExchangeDate(rates[0].exchangeDate) : "Немає даних"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Динаміка зміни курсів відносно гривні</CardTitle>
            </CardHeader>
            <CardContent>
              {ratesLoading ? (
                <div className="text-center py-8">Завантаження даних для графіка...</div>
              ) : chartData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Немає даних для відображення графіка
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => `Дата: ${formatExchangeDate(value as string)}`}
                        formatter={(value: number, name: string) => [value?.toFixed(4), name]}
                      />
                      <Legend />
                      {enabledCurrencies.map(currency => (
                        <Line
                          key={currency}
                          type="monotone"
                          dataKey={currency}
                          stroke={currencyColors[currency as keyof typeof currencyColors] || '#8884d8'}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          connectNulls={false}
                          name={currency}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Курси валют НБУ</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {rates.length} курсів
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {ratesLoading ? (
                <div className="text-center py-8">Завантаження курсів...</div>
              ) : rates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Курси валют недоступні
                </div>
              ) : (
                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата курсу</TableHead>
                        <TableHead>Валюта</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates
                        .filter(rate => enabledCurrencies.includes(rate.currencyCode))
                        .map((rate) => (
                          <TableRow key={rate.id} className="text-sm">
                            <TableCell className="text-sm">{formatExchangeDate(rate.exchangeDate)}</TableCell>
                            <TableCell className="font-medium text-sm">
                              <div className="flex items-center justify-between">
                                <span>{rate.currencyCode}</span>
                                <span className="font-mono">{parseFloat(rate.rate).toFixed(4)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{rate.txt}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Налаштування автоматичного оновлення</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-update"
                  checked={autoUpdateEnabled}
                  onCheckedChange={setAutoUpdateEnabled}
                />
                <Label htmlFor="auto-update">Автоматичне оновлення курсів</Label>
              </div>

              {autoUpdateEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-time">Час оновлення</Label>
                    <Input
                      id="update-time"
                      type="time"
                      value={updateTime}
                      onChange={(e) => setUpdateTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Валюти для оновлення</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["USD", "EUR", "GBP", "PLN", "CHF", "JPY", "CAD", "AUD"].map(currency => (
                        <div key={currency} className="flex items-center space-x-2">
                          <Checkbox
                            id={currency}
                            checked={enabledCurrencies.includes(currency)}
                            onCheckedChange={(checked) => handleCurrencyToggle(currency, checked as boolean)}
                          />
                          <Label htmlFor={currency}>{currency}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending ? "Збереження..." : "Зберегти налаштування"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {settings?.lastUpdateDate && (
            <Card>
              <CardHeader>
                <CardTitle>Інформація про останнє оновлення</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Дата:</span>
                    <span>{formatExchangeDate(settings.lastUpdateDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Статус:</span>
                    <Badge variant={settings.lastUpdateStatus === "success" ? "default" : "destructive"}>
                      {settings.lastUpdateStatus === "success" ? "Успішно" : "Помилка"}
                    </Badge>
                  </div>
                  {settings.lastUpdateError && (
                    <div className="mt-2">
                      <span className="text-sm text-destructive">{settings.lastUpdateError}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCurrency ? "Редагувати валюту" : "Створити валюту"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Код валюти</FormLabel>
                    <FormControl>
                      <Input placeholder="USD" {...field} maxLength={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва</FormLabel>
                    <FormControl>
                      <Input placeholder="Долар США" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Символ</FormLabel>
                    <FormControl>
                      <Input placeholder="$" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="decimalPlaces"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Знаків після коми</FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть кількість знаків" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex space-x-4">
                <FormField
                  control={form.control}
                  name="isBase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Базова валюта</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Активна</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button
                  type="submit"
                  disabled={createCurrencyMutation.isPending || updateCurrencyMutation.isPending}
                >
                  {createCurrencyMutation.isPending || updateCurrencyMutation.isPending
                    ? "Збереження..."
                    : editingCurrency
                    ? "Оновити"
                    : "Створити"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}