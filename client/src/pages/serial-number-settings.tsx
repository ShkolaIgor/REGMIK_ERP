import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings, QrCode, Save, RefreshCw, Package, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  useCrossNumbering: z.boolean().default(false),
  globalTemplate: z.string().min(1, "Шаблон обов'язковий"),
  globalPrefix: z.string().optional(),
  globalStartNumber: z.number().min(1, "Початковий номер має бути більше 0"),
  currentGlobalCounter: z.number().min(0),
  resetCounterPeriod: z.enum(["never", "yearly", "monthly", "daily"]),
});

type FormData = z.infer<typeof formSchema>;

const periodLabels = {
  never: "Ніколи",
  yearly: "Щорічно",
  monthly: "Щомісяця",
  daily: "Щодня"
};

export default function SerialNumberSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localCategories, setLocalCategories] = useState<any[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      useCrossNumbering: false,
      globalTemplate: "{year}{month:2}{day:2}-{counter:6}",
      globalPrefix: "",
      globalStartNumber: 1,
      currentGlobalCounter: 0,
      resetCounterPeriod: "never",
    },
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/serial-number-settings"],
  });

  // Update local categories when data loads
  useEffect(() => {
    if (categories) {
      setLocalCategories(categories);
    }
  }, [categories]);

  // Update form when settings are loaded
  useEffect(() => {
    if (settings && !form.formState.isDirty) {
      form.reset({
        useCrossNumbering: (settings as any).useCrossNumbering,
        globalTemplate: (settings as any).globalTemplate || "{year}{month:2}{day:2}-{counter:6}",
        globalPrefix: (settings as any).globalPrefix || "",
        globalStartNumber: (settings as any).globalStartNumber || 1,
        currentGlobalCounter: (settings as any).currentGlobalCounter || 0,
        resetCounterPeriod: (settings as any).resetCounterPeriod || "never",
      });
    }
  }, [settings, form]);

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/categories/${id}`, {
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Успіх",
        description: "Налаштування категорії оновлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити налаштування категорії",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => {
      return apiRequest("/api/serial-number-settings", {
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-number-settings"] });
      toast({
        title: "Успіх",
        description: "Налаштування серійних номерів оновлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити налаштування",
        variant: "destructive",
      });
    },
  });

  // Reset counter mutation
  const resetCounterMutation = useMutation({
    mutationFn: () => {
      const currentData = form.getValues();
      return apiRequest("/api/serial-number-settings", {
        method: "PUT",
        body: {
          ...currentData,
          currentGlobalCounter: 0,
          lastResetDate: new Date().toISOString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-number-settings"] });
      form.setValue("currentGlobalCounter", 0);
      toast({
        title: "Успіх",
        description: "Лічильник скинуто",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося скинути лічильник",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  const handleResetCounter = () => {
    if (confirm("Ви впевнені, що хочете скинути лічильник серійних номерів?")) {
      resetCounterMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Завантаження налаштувань...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Settings className="mr-2 h-6 w-6" />
        <h1 className="text-3xl font-bold">Налаштування серійних номерів</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Глобальні налаштування */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Глобальні налаштування
              </CardTitle>
              <CardDescription>
                Налаштування для автоматичної генерації серійних номерів
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="useCrossNumbering"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Сквозна нумерація
                      </FormLabel>
                      <FormDescription>
                        Використовувати єдину нумерацію для всіх товарів замість окремої для кожної категорії
                      </FormDescription>
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
                name="globalTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Глобальний шаблон</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="{year}{month:2}{day:2}-{counter:6}" />
                    </FormControl>
                    <FormDescription>
                      Доступні змінні: {"{year}"}, {"{month:2}"}, {"{day:2}"}, {"{counter:6}"}, {"{prefix}"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="globalPrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Глобальний префікс</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Наприклад: SN, PRD, MEC" />
                    </FormControl>
                    <FormDescription>
                      Необов'язковий префікс для всіх серійних номерів
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="globalStartNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Початковий номер</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentGlobalCounter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Поточний лічильник</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            readOnly
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleResetCounter}
                          disabled={resetCounterMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        Поточне значення лічильника. Натисніть кнопку для скидання.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="resetCounterPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Період скидання лічильника</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(periodLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Як часто автоматично скидати лічильник
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Налаштування для категорій товарів */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Налаштування серійних номерів для категорій товарів
              </CardTitle>
              <CardDescription>
                Налаштуйте індивідуальні шаблони серійних номерів для кожної категорії товарів
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Завантаження категорій...</span>
                </div>
              ) : localCategories && Array.isArray(localCategories) && localCategories.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {localCategories.map((category: any) => (
                    <div key={category.id} className="p-4 border rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800">
                      <div className="space-y-2">
                        <h4 className="font-medium text-base">{category.name}</h4>
                        {category.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{category.description}</p>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`category-${category.id}-use-serial`}>
                            Використовувати серійні номери
                          </Label>
                          <Switch
                            id={`category-${category.id}-use-serial`}
                            checked={category.hasSerialNumbers === true}
                            onCheckedChange={(checked) => {
                              // Оновлюємо локальний стан негайно
                              setLocalCategories(prev => 
                                prev.map(cat => 
                                  cat.id === category.id 
                                    ? { ...cat, hasSerialNumbers: checked, useGlobalNumbering: checked ? cat.useGlobalNumbering : false }
                                    : cat
                                )
                              );
                              
                              // Відправляємо запит на сервер
                              updateCategoryMutation.mutate({
                                id: category.id,
                                data: { hasSerialNumbers: checked, useGlobalNumbering: checked ? category.useGlobalNumbering : false }
                              }, {
                                onSuccess: () => {
                                  queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
                                },
                                onError: () => {
                                  // Відкатуємо зміни при помилці
                                  setLocalCategories(prev => 
                                    prev.map(cat => 
                                      cat.id === category.id 
                                        ? { ...cat, hasSerialNumbers: !checked }
                                        : cat
                                    )
                                  );
                                }
                              });
                            }}
                            disabled={updateCategoryMutation.isPending}
                          />
                        </div>
                        
                        {category.hasSerialNumbers && (
                          <div className="space-y-2">
                            <Label htmlFor={`category-${category.id}-use-global`}>
                              Використовувати глобальну нумерацію
                            </Label>
                            <Switch
                              id={`category-${category.id}-use-global`}
                              checked={category.useGlobalNumbering !== false}
                              onCheckedChange={(checked) => {
                                // Оновлюємо локальний стан негайно
                                setLocalCategories(prev => 
                                  prev.map(cat => 
                                    cat.id === category.id 
                                      ? { ...cat, useGlobalNumbering: checked }
                                      : cat
                                  )
                                );
                                
                                // Відправляємо запит на сервер
                                updateCategoryMutation.mutate({
                                  id: category.id,
                                  data: { useGlobalNumbering: checked }
                                }, {
                                  onSuccess: () => {
                                    queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
                                  },
                                  onError: () => {
                                    // Відкатуємо зміни при помилці
                                    setLocalCategories(prev => 
                                      prev.map(cat => 
                                        cat.id === category.id 
                                          ? { ...cat, useGlobalNumbering: !checked }
                                          : cat
                                      )
                                    );
                                  }
                                });
                              }}
                              disabled={updateCategoryMutation.isPending}
                            />
                          </div>
                        )}
                      </div>

                      {category.hasSerialNumbers && !category.useGlobalNumbering && (
                        <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="space-y-2">
                            <Label htmlFor={`category-${category.id}-template`} className="text-xs">
                              Шаблон серійного номера
                            </Label>
                            <Input
                              id={`category-${category.id}-template`}
                              defaultValue={category.serialNumberTemplate || ''}
                              placeholder="{prefix}-{year}-{counter:4}"
                              className="h-8 text-sm"
                              onBlur={(e) => {
                                updateCategoryMutation.mutate({
                                  id: category.id,
                                  data: { serialNumberTemplate: e.target.value }
                                });
                              }}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label htmlFor={`category-${category.id}-prefix`} className="text-xs">
                                Префікс
                              </Label>
                              <Input
                                id={`category-${category.id}-prefix`}
                                defaultValue={category.serialNumberPrefix || ''}
                                placeholder="CAT"
                                className="h-8 text-sm"
                                onBlur={(e) => {
                                  updateCategoryMutation.mutate({
                                    id: category.id,
                                    data: { serialNumberPrefix: e.target.value }
                                  });
                                }}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`category-${category.id}-start`} className="text-xs">
                                Початк. номер
                              </Label>
                              <Input
                                id={`category-${category.id}-start`}
                                type="number"
                                defaultValue={category.serialNumberStartNumber || 1}
                                min="1"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}


                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Немає доступних категорій товарів
                </div>
              )}
            </CardContent>
          </Card>

          {/* Приклади шаблонів */}
          <Card>
            <CardHeader>
              <CardTitle>Приклади шаблонів</CardTitle>
              <CardDescription>
                Зразки шаблонів для різних типів нумерації
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Дата + лічильник:</strong> {"{year}{month:2}{day:2}-{counter:6}"} → 20250603-000001</div>
                <div><strong>Префікс + рік + лічільник:</strong> {"{prefix}-{year}-{counter:4}"} → MEC-2025-0001</div>
                <div><strong>Простий лічильник:</strong> {"{counter:8}"} → 00000001</div>
                <div><strong>Місяць/рік + лічільник:</strong> {"{month:2}{year}-{counter:5}"} → 062025-00001</div>
              </div>
            </CardContent>
          </Card>

          {/* Кнопки управління */}
          <div className="flex justify-end space-x-2">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? "Збереження..." : "Зберегти"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}