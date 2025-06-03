import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  useCrossNumbering: z.boolean(),
  globalTemplate: z.string().min(1, "Шаблон є обов'язковим"),
  globalPrefix: z.string().optional(),
  globalStartNumber: z.number().min(1, "Стартовий номер повинен бути більше 0"),
  currentGlobalCounter: z.number().min(0),
  resetCounterPeriod: z.enum(["never", "yearly", "monthly", "daily"]),
});

type FormData = z.infer<typeof formSchema>;

const resetPeriodLabels = {
  never: "Ніколи",
  yearly: "Щорічно",
  monthly: "Щомісяця",
  daily: "Щодня"
};

export default function SerialNumberSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Update form when settings are loaded
  React.useEffect(() => {
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

  // Mutation for updating global settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("/api/serial-number-settings", { method: "PUT", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-number-settings"] });
      toast({
        title: "Успіх",
        description: "Глобальні налаштування серійних номерів оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити налаштування",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating category settings
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/categories/${id}`, { method: "PUT", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити налаштування категорії",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Завантаження...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Налаштування серійних номерів</h1>
      
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Глобальні налаштування</CardTitle>
          <CardDescription>
            Налаштуйте глобальні параметри для системи серійних номерів
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="useCrossNumbering"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Використовувати кросс-нумерацію</FormLabel>
                      <CardDescription>
                        Дозволити використання одного серійного номера для різних категорій товарів
                      </CardDescription>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="globalTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Глобальний шаблон</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="{year}{month:2}{day:2}-{counter:6}" />
                      </FormControl>
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
                        <Input {...field} placeholder="SN" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="globalStartNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Стартовий номер</FormLabel>
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
                          {Object.entries(resetPeriodLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={updateSettingsMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Зберегти глобальні налаштування
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Category Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Налаштування для категорій</CardTitle>
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
          ) : categories && Array.isArray(categories) && categories.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {categories.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((category: any) => (
                <div key={category.id} className="p-4 border rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800">
                  <div className="space-y-2">
                    <h4 className="font-medium text-base">{category.name}</h4>
                    {category.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{category.description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`category-${category.id}-use-serial`} className="text-sm">
                        Використовувати серійні номери
                      </Label>
                      <Switch
                        id={`category-${category.id}-use-serial`}
                        checked={category.useSerialNumbers === true}
                        onCheckedChange={(checked) => {
                          updateCategoryMutation.mutate({
                            id: category.id,
                            data: { useSerialNumbers: checked }
                          });
                        }}
                        disabled={updateCategoryMutation.isPending}
                      />
                    </div>
                    
                    {category.useSerialNumbers && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`category-${category.id}-use-global`} className="text-sm">
                            Використовувати глобальну нумерацію
                          </Label>
                          <Switch
                            id={`category-${category.id}-use-global`}
                            checked={category.useGlobalNumbering === true}
                            onCheckedChange={(checked) => {
                              updateCategoryMutation.mutate({
                                id: category.id,
                                data: { useGlobalNumbering: checked }
                              });
                            }}
                            disabled={updateCategoryMutation.isPending}
                          />
                        </div>

                        {!category.useGlobalNumbering && (
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
                                  Стартовий номер
                                </Label>
                                <Input
                                  id={`category-${category.id}-start`}
                                  type="number"
                                  defaultValue={category.serialNumberStartNumber || 1}
                                  placeholder="1"
                                  className="h-8 text-sm"
                                  onBlur={(e) => {
                                    updateCategoryMutation.mutate({
                                      id: category.id,
                                      data: { serialNumberStartNumber: parseInt(e.target.value) || 1 }
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Категорії не знайдено
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}