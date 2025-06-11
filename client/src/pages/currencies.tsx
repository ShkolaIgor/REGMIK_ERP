import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Search, 
  DollarSign, 
  Edit,
  Trash2,
  TrendingUp,
  Star,
  RefreshCw,
  Calendar,
  ArrowUpDown,
  Settings,
  Download,
  Banknote
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

// Видалено ExchangeRate - використовуємо currency_rates замість exchange_rates

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
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [selectedCurrencyForRate, setSelectedCurrencyForRate] = useState<Currency | null>(null);

  const [currencyForm, setCurrencyForm] = useState({
    code: "",
    name: "",
    symbol: "",
    decimalPlaces: 2,
    isBase: false,
    isActive: true
  });

  const [rateForm, setRateForm] = useState({
    rate: ""
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

  // Видалено exchange-rates - використовуємо currency_rates

  // НБУ queries
  const { data: nbuRates = [], isLoading: ratesLoading } = useQuery<CurrencyRate[]>({
    queryKey: ["/api/currency-rates"],
  });

  const { data: nbuSettings } = useQuery<CurrencySettings>({
    queryKey: ["/api/currency-settings"],
  });

  const createCurrencyMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/currencies", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsDialogOpen(false);
      resetCurrencyForm();
      toast({
        title: "Успіх",
        description: "Валюту створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити валюту",
        variant: "destructive",
      });
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => apiRequest(`/api/currencies/${id}`, "PATCH", data),
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
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити валюту",
        variant: "destructive",
      });
    },
  });

  const deleteCurrencyMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/currencies/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Валюту видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити валюту",
        variant: "destructive",
      });
    },
  });

  const createExchangeRateMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/exchange-rates", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsRateDialogOpen(false);
      setRateForm({ rate: "" });
      setSelectedCurrencyForRate(null);
      toast({
        title: "Успіх",
        description: "Курс валют оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити курс валют",
        variant: "destructive",
      });
    },
  });

  const setBaseCurrencyMutation = useMutation({
    mutationFn: async (currencyId: number) => apiRequest(`/api/currencies/${currencyId}/set-base`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Базову валюту змінено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося змінити базову валюту",
        variant: "destructive",
      });
    },
  });

  // НБУ mutations
  const updateCurrentRatesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/currency-rates/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Помилка оновлення курсів");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Курси оновлено",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/currency-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка оновлення",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePeriodRatesMutation = useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      console.log('Starting period update for:', startDate, 'to', endDate);
      const response = await fetch("/api/currency-rates/update-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Помилка оновлення курсів за період");
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Period update success:', data);
      toast({
        title: "Курси за період оновлено",
        description: `${data.message}. Оновлено дат: ${data.updatedDates?.length || 0}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка оновлення за період",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveNbuSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<CurrencySettings>) => {
      const response = await fetch("/api/currency-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Помилка збереження налаштувань");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Налаштування збережено",
        description: "Налаштування автоматичного оновлення курсів збережено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/currency-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка збереження",
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
      updateCurrencyMutation.mutate({ id: editingCurrency.id, ...currencyForm });
    } else {
      createCurrencyMutation.mutate(currencyForm);
    }
  };

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol || "",
      decimalPlaces: currency.decimalPlaces,
      isBase: currency.isBase,
      isActive: currency.isActive
    });
    setIsDialogOpen(true);
  };

  const handleAddRate = (currency: Currency) => {
    setSelectedCurrencyForRate(currency);
    setIsRateDialogOpen(true);
  };

  const handleSubmitRate = () => {
    if (selectedCurrencyForRate) {
      createExchangeRateMutation.mutate({
        currencyId: selectedCurrencyForRate.id,
        rate: rateForm.rate
      });
    }
  };

  // НБУ handlers
  const handleUpdateCurrent = () => {
    updateCurrentRatesMutation.mutate();
  };

  const handleUpdatePeriod = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Помилка",
        description: "Вкажіть початкову та кінцеву дати",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Помилка",
        description: "Початкова дата не може бути пізніше кінцевої",
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

  return (
    <div className="h-screen flex flex-col p-2 overflow-hidden">
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold mb-1">Валюти</h1>
          <p className="text-sm text-muted-foreground">Управління валютами та курсами обміну</p>
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

              <div className="space-y-2">
                <Label htmlFor="decimalPlaces">Знаків після коми</Label>
                <Input
                  id="decimalPlaces"
                  type="number"
                  min="0"
                  max="6"
                  value={currencyForm.decimalPlaces}
                  onChange={(e) => setCurrencyForm(prev => ({ ...prev, decimalPlaces: parseInt(e.target.value) || 2 }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={currencyForm.isActive}
                  onCheckedChange={(checked) => setCurrencyForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Активна валюта</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isBase"
                  checked={currencyForm.isBase}
                  onCheckedChange={(checked) => setCurrencyForm(prev => ({ ...prev, isBase: checked }))}
                />
                <Label htmlFor="isBase">Базова валюта</Label>
              </div>

              <div className="flex gap-2 pt-4">
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="currencies">Валюти</TabsTrigger>
          <TabsTrigger value="nbu">Курси НБУ</TabsTrigger>
        </TabsList>

        <TabsContent value="currencies" className="space-y-4">
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

          <Card>
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
                    <TableCell colSpan={6} className="text-center">Завантаження...</TableCell>
                  </TableRow>
                ) : filteredCurrencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Валюти не знайдено</TableCell>
                  </TableRow>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <TableRow key={currency.id}>
                      <TableCell className="font-medium">
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
                        ) : currency.latestRate ? (
                          <div>
                            <div className="font-medium">{parseFloat(currency.latestRate).toFixed(4)}</div>
                            <div className="text-xs text-muted-foreground">
                              {currency.rateDate ? new Date(currency.rateDate).toLocaleDateString() : ""}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="secondary">Немає курсу</Badge>
                        )}
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
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddRate(currency)}
                            >
                              <TrendingUp className="h-4 w-4" />
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
          </Card>
        </TabsContent>



        <TabsContent value="nbu" className="space-y-2 flex-1 flex flex-col overflow-hidden">
          {/* Оновлення курсів */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-shrink-0">
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
                  onClick={handleUpdateCurrent}
                  disabled={updateCurrentRatesMutation.isPending}
                  className="w-full"
                >
                  {updateCurrentRatesMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Оновлюється...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Оновити поточні курси
                    </>
                  )}
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
                <p className="text-sm text-muted-foreground">
                  Завантажити курси валют за обраний період
                </p>
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
                  onClick={handleUpdatePeriod}
                  disabled={updatePeriodRatesMutation.isPending || !startDate || !endDate}
                  className="w-full"
                >
                  {updatePeriodRatesMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Завантажується...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Завантажити за період
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Налаштування автоматичного оновлення */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Налаштування автоматичного оновлення
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoUpdate"
                      checked={autoUpdateEnabled}
                      onCheckedChange={setAutoUpdateEnabled}
                    />
                    <Label htmlFor="autoUpdate">Автоматичне оновлення</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="updateTime">Час оновлення</Label>
                  <Input
                    id="updateTime"
                    type="time"
                    value={updateTime}
                    onChange={(e) => setUpdateTime(e.target.value)}
                    disabled={!autoUpdateEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Валюти для оновлення</Label>
                  <div className="flex flex-wrap gap-2">
                    {["USD", "EUR"].map((currency) => (
                      <div key={currency} className="flex items-center space-x-2">
                        <Switch
                          id={`currency-${currency}`}
                          checked={enabledCurrencies.includes(currency)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEnabledCurrencies(prev => [...prev, currency]);
                            } else {
                              setEnabledCurrencies(prev => prev.filter(c => c !== currency));
                            }
                          }}
                          disabled={!autoUpdateEnabled}
                        />
                        <Label htmlFor={`currency-${currency}`}>{currency}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {nbuSettings && (
                    <div className="space-y-1">
                      <div>Останнє оновлення: {nbuSettings.lastUpdateDate ? formatDate(nbuSettings.lastUpdateDate) : "Немає даних"}</div>
                      <div className="flex items-center gap-2">
                        Статус: {getStatusBadge(nbuSettings.lastUpdateStatus)}
                      </div>
                      {nbuSettings.lastUpdateError && (
                        <div className="text-red-600 text-xs">
                          Помилка: {nbuSettings.lastUpdateError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleSaveNbuSettings}
                  disabled={saveNbuSettingsMutation.isPending}
                  size="sm"
                >
                  {saveNbuSettingsMutation.isPending ? "Збереження..." : "Зберегти налаштування"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Графік курсів НБУ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Графік курсів валют НБУ
              </CardTitle>
              <CardDescription>
                Динаміка зміни курсів EUR та USD відносно гривні
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ratesLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Завантаження даних...</p>
                  </div>
                </div>
              ) : nbuRates.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Курси НБУ не завантажені</p>
                    <p className="text-sm">Використовуйте кнопки оновлення вище</p>
                  </div>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={(() => {
                        // Group rates by exchange date and format for chart
                        const ratesByDate = nbuRates.reduce((acc, rate) => {
                          const date = rate.exchangeDate;
                          if (!acc[date]) {
                            acc[date] = { date };
                          }
                          acc[date][rate.currencyCode] = parseFloat(rate.rate);
                          return acc;
                        }, {} as Record<string, any>);

                        // Sort dates and return array
                        return Object.values(ratesByDate)
                          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((item: any) => ({
                            ...item,
                            date: formatExchangeDate(item.date)
                          }));
                      })()}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={['dataMin - 1', 'dataMax + 1']}
                      />
                      <Tooltip 
                        labelFormatter={(label) => `Дата: ${label}`}
                        formatter={(value: any, name: string) => [
                          `${parseFloat(value).toFixed(4)} ₴`,
                          name === 'EUR' ? 'Євро' : name === 'USD' ? 'Долар США' : name
                        ]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="EUR" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="EUR"
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="USD" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="USD"
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Таблиця курсів НБУ */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0 p-3">
              <CardTitle className="text-lg">Курси валют НБУ (останні 10 записів)</CardTitle>
              <div className="flex gap-2 mt-2">
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
                  onClick={() => setSearchDate("")}
                  disabled={!searchDate}
                >
                  Очистити
                </Button>
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
                        <TableHead className="text-sm">EUR</TableHead>
                        <TableHead className="text-sm">USD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {(() => {
                      // Filter rates by search date if provided
                      const filteredRates = searchDate 
                        ? nbuRates.filter(rate => {
                            // Normalize both dates for comparison - handle both date string formats
                            let rateDate;
                            if (rate.exchangeDate.includes(' ')) {
                              // Format: "2025-06-11 00:00:00" -> "2025-06-11"
                              rateDate = rate.exchangeDate.split(' ')[0];
                            } else if (rate.exchangeDate.includes('T')) {
                              // Format: "2025-06-11T00:00:00" -> "2025-06-11" 
                              rateDate = rate.exchangeDate.split('T')[0];
                            } else {
                              // Already in YYYY-MM-DD format
                              rateDate = rate.exchangeDate;
                            }

                            return rateDate === searchDate;
                          })
                        : nbuRates;

                      // Group rates by exchange date
                      const ratesByDate = filteredRates.reduce((acc, rate) => {
                        const date = rate.exchangeDate;
                        if (!acc[date]) {
                          acc[date] = {};
                        }
                        acc[date][rate.currencyCode] = rate.rate;
                        return acc;
                      }, {} as Record<string, Record<string, string>>);

                      // Sort dates in descending order and take only 10 latest
                      const sortedDates = Object.keys(ratesByDate)
                        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                        .slice(0, 10);

                      return sortedDates.map((date) => (
                        <TableRow key={date}>
                          <TableCell className="font-medium">
                            {formatExchangeDate(date)}
                          </TableCell>
                          <TableCell className="font-mono">
                            {ratesByDate[date]['EUR'] || '—'}
                          </TableCell>
                          <TableCell className="font-mono">
                            {ratesByDate[date]['USD'] || '—'}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                    </TableBody>
                  </Table>
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
              Оновити курс валюти {selectedCurrencyForRate?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rate">
                Курс відносно {baseCurrency?.name || "базової валюти"}
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.0001"
                placeholder="1.0000"
                value={rateForm.rate}
                onChange={(e) => setRateForm({ rate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                1 {baseCurrency?.code} = {rateForm.rate || "0"} {selectedCurrencyForRate?.code}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleSubmitRate}
                disabled={createExchangeRateMutation.isPending || !rateForm.rate}
              >
                Оновити курс
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsRateDialogOpen(false);
                  setRateForm({ rate: "" });
                  setSelectedCurrencyForRate(null);
                }}
              >
                Скасувати
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}