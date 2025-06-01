import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, DollarSign, RefreshCw, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Currency, InsertCurrency } from "@shared/schema";

const currencyFormSchema = z.object({
  code: z.string().min(3).max(3).toUpperCase(),
  name: z.string().min(1, "Назва валюти обов'язкова"),
  symbol: z.string().min(1, "Символ валюти обов'язковий"),
  exchangeRate: z.string().min(1, "Курс обміну обов'язковий"),
  decimalPlaces: z.number().min(0).max(6).default(2),
  isBaseCurrency: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type CurrencyFormData = z.infer<typeof currencyFormSchema>;

export default function CurrenciesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const { toast } = useToast();

  const { data: currencies, isLoading } = useQuery<Currency[]>({
    queryKey: ["/api/currencies"],
  });

  const { data: exchangeRates } = useQuery({
    queryKey: ["/api/exchange-rates/latest"],
  });

  const form = useForm<CurrencyFormData>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: {
      code: "",
      name: "",
      symbol: "",
      exchangeRate: "1.000000",
      decimalPlaces: 2,
      isBaseCurrency: false,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCurrency) => {
      return await apiRequest("/api/currencies", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Валюту успішно створено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити валюту",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCurrency> }) => {
      return await apiRequest(`/api/currencies/${id}`, { method: "PATCH", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsOpen(false);
      setEditingCurrency(null);
      form.reset();
      toast({
        title: "Успіх",
        description: "Валюту успішно оновлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити валюту",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/currencies/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Валюту успішно видалено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити валюту",
        variant: "destructive",
      });
    },
  });

  const updateRatesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/exchange-rates/update", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exchange-rates/latest"] });
      toast({
        title: "Успіх",
        description: "Курси валют оновлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити курси валют",
        variant: "destructive",
      });
    },
  });

  const setBaseCurrencyMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/currencies/${id}/set-base`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Базову валюту змінено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося змінити базову валюту",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CurrencyFormData) => {
    if (editingCurrency) {
      updateMutation.mutate({ id: editingCurrency.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    form.reset({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate,
      decimalPlaces: currency.decimalPlaces,
      isBaseCurrency: currency.isBaseCurrency,
      isActive: currency.isActive,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цю валюту?")) {
      deleteMutation.mutate(id);
    }
  };

  const baseCurrency = currencies?.find(c => c.isBaseCurrency);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Валюти</h1>
          <p className="text-gray-600">Управління валютами та курсами обміну</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => updateRatesMutation.mutate()}
            disabled={updateRatesMutation.isPending}
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Оновити курси
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingCurrency(null);
                  form.reset();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Додати валюту
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCurrency ? "Редагувати валюту" : "Додати валюту"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Код валюти (ISO)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="USD, EUR, UAH..."
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
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
                        <FormLabel>Назва валюти</FormLabel>
                        <FormControl>
                          <Input placeholder="Долар США, Євро..." {...field} />
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
                          <Input placeholder="$, €, ₴..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="exchangeRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Курс до базової валюти</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.000001" placeholder="1.000000" {...field} />
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
                          <Input
                            type="number"
                            min="0"
                            max="6"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isBaseCurrency"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Базова валюта системи</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Активна</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Скасувати
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingCurrency ? "Оновити" : "Створити"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {baseCurrency && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Базова валюта системи
            </CardTitle>
            <CardDescription>
              Всі розрахунки та конвертації виконуються відносно базової валюти
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {baseCurrency.name} ({baseCurrency.code})
                </h3>
                <p className="text-gray-600">Символ: {baseCurrency.symbol}</p>
              </div>
              <Badge variant="default">Базова валюта</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Список валют</CardTitle>
          <CardDescription>
            Управління всіма валютами системи та їх курсами обміну
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Завантаження...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>Символ</TableHead>
                  <TableHead>Курс</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Оновлено</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies?.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell className="font-medium">{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell>{currency.symbol}</TableCell>
                    <TableCell>
                      {currency.isBaseCurrency ? (
                        <Badge variant="outline">1.000000 (база)</Badge>
                      ) : (
                        currency.exchangeRate
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {currency.isBaseCurrency && (
                          <Badge variant="default">Базова</Badge>
                        )}
                        <Badge variant={currency.isActive ? "secondary" : "outline"}>
                          {currency.isActive ? "Активна" : "Неактивна"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {currency.lastUpdated
                        ? new Date(currency.lastUpdated).toLocaleString("uk-UA")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(currency)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!currency.isBaseCurrency && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBaseCurrencyMutation.mutate(currency.id)}
                            disabled={setBaseCurrencyMutation.isPending}
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                        )}
                        {!currency.isBaseCurrency && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(currency.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}