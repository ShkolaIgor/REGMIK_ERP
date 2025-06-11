import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Star, Trash2, Search, RefreshCw, Calendar, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

export default function Currencies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("currencies");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  const [currencyForm, setCurrencyForm] = useState({
    code: "",
    name: "",
    symbol: "",
    decimalPlaces: 2,
    isBase: false,
    isActive: true
  });

  // НБУ states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [updateTime, setUpdateTime] = useState("09:00");
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [enabledCurrencies, setEnabledCurrencies] = useState(["USD", "EUR"]);
  const [searchDate, setSearchDate] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currencies = [], isLoading } = useQuery<CurrencyWithLatestRate[]>({
    queryKey: ["/api/currencies"],
  });

  // НБУ queries
  const { data: nbuRates = [], isLoading: ratesLoading } = useQuery<CurrencyRate[]>({
    queryKey: ["/api/currency-rates"],
  });

  const { data: nbuSettings } = useQuery<CurrencySettings>({
    queryKey: ["/api/currency-settings"],
  });

  // Currency mutations
  const createCurrencyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/currencies", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsDialogOpen(false);
      resetCurrencyForm();
      toast({
        title: "Успіх",
        description: "Валюту створено",
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
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/currencies/${data.id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsDialogOpen(false);
      resetCurrencyForm();
      setEditingCurrency(null);
      toast({
        title: "Успіх",
        description: "Валюту оновлено",
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
      return await apiRequest(`/api/currencies/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Валюту видалено",
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

  const setBaseCurrencyMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/currencies/${id}/set-base`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Базову валюту встановлено",
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

  // NBU mutations
  const updateCurrentRatesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/nbu/update-current-rates", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      toast({
        title: "Успіх",
        description: "Поточні курси оновлено",
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

  const updatePeriodRatesMutation = useMutation({
    mutationFn: async (data: { startDate: string; endDate: string }) => {
      return await apiRequest("/api/nbu/update-period-rates", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      toast({
        title: "Успіх",
        description: "Курси за період оновлено",
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

  const saveNbuSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/currency-settings", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-settings"] });
      toast({
        title: "Успіх",
        description: "Налаштування збережено",
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

  const clearRatesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/nbu/clear-rates", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      toast({
        title: "Успіх",
        description: "Курси очищено",
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

  const resetCurrencyForm = () => {
    setCurrencyForm({
      code: "",
      name: "",
      symbol: "",
      decimalPlaces: 2,
      isBase: false,
      isActive: true
    });
  };

  const handleSubmitCurrency = () => {
    if (editingCurrency) {
      updateCurrencyMutation.mutate({ ...currencyForm, id: editingCurrency.id });
    } else {
      createCurrencyMutation.mutate(currencyForm);
    }
  };

  const handleEditCurrency = (currency: Currency) => {
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      isBase: currency.isBase,
      isActive: currency.isActive
    });
    setEditingCurrency(currency);
    setIsDialogOpen(true);
  };

  const handleUpdatePeriodRates = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Помилка",
        description: "Оберіть дати початку та кінця періоду",
        variant: "destructive",
      });
      return;
    }

    updatePeriodRatesMutation.mutate({ startDate, endDate });
  };

  const handleSaveNbuSettings = () => {
    saveNbuSettingsMutation.mutate({
      autoUpdateEnabled,
      updateTime,
      enabledCurrencies,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Успішно</Badge>;
      case "error":
        return <Badge variant="destructive">Помилка</Badge>;
      case "pending":
        return <Badge variant="secondary">Очікування</Badge>;
      default:
        return <Badge variant="outline">Невідомо</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy HH:mm", { locale: uk });
    } catch {
      return dateString;
    }
  };

  const formatExchangeDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy", { locale: uk });
    } catch {
      return dateString;
    }
  };

  const filteredCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const baseCurrency = currencies.find(c => c.isBase);

  // Підготовка даних для графіка
  const chartData = React.useMemo(() => {
    if (!nbuRates.length) return [];
    
    // Групуємо курси по датах
    const ratesByDate = nbuRates.reduce((acc, rate) => {
      const date = rate.exchangeDate;
      if (!acc[date]) {
        acc[date] = { date: formatExchangeDate(date) };
      }
      acc[date][rate.currencyCode] = parseFloat(rate.rate);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(ratesByDate).sort((a, b) => 
      new Date(a.date.split('.').reverse().join('-')).getTime() - 
      new Date(b.date.split('.').reverse().join('-')).getTime()
    );
  }, [nbuRates]);

  const currencies_for_chart = Array.from(new Set(nbuRates.map(r => r.currencyCode)));

  return (
    <div className="h-screen flex flex-col p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold mb-2">Валюти</h1>
          <p className="text-muted-foreground">Управління валютами та курсами обміну</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetCurrencyForm();
                setEditingCurrency(null);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Додати валюту
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCurrency ? "Редагування валюти" : "Нова валюта"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Код валюти</Label>
                  <Input
                    id="code"
                    placeholder="USD, EUR, UAH"
                    value={currencyForm.code}
                    onChange={(e) => setCurrencyForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    maxLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol">Символ</Label>
                  <Input
                    id="symbol"
                    placeholder="$, €, ₴"
                    value={currencyForm.symbol}
                    onChange={(e) => setCurrencyForm(prev => ({ ...prev, symbol: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Назва валюти</Label>
                <Input
                  id="name"
                  placeholder="Долар США, Євро, Гривня"
                  value={currencyForm.name}
                  onChange={(e) => setCurrencyForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="decimalPlaces">Десяткові знаки</Label>
                  <Input
                    id="decimalPlaces"
                    type="number"
                    min="0"
                    max="10"
                    value={currencyForm.decimalPlaces}
                    onChange={(e) => setCurrencyForm(prev => ({ ...prev, decimalPlaces: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={currencyForm.isActive}
                      onCheckedChange={(checked) => setCurrencyForm(prev => ({ ...prev, isActive: checked }))}
                    />
                    <span>{currencyForm.isActive ? "Активна" : "Неактивна"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={handleSubmitCurrency}
                  disabled={createCurrencyMutation.isPending || updateCurrencyMutation.isPending}
                >
                  {editingCurrency ? "Оновити" : "Створити"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Скасувати
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Base Currency Card */}
      {baseCurrency && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Базова валюта системи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">{baseCurrency.symbol || baseCurrency.code}</div>
              <div>
                <div className="font-semibold">{baseCurrency.name}</div>
                <div className="text-sm text-muted-foreground">{baseCurrency.code}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="currencies">Валюти</TabsTrigger>
            <TabsTrigger value="nbu">Курси НБУ</TabsTrigger>
            <TabsTrigger value="settings">Налаштування</TabsTrigger>
          </TabsList>

          <TabsContent value="currencies" className="flex-1 flex flex-col overflow-hidden p-0 mt-0 space-y-0">
            <div className="flex items-center space-x-2 flex-shrink-0 p-4 pb-0">
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

            <Card className="flex-1 overflow-hidden mx-4 mb-4">
              <div className="h-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Код</TableHead>
                      <TableHead>Назва</TableHead>
                      <TableHead>Символ</TableHead>
                      <TableHead>Поточний курс</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Завантаження...
                        </TableCell>
                      </TableRow>
                    ) : filteredCurrencies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Валюти не знайдено
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCurrencies.map((currency) => (
                        <TableRow key={currency.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {currency.code}
                              {currency.isBase && <Star className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </TableCell>
                          <TableCell>{currency.name}</TableCell>
                          <TableCell>{currency.symbol || "-"}</TableCell>
                          <TableCell>
                            {currency.isBase ? (
                              <Badge variant="outline">Базова</Badge>
                            ) : (() => {
                              // Шукаємо поточний курс з таблиці currency_rates
                              const currentRate = nbuRates.find(rate => rate.currencyCode === currency.code);
                              return currentRate ? (
                                <div>
                                  <div className="font-medium">{parseFloat(currentRate.rate).toFixed(4)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(currentRate.exchangeDate).toLocaleDateString()}
                                  </div>
                                </div>
                              ) : (
                                <Badge variant="secondary">Немає курсу</Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Badge variant={currency.isActive ? "default" : "secondary"}>
                                {currency.isActive ? "Активна" : "Неактивна"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCurrency(currency)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!currency.isBase && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setBaseCurrencyMutation.mutate(currency.id)}
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              {!currency.isBase && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteCurrencyMutation.mutate(currency.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
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

          <TabsContent value="nbu" className="flex-1 flex flex-col overflow-hidden p-0">
            {/* Оновлення курсів */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 flex-shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Оновлення поточних курсів
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Отримати актуальні курси валют НБУ на сьогоднішню дату
                  </p>
                  <Button 
                    onClick={() => updateCurrentRatesMutation.mutate()}
                    disabled={updateCurrentRatesMutation.isPending}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Оновити поточні курси
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Оновлення за період
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Від</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">До</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleUpdatePeriodRates}
                    disabled={updatePeriodRatesMutation.isPending}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Завантажити за період
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Графік курсів валют НБУ */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Динаміка зміни курсів відносно гривні</CardTitle>
              </CardHeader>
              <CardContent>
                {ratesLoading ? (
                  <div className="text-center py-8">Завантаження даних для графіка...</div>
                ) : chartData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Немає даних для відображення графіка. Завантажте курси НБУ.
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(label) => `Дата: ${label}`}
                          formatter={(value, name) => [`${Number(value).toFixed(4)} ₴`, name]}
                        />
                        <Legend />
                        {currencies_for_chart.map((currency, index) => {
                          const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
                          return (
                            <Line 
                              key={currency}
                              type="monotone" 
                              dataKey={currency} 
                              stroke={colors[index % colors.length]}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name={currency}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Курси НБУ */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Курси валют НБУ</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="Пошук за датою"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearRatesMutation.mutate()}
                    >
                      Очистити
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0">
                {ratesLoading ? (
                  <div className="text-center py-8">Завантаження курсів...</div>
                ) : nbuRates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Курси НБУ не завантажені. Використовуйте кнопки оновлення вище.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-auto p-2">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="text-sm">Дата курсу</TableHead>
                          <TableHead className="text-sm">Валюта</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nbuRates
                          .filter(rate => !searchDate || rate.exchangeDate === searchDate)
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

          <TabsContent value="settings" className="flex-1 flex flex-col overflow-hidden">
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
                            <Switch
                              id={currency}
                              checked={enabledCurrencies.includes(currency)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setEnabledCurrencies(prev => [...prev, currency]);
                                } else {
                                  setEnabledCurrencies(prev => prev.filter(c => c !== currency));
                                }
                              }}
                            />
                            <Label htmlFor={currency}>{currency}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleSaveNbuSettings}>
                  Зберегти налаштування
                </Button>
              </CardContent>
            </Card>

            {nbuSettings && (
              <Card>
                <CardHeader>
                  <CardTitle>Статус системи</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Останнє оновлення</Label>
                      <p className="text-sm text-muted-foreground">
                        {nbuSettings.lastUpdateDate ? formatDate(nbuSettings.lastUpdateDate) : "Ніколи"}
                      </p>
                    </div>
                    <div>
                      <Label>Статус</Label>
                      <div className="mt-1">
                        {getStatusBadge(nbuSettings.lastUpdateStatus)}
                      </div>
                    </div>
                  </div>

                  {nbuSettings.lastUpdateError && (
                    <div>
                      <Label>Остання помилка</Label>
                      <p className="text-sm text-red-600">{nbuSettings.lastUpdateError}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}