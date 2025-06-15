import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="deliveryCityRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Референс міста</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Референс міста в Nova Poshta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryCityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Назва міста</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Назва міста доставки"
                      {...field}
                    />
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
                  <FormLabel>Референс відділення</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Референс відділення Nova Poshta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryWarehouseAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Адреса відділення</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Повна адреса відділення"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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