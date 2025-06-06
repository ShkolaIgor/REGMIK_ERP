import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import type { ClientNovaPoshtaSettings, InsertClientNovaPoshtaSettings } from "@shared/schema";

const novaPoshtaSettingsSchema = z.object({
  clientId: z.number(),
  apiKey: z.string().min(1, "API ключ обов'язковий"),
  senderRef: z.string().optional(),
  senderCityRef: z.string().optional(),
  senderAddress: z.string().optional(),
  senderContact: z.string().optional(),
  senderPhone: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof novaPoshtaSettingsSchema>;

interface NovaPoshtaSettingsFormProps {
  clientId: number;
  settings?: ClientNovaPoshtaSettings;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function NovaPoshtaSettingsForm({ 
  clientId, 
  settings, 
  onSuccess, 
  onCancel 
}: NovaPoshtaSettingsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(novaPoshtaSettingsSchema),
    defaultValues: {
      clientId,
      apiKey: settings?.apiKey || "",
      senderCity: settings?.senderCity || "",
      senderCityRef: settings?.senderCityRef || "",
      senderWarehouse: settings?.senderWarehouse || "",
      senderWarehouseRef: settings?.senderWarehouseRef || "",
      senderAddress: settings?.senderAddress || "",
      senderContact: settings?.senderContact || "",
      senderPhone: settings?.senderPhone || "",
      isActive: settings?.isActive ?? true,
      notes: settings?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const insertData: InsertClientNovaPoshtaSettings = {
        clientId: data.clientId,
        apiKey: data.apiKey,
        senderCity: data.senderCity || null,
        senderCityRef: data.senderCityRef || null,
        senderWarehouse: data.senderWarehouse || null,
        senderWarehouseRef: data.senderWarehouseRef || null,
        senderAddress: data.senderAddress || null,
        senderContact: data.senderContact || null,
        senderPhone: data.senderPhone || null,
        isActive: data.isActive,
        notes: data.notes || null,
      };
      
      return await apiRequest("/api/client-nova-poshta-settings", {
        method: "POST",
        body: insertData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-nova-poshta-settings"] });
      toast({
        title: "Успіх",
        description: "Налаштування Нової Пошти створено успішно",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити налаштування",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const updateData: Partial<InsertClientNovaPoshtaSettings> = {
        apiKey: data.apiKey,
        senderCity: data.senderCity || null,
        senderCityRef: data.senderCityRef || null,
        senderWarehouse: data.senderWarehouse || null,
        senderWarehouseRef: data.senderWarehouseRef || null,
        senderAddress: data.senderAddress || null,
        senderContact: data.senderContact || null,
        senderPhone: data.senderPhone || null,
        isActive: data.isActive,
        notes: data.notes || null,
      };
      
      return await apiRequest(`/api/client-nova-poshta-settings/${settings!.id}`, {
        method: "PATCH",
        body: updateData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-nova-poshta-settings"] });
      toast({
        title: "Успіх",
        description: "Налаштування Нової Пошти оновлено успішно",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити налаштування",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (settings) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>API ключ Нової Пошти *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senderCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Місто відправника</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Київ"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senderCityRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ref міста відправника</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="8d5a980d-391c-11dd-90d9-001a92567626"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senderWarehouse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Відділення відправника</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Відділення №1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senderWarehouseRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ref відділення відправника</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="1ec09d88-e1c2-11e3-8c4a-0050568002cf"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senderAddress"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Адреса відправника</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="м. Київ, вул. Хрещатик, 1"
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senderContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Контактна особа</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Іван Іванович"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senderPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Телефон контакту</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+380501234567"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Примітки</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Додаткові примітки до налаштувань"
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Активні налаштування</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Скасувати
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {settings ? "Оновити" : "Створити"}
          </Button>
        </div>
      </form>
    </Form>
  );
}