import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Download, Settings, TrendingUp, Calendar, Banknote } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { UkrainianDateInput } from "@/components/ui/ukrainian-date-picker";

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

  const { data: settings } = useQuery<CurrencySettings>({
    queryKey: ["/api/currency-settings"],
  });

  // Мутації для оновлення
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
        description: `${data.message}. Оновлено дат: ${data.updatedDates.length}`,
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

  const saveSettingsMutation = useMutation({
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

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate({
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Курси валют НБУ</h1>
          <p className="text-muted-foreground">
            Автоматичне та ручне оновлення курсів валют з Національного банку України
          </p>
        </div>
        <Button onClick={handleUpdateCurrent} disabled={updateCurrentRatesMutation.isPending}>
          <RefreshCw className={`mr-2 h-4 w-4 ${updateCurrentRatesMutation.isPending ? "animate-spin" : ""}`} />
          Оновити зараз
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Поточні курси */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Поточні курси валют
              </CardTitle>
              <CardDescription>
                Останні курси валют з Національного банку України
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ratesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : rates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Курси валют не завантажено</p>
                  <p className="text-sm">Натисніть "Оновити зараз" для завантаження</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rates.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-bold text-blue-800">{rate.cc}</span>
                        </div>
                        <div>
                          <p className="font-medium">{rate.txt}</p>
                          <p className="text-sm text-muted-foreground">
                            Дата: {formatExchangeDate(rate.exchangeDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{parseFloat(rate.rate).toFixed(4)} ₴</p>
                        <p className="text-sm text-muted-foreground">
                          Оновлено: {formatDate(rate.updatedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Налаштування */}
        <div className="space-y-6">
          {/* Статус останнього оновлення */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Статус оновлення
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Останнє оновлення:</span>
                    {getStatusBadge(settings.lastUpdateStatus)}
                  </div>
                  {settings.lastUpdateDate && (
                    <div className="text-sm text-muted-foreground">
                      {formatDate(settings.lastUpdateDate)}
                    </div>
                  )}
                  {settings.lastUpdateError && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {settings.lastUpdateError}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Автоматичне оновлення */}
          <Card>
            <CardHeader>
              <CardTitle>Автоматичне оновлення</CardTitle>
              <CardDescription>
                Налаштування щоденного оновлення курсів
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-update">Увімкнути автооновлення</Label>
                <Switch
                  id="auto-update"
                  checked={autoUpdateEnabled}
                  onCheckedChange={setAutoUpdateEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-time">Час оновлення</Label>
                <Input
                  id="update-time"
                  type="time"
                  value={updateTime}
                  onChange={(e) => setUpdateTime(e.target.value)}
                  disabled={!autoUpdateEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Валюти для оновлення</Label>
                <div className="flex gap-2 flex-wrap">
                  {["USD", "EUR", "PLN", "GBP"].map((currency) => (
                    <Button
                      key={currency}
                      variant={enabledCurrencies.includes(currency) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (enabledCurrencies.includes(currency)) {
                          setEnabledCurrencies(enabledCurrencies.filter(c => c !== currency));
                        } else {
                          setEnabledCurrencies([...enabledCurrencies, currency]);
                        }
                      }}
                    >
                      {currency}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isPending}
                className="w-full"
              >
                Зберегти налаштування
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Оновлення за період */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Оновлення курсів за період
          </CardTitle>
          <CardDescription>
            Завантажте історичні курси валют за вказаний період (максимум 365 днів)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="start-date">Початкова дата</Label>
              <UkrainianDateInput
                date={startDate ? new Date(startDate) : undefined}
                onDateChange={(date) => setStartDate(date ? date.toISOString().split('T')[0] : '')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Кінцева дата</Label>
              <UkrainianDateInput
                date={endDate ? new Date(endDate) : undefined}
                onDateChange={(date) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={handleUpdatePeriod}
                disabled={updatePeriodRatesMutation.isPending}
                className="w-full"
              >
                <Download className={`mr-2 h-4 w-4 ${updatePeriodRatesMutation.isPending ? "animate-spin" : ""}`} />
                {updatePeriodRatesMutation.isPending ? "Завантаження..." : "Завантажити за період"}
              </Button>
            </div>
          </div>
          
          {updatePeriodRatesMutation.isPending && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Завантаження курсів за період. Це може зайняти деякий час...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}