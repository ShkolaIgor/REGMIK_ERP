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

interface ExchangeRate {
  id: number;
  currencyId: number;
  rate: string;
  createdAt: string;
  currency?: Currency;
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currencies = [], isLoading } = useQuery<CurrencyWithLatestRate[]>({
    queryKey: ["/api/currencies"],
  });

  const { data: exchangeRates = [] } = useQuery<ExchangeRate[]>({
    queryKey: ["/api/exchange-rates"],
  });

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
      toast({
        title: "Курси за період оновлено",
        description: `${data.message}. Оновлено дат: ${data.updatedDates?.length || 0}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
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
  const recentRates = exchangeRates
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="currencies">Валюти</TabsTrigger>
          <TabsTrigger value="rates">Курси обміну</TabsTrigger>
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
                  <TableHead>Знаків після коми</TableHead>
                  <TableHead>Поточний курс</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Завантаження...</TableCell>
                  </TableRow>
                ) : filteredCurrencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Валюти не знайдено</TableCell>
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
                      <TableCell>{currency.decimalPlaces}</TableCell>
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

        <TabsContent value="rates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Останні курси валют</h2>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates"] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Оновити
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Валюта</TableHead>
                  <TableHead>Курс</TableHead>
                  <TableHead>Дата оновлення</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Курси валют не знайдено</TableCell>
                  </TableRow>
                ) : (
                  recentRates.map((rate) => {
                    const currency = currencies.find(c => c.id === rate.currencyId);
                    return (
                      <TableRow key={rate.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">
                              {currency?.symbol || currency?.code}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {currency?.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {parseFloat(rate.rate).toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(rate.createdAt).toLocaleString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
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