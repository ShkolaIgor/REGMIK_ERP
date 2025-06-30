import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Download, Settings, TrendingUp, Calendar, Banknote, Activity } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

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

export default function CurrencyRates() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [updateTime, setUpdateTime] = useState("09:00");
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [enabledCurrencies, setEnabledCurrencies] = useState(["USD", "EUR"]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Запити для отримання даних
  const { data: rates = [], isLoading: ratesLoading } = useQuery<CurrencyRate[]>({
    queryKey: ["/api/currency-rates"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<CurrencySettings>({
    queryKey: ["/api/currency-settings"],
  });

  // Мутації
  const updateCurrentRatesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/currency-rates/update-current", { method: "POST" });
      if (!response.ok) {
        throw new Error("Помилка оновлення курсів");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      toast({
        title: "Успіх",
        description: "Курси валют успішно оновлено",
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
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      const response = await fetch("/api/currency-rates/update-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!response.ok) {
        throw new Error("Помилка оновлення курсів за період");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      toast({
        title: "Успіх",
        description: "Курси валют за період успішно оновлено",
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

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<CurrencySettings>) => {
      const response = await fetch("/api/currency-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) {
        throw new Error("Помилка збереження налаштувань");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-settings"] });
      toast({
        title: "Успіх",
        description: "Налаштування успішно збережено",
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

  const handleUpdateCurrent = () => {
    updateCurrentRatesMutation.mutate();
  };

  const handleUpdatePeriod = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Помилка",
        description: "Оберіть період для оновлення",
        variant: "destructive",
      });
      return;
    }
    updatePeriodRatesMutation.mutate({ startDate, endDate });
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
      autoUpdateEnabled,
      updateTime,
      enabledCurrencies,
    });
  };

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <TrendingUp className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">
                  Курси валют НБУ
                </h1>
                <p className="text-amber-100 text-xl font-medium">Автоматичне оновлення та управління курсами валют</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleUpdateCurrent}
                disabled={updateCurrentRatesMutation.isPending}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Оновити зараз
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-8 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Всього курсів</CardTitle>
              <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-300">
                <Banknote className="h-6 w-6 text-amber-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700">{rates.length}</div>
              <p className="text-xs text-amber-600 mt-1">записів у базі</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Активні валюти</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                <Activity className="h-6 w-6 text-green-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{enabledCurrencies.length}</div>
              <p className="text-xs text-green-600 mt-1">валют відстежується</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-sky-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Останнє оновлення</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                <Calendar className="h-6 w-6 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                {settings?.lastUpdateDate ? 
                  format(new Date(settings.lastUpdateDate), "dd.MM", { locale: uk }) : 
                  "Немає"
                }
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {settings?.lastUpdateStatus || "статус невідомий"}
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Автооновлення</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                <Settings className="h-6 w-6 text-purple-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">
                {settings?.autoUpdateEnabled ? "ВКЛ" : "ВИКЛ"}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                {settings?.updateTime || updateTime}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Rates */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Поточні курси НБУ</CardTitle>
                <CardDescription>
                  Останні офіційні курси валют від Національного банку України
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ratesLoading ? (
                  <div className="text-center py-8">Завантаження курсів...</div>
                ) : rates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Курсів не знайдено. Спробуйте оновити дані.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Валюта</TableHead>
                        <TableHead>Код</TableHead>
                        <TableHead>Курс</TableHead>
                        <TableHead>Дата</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates.slice(0, 10).map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell className="font-medium">{rate.txt}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rate.cc}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {parseFloat(rate.rate).toFixed(4)} ₴
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(rate.exchangeDate), "dd.MM.yyyy", { locale: uk })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Налаштування</CardTitle>
                <CardDescription>
                  Конфігурація автоматичного оновлення курсів
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Auto Update Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-update">Автооновлення</Label>
                  <Switch
                    id="auto-update"
                    checked={autoUpdateEnabled}
                    onCheckedChange={setAutoUpdateEnabled}
                  />
                </div>

                {/* Update Time */}
                <div className="space-y-2">
                  <Label htmlFor="update-time">Час оновлення</Label>
                  <Input
                    id="update-time"
                    type="time"
                    value={updateTime}
                    onChange={(e) => setUpdateTime(e.target.value)}
                  />
                </div>

                <Separator />

                {/* Manual Update for Period */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Оновлення за період</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Початкова дата</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">Кінцева дата</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleUpdatePeriod}
                    disabled={updatePeriodRatesMutation.isPending || !startDate || !endDate}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Завантажити за період
                  </Button>
                </div>

                <Separator />

                {/* Save Settings */}
                <Button 
                  onClick={handleSaveSettings}
                  disabled={saveSettingsMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Зберегти налаштування
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}