import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Currency, InsertCurrency } from "@shared/schema";

const currencyFormSchema = z.object({
  code: z.string().min(3).max(3).toUpperCase(),
  name: z.string().min(1, "Назва валюти обов'язкова"),
  symbol: z.string().optional(),
  decimalPlaces: z.number().min(0).max(6).default(2),
  isBase: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type CurrencyFormData = z.infer<typeof currencyFormSchema>;

export default function CurrenciesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const { toast } = useToast();

  const { data: currencies, isLoading } = useQuery({
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
      decimalPlaces: 2,
      isBase: false,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCurrency) => {
      return await apiRequest("/api/currencies", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Валюту створено успішно",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: `Не вдалося створити валюту: ${error.message}`,
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
      toast({
        title: "Успіх",
        description: "Валюту оновлено успішно",
      });
      setIsDialogOpen(false);
      setEditingCurrency(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: `Не вдалося оновити валюту: ${error.message}`,
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
        description: "Валюту видалено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: `Не вдалося видалити валюту: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    form.reset({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol || "",
      decimalPlaces: currency.decimalPlaces ?? 2,
      isBase: currency.isBase ?? false,
      isActive: currency.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (currency: Currency) => {
    if (currency.isBase) {
      toast({
        title: "Помилка",
        description: "Неможливо видалити базову валюту",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`Ви впевнені, що хочете видалити валюту ${currency.code}?`)) {
      deleteMutation.mutate(currency.id);
    }
  };

  const onSubmit = (data: CurrencyFormData) => {
    if (editingCurrency) {
      updateMutation.mutate({ id: editingCurrency.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setEditingCurrency(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Валюти</h1>
          <p className="text-muted-foreground">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Валюти</h1>
          <p className="text-muted-foreground">
            Управління валютами та курсами обміну
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Додати валюту
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCurrency ? "Редагувати валюту" : "Створити валюту"}
              </DialogTitle>
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
                        <Input
                          placeholder="USD"
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
                      <FormLabel>Символ валюти</FormLabel>
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
                      <FormLabel>Кількість десяткових знаків</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="6"
                          step="1"
                          placeholder="2"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isBase"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Базова валюта</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Базова валюта системи для розрахунків
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
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Активна</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Валюта доступна для використання
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
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього валют</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencies?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активних валют</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencies?.filter((c: Currency) => c.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список валют</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Код</TableHead>
                <TableHead>Назва</TableHead>
                <TableHead>Символ</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Останнє оновлення</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies?.map((currency: Currency) => (
                <TableRow key={currency.id}>
                  <TableCell className="font-medium">{currency.code}</TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell>{currency.symbol}</TableCell>
                  <TableCell>
                    {currency.isBase ? (
                      <Badge variant="outline">Базова валюта</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {currency.isBase && (
                        <Badge variant="secondary">Базова</Badge>
                      )}
                      <Badge variant={currency.isActive ? "default" : "secondary"}>
                        {currency.isActive ? "Активна" : "Неактивна"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {currency.updatedAt ? (
                      new Date(currency.updatedAt).toLocaleDateString()
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(currency)}
                        disabled={currency.isBase}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(currency)}
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
    </div>
  );
}