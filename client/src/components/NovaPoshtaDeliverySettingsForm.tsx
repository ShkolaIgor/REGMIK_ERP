import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { ClientNovaPoshtaSettings } from "@shared/schema";

const deliverySettingsSchema = z.object({
  // Налаштування отримувача
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  
  // Адреса доставки
  deliveryCityRef: z.string().optional(),
  deliveryCityName: z.string().optional(),
  deliveryWarehouseRef: z.string().optional(),
  deliveryWarehouseAddress: z.string().optional(),
  
  // Налаштування доставки за замовчуванням
  preferredServiceType: z.string().default("WarehouseWarehouse"),
  preferredPaymentMethod: z.string().default("Cash"),
  preferredPayer: z.string().default("Recipient"),
  
  // Додаткові налаштування
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
});

type FormData = z.infer<typeof deliverySettingsSchema>;

interface NovaPoshtaDeliverySettingsFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  defaultValues?: ClientNovaPoshtaSettings;
  isLoading?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function NovaPoshtaDeliverySettingsForm({ 
  onSubmit,
  defaultValues, 
  isLoading = false,
  onSuccess, 
  onCancel 
}: NovaPoshtaDeliverySettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Стан для пошуку міст та відділень
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [warehouseQuery, setWarehouseQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(deliverySettingsSchema),
    defaultValues: {
      recipientName: defaultValues?.recipientName || "",
      recipientPhone: defaultValues?.recipientPhone || "",
      recipientEmail: defaultValues?.recipientEmail || "",
      deliveryCityRef: defaultValues?.deliveryCityRef || "",
      deliveryCityName: defaultValues?.deliveryCityName || "",
      deliveryWarehouseRef: defaultValues?.deliveryWarehouseRef || "",
      deliveryWarehouseAddress: defaultValues?.deliveryWarehouseAddress || "",
      preferredServiceType: defaultValues?.preferredServiceType || "WarehouseWarehouse",
      preferredPaymentMethod: defaultValues?.preferredPaymentMethod || "Cash",
      preferredPayer: defaultValues?.preferredPayer || "Recipient",
      description: defaultValues?.description || "",
      isActive: defaultValues?.isActive ?? true,
      isPrimary: defaultValues?.isPrimary ?? false,
    },
  });

  // Запит для пошуку міст
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/nova-poshta/cities", cityQuery],
    queryFn: async () => {
      if (cityQuery.length < 2) return [];
      const response = await fetch(`/api/nova-poshta/cities?search=${encodeURIComponent(cityQuery)}`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return response.json();
    },
    enabled: cityQuery.length >= 2,
  });

  // Запит для пошуку відділень
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ["/api/nova-poshta/warehouses", selectedCity?.Ref, warehouseQuery],
    queryFn: async () => {
      if (!selectedCity?.Ref) return [];
      const response = await fetch(`/api/nova-poshta/warehouses/${selectedCity.Ref}?search=${encodeURIComponent(warehouseQuery)}`);
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      return response.json();
    },
    enabled: !!selectedCity?.Ref,
  });

  // Ініціалізація форми з даними
  useEffect(() => {
    if (defaultValues?.deliveryCityName) {
      setCityQuery(defaultValues.deliveryCityName);
    }
    if (defaultValues?.deliveryWarehouseAddress) {
      setWarehouseQuery(defaultValues.deliveryWarehouseAddress);
    }
  }, [defaultValues]);

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast({
        title: "Успіх",
        description: defaultValues ? "Налаштування доставки оновлено" : "Налаштування доставки створено",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося зберегти налаштування",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = isLoading || isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Налаштування отримувача */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Налаштування отримувача</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ім'я отримувача</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ПІБ отримувача за замовчуванням"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон отримувача</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+380XXXXXXXXX"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientEmail"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Email отримувача</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Адреса доставки */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Адреса доставки</h3>
          
          {/* Пошук міста і відділення в одному рядку */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Пошук міста */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="deliveryCityName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Місто доставки</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Введіть назву міста"
                          value={cityQuery}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCityQuery(value);
                            field.onChange(value);
                            if (!value) {
                              setSelectedCity(null);
                              form.setValue("deliveryCityRef", "");
                            }
                          }}
                        />
                        {citiesLoading && (
                          <div className="absolute right-2 top-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                        {cities.length > 0 && cityQuery.length >= 2 && !selectedCity && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {cities.slice(0, 10).map((city: any) => (
                              <div
                                key={city.Ref}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => {
                                  setSelectedCity(city);
                                  setCityQuery(city.Description);
                                  form.setValue("deliveryCityName", city.Description);
                                  form.setValue("deliveryCityRef", city.Ref);
                                  setSelectedWarehouse(null);
                                  setWarehouseQuery("");
                                  form.setValue("deliveryWarehouseAddress", "");
                                  form.setValue("deliveryWarehouseRef", "");
                                }}
                              >
                                <div className="font-medium text-sm">{city.Description}</div>
                                <div className="text-xs text-gray-500">{city.AreaDescription}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryCityRef"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Пошук відділення */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="deliveryWarehouseAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Відділення</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder={selectedCity ? "Введіть номер або адресу відділення" : "Спочатку оберіть місто"}
                          value={warehouseQuery}
                          disabled={!selectedCity}
                          onChange={(e) => {
                            const value = e.target.value;
                            setWarehouseQuery(value);
                            field.onChange(value);
                            if (!value) {
                              setSelectedWarehouse(null);
                              form.setValue("deliveryWarehouseRef", "");
                            }
                          }}
                        />
                        {warehousesLoading && selectedCity && (
                          <div className="absolute right-2 top-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                        {warehouses.length > 0 && selectedCity && !selectedWarehouse && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {warehouses.slice(0, 10).map((warehouse: any) => (
                              <div
                                key={warehouse.ref}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => {
                                  setSelectedWarehouse(warehouse);
                                  const fullAddress = `№${warehouse.number}: ${warehouse.short_address}`;
                                  setWarehouseQuery(fullAddress);
                                  form.setValue("deliveryWarehouseAddress", fullAddress);
                                  form.setValue("deliveryWarehouseRef", warehouse.ref);
                                }}
                              >
                                <div className="font-medium text-sm">№{warehouse.number}</div>
                                <div className="text-xs text-gray-500">{warehouse.short_address}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryWarehouseRef"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Налаштування доставки */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Налаштування доставки</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="preferredServiceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип доставки</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть тип доставки" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WarehouseWarehouse">Відділення - Відділення</SelectItem>
                      <SelectItem value="WarehouseDoors">Відділення - Двері</SelectItem>
                      <SelectItem value="DoorsWarehouse">Двері - Відділення</SelectItem>
                      <SelectItem value="DoorsDoors">Двері - Двері</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredPaymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Спосіб оплати</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть спосіб оплати" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cash">Готівка</SelectItem>
                      <SelectItem value="NonCash">Безготівкова</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredPayer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Платник</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть платника" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sender">Відправник</SelectItem>
                      <SelectItem value="Recipient">Отримувач</SelectItem>
                      <SelectItem value="ThirdPerson">Третя особа</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Додаткові налаштування */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Додаткові налаштування</h3>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Опис</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Додаткові коментарі або інструкції"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Активні налаштування</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Використовувати для нових відправлень
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
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Основні налаштування</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Використовувати як налаштування за замовчуванням
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
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Скасувати
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading}
          >
            {loading ? "Збереження..." : defaultValues ? "Оновити" : "Створити"}
          </Button>
        </div>
      </form>
    </Form>
  );
}