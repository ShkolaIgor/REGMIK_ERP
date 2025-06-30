import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  DollarSign, 
  Edit,
  Trash2,
  TrendingUp,
  Settings,
  Save,
  Star,
  RefreshCw,
  Calendar,
  ArrowUpDown,
  Download,
  BarChart3,
  Banknote,
  Grid,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatUkrainianDate, formatShortUkrainianDate, formatShortUkrainianDateTime } from "@/lib/date-utils";
import { UkrainianDate } from "@/components/ui/ukrainian-date";
import { UkrainianDatePicker } from "@/components/ui/ukrainian-date-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  
  // Фільтри для графіку курсів
  const [chartFilter, setChartFilter] = useState("last_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [selectedCurrencyForRate, setSelectedCurrencyForRate] = useState<Currency | null>(null);
  const [searchDate, setSearchDate] = useState("");

  // Rate form state
  const [rateForm, setRateForm] = useState({
    rate: ""
  });

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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currencies = [], isLoading } = useQuery<CurrencyWithLatestRate[]>({
    queryKey: ["/api/currencies"],
  });

  // Доступні валюти для вибору в налаштуваннях (фільтруємо UAH)
  const availableCurrencies = currencies.filter(currency => currency.code !== 'UAH');

  // Функція для отримання сьогоднішнього курсу валюти
  const getTodayRate = (currencyCode: string) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayRate = nbuRates.find(rate => 
      rate.currencyCode === currencyCode && 
      rate.exchangeDate.startsWith(today)
    );
    return todayRate;
  };

  // Видалено exchange-rates - використовуємо currency_rates

  // НБУ queries
  const { data: nbuRates = [], isLoading: ratesLoading } = useQuery<CurrencyRate[]>({
    queryKey: ["/api/currency-rates"],
  });

  const { data: nbuSettings } = useQuery<CurrencySettings>({
    queryKey: ["/api/currency-settings"],
  });

  // Синхронізуємо локальні налаштування з даними з сервера
  useEffect(() => {
    if (nbuSettings) {
      setAutoUpdateEnabled(nbuSettings.autoUpdateEnabled || false);
      setUpdateTime(nbuSettings.updateTime || "09:00");
      setEnabledCurrencies(nbuSettings.enabledCurrencies || ["USD", "EUR"]);
    }
  }, [nbuSettings]);

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

  // Мутація для збереження налаштувань НБУ
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch("/api/currency-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoUpdateEnabled,
          updateTime,
          enabledCurrencies
        }),
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
        description: "Налаштування автоматичного оновлення успішно збережено",
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

  // НБУ handlers
  const handleUpdateCurrent = () => {
    updateCurrentRatesMutation.mutate();
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      autoUpdateEnabled,
      updateTime,
      enabledCurrencies
    });
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
    return formatShortUkrainianDateTime(dateString);
  };

  const formatExchangeDate = (dateString: string) => {
    return formatShortUkrainianDate(dateString);
  };

  // Функції для розрахунку дат періодів
  const getDateRange = (filter: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (filter) {
      case "last_week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "last_year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    return { startDate, endDate };
  };

  // Фільтрування даних графіку за обраним періодом
  const getFilteredChartData = () => {
    if (!nbuRates || nbuRates.length === 0) return [];

    const { startDate, endDate } = getDateRange(chartFilter);
    
    const filteredRates = nbuRates.filter(rate => {
      const rateDate = new Date(rate.exchangeDate);
      return rateDate >= startDate && rateDate <= endDate;
    });

    // Групування курсів за датою
    const ratesByDate = filteredRates.reduce((acc, rate) => {
      const date = rate.exchangeDate;
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][rate.currencyCode] = parseFloat(rate.rate);
      return acc;
    }, {} as Record<string, any>);

    // Сортування за датою та форматування
    return Object.values(ratesByDate)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: any) => ({
        ...item,
        date: formatExchangeDate(item.date)
      }));
  };

  const filteredCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const baseCurrency = currencies.find(c => c.isBase);

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <DollarSign className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                  Валюти
                </h1>
                <p className="text-green-100 text-xl font-medium">Управління валютами та курсами обміну</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => {
                      resetCurrencyForm();
                      setEditingCurrency(null);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Додати валюту
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-8 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Всього валют</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                <DollarSign className="h-6 w-6 text-green-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{currencies.length}</div>
              <p className="text-xs text-green-600 mt-1">активних валют системи</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-sky-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Активні валюти</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                <CreditCard className="h-6 w-6 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{currencies.filter(c => c.isActive).length}</div>
              <p className="text-xs text-blue-600 mt-1">доступних для операцій</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Базова валюта</CardTitle>
              <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors duration-300">
                <Star className="h-6 w-6 text-yellow-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">{baseCurrency?.code || "UAH"}</div>
              <p className="text-xs text-yellow-600 mt-1">основна валюта системи</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Оновлення курсів</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                <TrendingUp className="h-6 w-6 text-purple-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">НБУ</div>
              <p className="text-xs text-purple-600 mt-1">автоматичне оновлення</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-8 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="currencies">Валюти</TabsTrigger>
            <TabsTrigger value="rates">Курси НБУ</TabsTrigger>
            <TabsTrigger value="settings">Налаштування</TabsTrigger>
            <TabsTrigger value="dashboard">Панелі</TabsTrigger>
          </TabsList>

          <TabsContent value="currencies" className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
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
                    <TableHead>НБУ оновлення</TableHead>
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
                        <TableCell>
                          {currency.isBase ? (
                            <Badge variant="outline">Базова</Badge>
                          ) : (
                            <div>
                              <div className="font-medium">1.0000</div>
                              <div className="text-xs text-muted-foreground">сьогодні</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={currency.isActive ? "default" : "secondary"}>
                            {currency.isActive ? "Активна" : "Неактивна"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            НБУ
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCurrency(currency)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!currency.isBase && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Ви впевнені, що хочете видалити цю валюту?")) {
                                    // handleDelete(currency.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
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
        </Tabs>
      </div>
    </>
  );
}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="currencies">Валюти</TabsTrigger>
          <TabsTrigger value="rates">Курси НБУ</TabsTrigger>
          <TabsTrigger value="settings">Налаштування</TabsTrigger>
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
                  <TableHead>НБУ оновлення</TableHead>
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
                      <TableCell>
                        {currency.isBase ? (
                          <Badge variant="outline">Базова</Badge>
                        ) : (() => {
                          const todayRate = getTodayRate(currency.code);
                          if (todayRate) {
                            return (
                              <div>
                                <div className="font-medium">{parseFloat(todayRate.rate).toFixed(4)}</div>
                                <div className="text-xs text-muted-foreground">
                                  Сьогодні
                                </div>
                              </div>
                            );
                          } else if (currency.latestRate) {
                            return (
                              <div>
                                <div className="font-medium">{parseFloat(currency.latestRate).toFixed(4)}</div>
                                <div className="text-xs text-muted-foreground">
                                  <UkrainianDate date={currency.rateDate} format="short" />
                                </div>
                              </div>
                            );
                          } else {
                            return <Badge variant="secondary">Немає курсу</Badge>;
                          }
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
                        {currency.code !== 'UAH' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`nbu-${currency.code}`}
                              checked={enabledCurrencies.includes(currency.code)}
                              onChange={(e) => {
                                const newEnabledCurrencies = e.target.checked
                                  ? [...enabledCurrencies, currency.code]
                                  : enabledCurrencies.filter(c => c !== currency.code);
                                setEnabledCurrencies(newEnabledCurrencies);
                                
                                // Автоматично зберігаємо зміни
                                saveSettingsMutation.mutate({
                                  autoUpdateEnabled,
                                  updateTime,
                                  enabledCurrencies: newEnabledCurrencies
                                });
                              }}
                              className="h-4 w-4"
                              disabled={saveSettingsMutation.isPending}
                            />
                            {saveSettingsMutation.isPending && (
                              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
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
          </Card>
        </TabsContent>



        <TabsContent value="rates" className="space-y-4">



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
              {/* Фільтри періоду */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="chartFilter">Період</Label>
                    <Select value={chartFilter} onValueChange={setChartFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Оберіть період" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last_week">Останній тиждень</SelectItem>
                        <SelectItem value="last_month">Останній місяць</SelectItem>
                        <SelectItem value="last_year">Останній рік</SelectItem>
                        <SelectItem value="custom">Обраний період</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {chartFilter === "custom" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="customStartDate">Від</Label>
                        <UkrainianDatePicker
                          date={customStartDate ? new Date(customStartDate) : undefined}
                          onDateChange={(date) => setCustomStartDate(date ? date.toISOString().split('T')[0] : '')}
                          className="w-[140px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customEndDate">До</Label>
                        <UkrainianDatePicker
                          date={customEndDate ? new Date(customEndDate) : undefined}
                          onDateChange={(date) => setCustomEndDate(date ? date.toISOString().split('T')[0] : '')}
                          className="w-[140px]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
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
                      data={getFilteredChartData()}
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
                      {enabledCurrencies.map((currencyCode, index) => {
                        const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff00ff"];
                        const currency = availableCurrencies.find(c => c.code === currencyCode);
                        return (
                          <Line 
                            key={currencyCode}
                            type="monotone" 
                            dataKey={currencyCode} 
                            stroke={colors[index % colors.length]} 
                            strokeWidth={2}
                            name={currencyCode}
                            connectNulls={false}
                          />
                        );
                      })}
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
                <UkrainianDatePicker
                  date={searchDate ? new Date(searchDate) : undefined}
                  onDateChange={(date) => setSearchDate(date ? date.toISOString().split('T')[0] : '')}
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
            <CardContent className="p-4">
              {ratesLoading ? (
                <div className="text-center py-8">Завантаження курсів...</div>
              ) : nbuRates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Курси НБУ не завантажені. Використовуйте кнопки оновлення вище.
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="text-sm">Дата курсу</TableHead>
                        {enabledCurrencies.map((currencyCode) => (
                          <TableHead key={currencyCode} className="text-sm">
                            {currencyCode}
                          </TableHead>
                        ))}
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
                            <UkrainianDate date={date} format="short" />
                          </TableCell>
                          {enabledCurrencies.map((currencyCode) => (
                            <TableCell key={currencyCode} className="font-mono">
                              {ratesByDate[date][currencyCode] || '—'}
                            </TableCell>
                          ))}
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

        <TabsContent value="settings" className="space-y-4">
          {/* Оновлення курсів */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <UkrainianDatePicker
                      date={startDate ? new Date(startDate) : undefined}
                      onDateChange={(date) => setStartDate(date ? date.toISOString().split('T')[0] : '')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">До</Label>
                    <UkrainianDatePicker
                      date={endDate ? new Date(endDate) : undefined}
                      onDateChange={(date) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
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
                Автоматичне оновлення
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-update"
                  checked={autoUpdateEnabled}
                  onCheckedChange={setAutoUpdateEnabled}
                />
                <Label htmlFor="auto-update">Включити автоматичне оновлення</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="update-time">Час оновлення</Label>
                <Input
                  id="update-time"
                  type="time"
                  value={updateTime}
                  onChange={(e) => setUpdateTime(e.target.value)}
                />
              </div>



              <Button 
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isPending}
                className="w-full"
              >
                {saveSettingsMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Зберігається...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Зберегти налаштування
                  </>
                )}
              </Button>
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

// Dashboard Types and Schemas
type Dashboard = {
  id: number;
  name: string;
  description?: string;
  isDefault: boolean;
  layout: {
    columns: number;
    rows: number;
    gap: number;
  };
  widgets?: Widget[];
  createdAt: string;
  updatedAt: string;
};

type Widget = {
  id: number;
  dashboardId: number;
  type: string;
  title: string;
  config: {
    currencies?: string[];
    timeRange?: string;
    chartType?: string;
    baseCurrency: string;
    showPercentage?: boolean;
    showTrend?: boolean;
    precision?: number;
    refreshInterval?: number;
    colorScheme?: string;
    size?: string;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

const dashboardSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  layout: z.object({
    columns: z.number().min(1).max(12),
    rows: z.number().min(1).max(10),
    gap: z.number().min(0).max(20)
  })
});

const widgetSchema = z.object({
  type: z.string().min(1, "Тип віджета обов'язковий"),
  title: z.string().min(1, "Назва віджета обов'язкова"),
  config: z.object({
    currencies: z.array(z.string()).optional(),
    timeRange: z.string().optional(),
    chartType: z.string().optional(),
    baseCurrency: z.string().min(1, "Базова валюта обов'язкова"),
    showPercentage: z.boolean().optional(),
    showTrend: z.boolean().optional(),
    precision: z.number().min(0).max(10).optional(),
    refreshInterval: z.number().min(1).optional(),
    colorScheme: z.string().optional(),
    size: z.string().optional()
  }),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1).max(12),
    height: z.number().min(1).max(10)
  }),
  isVisible: z.boolean().default(true)
});

function CurrencyWidget({ widget, onEdit, onDelete, onToggleVisibility }: {
  widget: Widget;
  onEdit: (widget: Widget) => void;
  onDelete: (widgetId: number) => void;
  onToggleVisibility: (widgetId: number) => void;
}) {
  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ["/api/currencies"]
  });

  const { data: rates = [] } = useQuery<CurrencyRate[]>({
    queryKey: ["/api/currency-rates"]
  });

  const getWidgetData = () => {
    if (widget.config.currencies) {
      return widget.config.currencies.map(code => {
        const currency = currencies.find(c => c.code === code);
        const rate = rates.find(r => r.currencyCode === code);
        return {
          code,
          name: currency?.name || code,
          rate: rate?.rate || '1.0000',
          symbol: currency?.symbol || code
        };
      });
    }
    return [];
  };

  const widgetData = getWidgetData();

  const renderWidget = () => {
    switch (widget.type) {
      case 'rate-display':
      case 'rate_card':
        return (
          <div className="space-y-2">
            {widgetData.map((item) => (
              <div key={item.code} className="flex justify-between items-center">
                <span className="font-medium">{item.symbol}</span>
                <span className="text-lg">
                  {widget.config.precision 
                    ? parseFloat(item.rate).toFixed(widget.config.precision)
                    : item.rate
                  }
                </span>
              </div>
            ))}
          </div>
        );
      
      case 'rate-chart':
      case 'rate_chart':
        const chartData = widgetData.map(item => ({
          name: item.code,
          value: parseFloat(item.rate)
        }));
        
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'currency-summary':
      case 'rate_comparison':
        return (
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">
              {widgetData.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Активних валют
            </div>
          </div>
        );
        
      case 'rate_trend':
        return (
          <div className="text-center space-y-2">
            <div className="text-lg font-bold">Тренд валют</div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-green-500">+2.3%</span>
            </div>
          </div>
        );
        
      case 'rate_history':
        return (
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">
              Період: {widget.config.timeRange || "7д"}
            </div>
            <div className="h-20 bg-gradient-to-r from-blue-100 to-green-100 rounded flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        );
        
      default:
        return <div className="text-center text-muted-foreground">Невідомий тип віджета: {widget.type}</div>;
    }
  };

  return (
    <Card 
      className={`relative ${!widget.isVisible ? 'opacity-50' : ''}`}
      style={{
        gridColumn: `span ${widget.position.width}`,
        gridRow: `span ${widget.position.height}`
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleVisibility(widget.id)}
            >
              {widget.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(widget)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(widget.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderWidget()}
      </CardContent>
    </Card>
  );
}

function CurrencyDashboardTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isDashboardDialogOpen, setIsDashboardDialogOpen] = useState(false);
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  // Queries
  const { data: dashboards = [], isLoading: dashboardsLoading } = useQuery<Dashboard[]>({
    queryKey: ["/api/currency-dashboards"]
  });

  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ["/api/currencies"]
  });

  // Set default dashboard
  useEffect(() => {
    if (dashboards.length > 0 && !selectedDashboard) {
      const defaultDashboard = dashboards.find((d: Dashboard) => d.isDefault) || dashboards[0];
      setSelectedDashboard(defaultDashboard);
    }
  }, [dashboards, selectedDashboard]);

  // Forms
  const dashboardForm = useForm<z.infer<typeof dashboardSchema>>({
    resolver: zodResolver(dashboardSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
      layout: {
        columns: 4,
        rows: 3,
        gap: 4
      }
    }
  });

  const widgetForm = useForm<z.infer<typeof widgetSchema>>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      type: "rate-display",
      title: "",
      config: {
        currencies: [],
        baseCurrency: "UAH",
        precision: 4,
        showPercentage: false,
        showTrend: true,
        refreshInterval: 60,
        colorScheme: "default"
      },
      position: {
        x: 0,
        y: 0,
        width: 2,
        height: 2
      },
      isVisible: true
    }
  });

  // Mutations
  const createDashboardMutation = useMutation({
    mutationFn: (data: z.infer<typeof dashboardSchema>) =>
      apiRequest('/api/currency-dashboards', {
        method: 'POST',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      setIsDashboardDialogOpen(false);
      dashboardForm.reset();
      toast({
        title: "Успіх",
        description: "Панель створено"
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

  const updateDashboardMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & z.infer<typeof dashboardSchema>) =>
      apiRequest(`/api/currency-dashboards/${id}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      setIsDashboardDialogOpen(false);
      setEditingDashboard(null);
      dashboardForm.reset();
      toast({
        title: "Успіх",
        description: "Панель оновлено"
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

  const deleteDashboardMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/currency-dashboards/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      if (selectedDashboard && dashboards.length > 1) {
        setSelectedDashboard(dashboards.find(d => d.id !== selectedDashboard.id) || null);
      }
      toast({
        title: "Успіх",
        description: "Панель видалено"
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

  const createWidgetMutation = useMutation({
    mutationFn: (data: z.infer<typeof widgetSchema> & { dashboardId: number }) =>
      apiRequest('/api/currency-dashboard-widgets', {
        method: 'POST',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      setIsWidgetDialogOpen(false);
      widgetForm.reset();
      toast({
        title: "Успіх",
        description: "Віджет створено"
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

  const updateWidgetMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<z.infer<typeof widgetSchema>>) =>
      apiRequest(`/api/currency-dashboard-widgets/${id}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      setIsWidgetDialogOpen(false);
      setEditingWidget(null);
      widgetForm.reset();
      toast({
        title: "Успіх",
        description: "Віджет оновлено"
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

  const deleteWidgetMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/currency-dashboard-widgets/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      toast({
        title: "Успіх",
        description: "Віджет видалено"
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

  // Handlers
  const handleEditDashboard = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    dashboardForm.reset({
      name: dashboard.name,
      description: dashboard.description || "",
      isDefault: dashboard.isDefault,
      layout: dashboard.layout
    });
    setIsDashboardDialogOpen(true);
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
    widgetForm.reset({
      type: widget.type,
      title: widget.title,
      config: widget.config,
      position: widget.position,
      isVisible: widget.isVisible
    });
    setIsWidgetDialogOpen(true);
  };

  const handleSubmitDashboard = (data: z.infer<typeof dashboardSchema>) => {
    if (editingDashboard) {
      updateDashboardMutation.mutate({ id: editingDashboard.id, ...data });
    } else {
      createDashboardMutation.mutate(data);
    }
  };

  const handleSubmitWidget = (data: z.infer<typeof widgetSchema>) => {
    if (!selectedDashboard) return;
    
    if (editingWidget) {
      updateWidgetMutation.mutate({ id: editingWidget.id, ...data });
    } else {
      createWidgetMutation.mutate({ ...data, dashboardId: selectedDashboard.id });
    }
  };

  const handleDeleteWidget = (widgetId: number) => {
    deleteWidgetMutation.mutate(widgetId);
  };

  const handleToggleWidgetVisibility = (widgetId: number) => {
    const widget = selectedDashboard?.widgets?.find(w => w.id === widgetId);
    if (widget) {
      updateWidgetMutation.mutate({
        id: widgetId,
        isVisible: !widget.isVisible
      });
    }
  };

  if (dashboardsLoading) {
    return <div className="flex justify-center p-8">Завантаження...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Панелі валют</h3>
        <div className="flex gap-2">
          <Dialog open={isDashboardDialogOpen} onOpenChange={setIsDashboardDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Нова панель
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDashboard ? "Редагувати панель" : "Створити панель"}
                </DialogTitle>
                <DialogDescription>
                  Налаштуйте параметри панелі валют
                </DialogDescription>
              </DialogHeader>
              <Form {...dashboardForm}>
                <form onSubmit={dashboardForm.handleSubmit(handleSubmitDashboard)} className="space-y-4">
                  <FormField
                    control={dashboardForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Назва панелі</FormLabel>
                        <FormControl>
                          <Input placeholder="Моя панель валют" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={dashboardForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Опис</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Опис панелі..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={dashboardForm.control}
                      name="layout.columns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Колонки</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="12" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={dashboardForm.control}
                      name="layout.rows"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Рядки</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="10" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={dashboardForm.control}
                      name="layout.gap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Відступ</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="20" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={dashboardForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Зробити панеллю за замовчуванням</FormLabel>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createDashboardMutation.isPending || updateDashboardMutation.isPending}>
                      {editingDashboard ? "Оновити" : "Створити"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDashboardDialogOpen(false)}>
                      Скасувати
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {selectedDashboard && (
            <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Grid className="h-4 w-4 mr-2" />
                  Додати віджет
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingWidget ? "Редагувати віджет" : "Додати віджет"}
                  </DialogTitle>
                  <DialogDescription>
                    Налаштуйте параметри віджета для відображення валютної інформації
                  </DialogDescription>
                </DialogHeader>
                <Form {...widgetForm}>
                  <form onSubmit={widgetForm.handleSubmit(handleSubmitWidget)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={widgetForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Тип віджета</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть тип віджета" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="rate-display">Відображення курсів</SelectItem>
                                <SelectItem value="rate-chart">Графік курсів</SelectItem>
                                <SelectItem value="currency-summary">Підсумок валют</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Назва віджета</FormLabel>
                            <FormControl>
                              <Input placeholder="Поточні курси" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <FormField
                        control={widgetForm.control}
                        name="position.x"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>X позиція</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="position.y"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Y позиція</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="position.width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ширина</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="12" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="position.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Висота</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="10" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={createWidgetMutation.isPending || updateWidgetMutation.isPending}>
                        {editingWidget ? "Оновити" : "Додати"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsWidgetDialogOpen(false)}>
                        Скасувати
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Dashboard Selector */}
      {dashboards.length > 0 && (
        <div className="flex items-center gap-4">
          <Label>Активна панель:</Label>
          <Select 
            value={selectedDashboard?.id.toString()} 
            onValueChange={(value) => {
              const dashboard = dashboards.find(d => d.id === parseInt(value));
              setSelectedDashboard(dashboard || null);
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Оберіть панель" />
            </SelectTrigger>
            <SelectContent>
              {dashboards.map((dashboard: Dashboard) => (
                <SelectItem key={dashboard.id} value={dashboard.id.toString()}>
                  {dashboard.name} {dashboard.isDefault && "(За замовчуванням)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedDashboard && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditDashboard(selectedDashboard)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteDashboardMutation.mutate(selectedDashboard.id)}
                disabled={dashboards.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dashboard Content */}
      {selectedDashboard ? (
        <div className="space-y-4">
          {selectedDashboard.description && (
            <p className="text-muted-foreground">{selectedDashboard.description}</p>
          )}
          
          {selectedDashboard.widgets && selectedDashboard.widgets.length > 0 ? (
            <div 
              className="grid auto-rows-min"
              style={{
                gridTemplateColumns: `repeat(${selectedDashboard.layout.columns}, minmax(0, 1fr))`,
                gap: `${selectedDashboard.layout.gap * 4}px`
              }}
            >
              {selectedDashboard.widgets.map((widget: Widget) => (
                <CurrencyWidget
                  key={widget.id}
                  widget={widget}
                  onEdit={handleEditWidget}
                  onDelete={handleDeleteWidget}
                  onToggleVisibility={handleToggleWidgetVisibility}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <CardContent>
                <Grid className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Немає віджетів</h3>
                <p className="text-muted-foreground mb-4">
                  Додайте віджети для відображення валютної інформації
                </p>
                <Button onClick={() => setIsWidgetDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Додати перший віджет
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <CardContent>
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Немає панелей</h3>
            <p className="text-muted-foreground mb-4">
              Створіть першу панель для керування віджетами валют
            </p>
            <Button onClick={() => setIsDashboardDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Створити першу панель
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}