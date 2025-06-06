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
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { ClientNovaPoshtaSettings } from "@shared/schema";

const novaPoshtaSettingsSchema = z.object({
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
  onSubmit: (data: FormData) => Promise<void>;
  defaultValues?: ClientNovaPoshtaSettings;
  isLoading?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function NovaPoshtaSettingsForm({ 
  onSubmit,
  defaultValues, 
  isLoading = false,
  onSuccess, 
  onCancel 
}: NovaPoshtaSettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(novaPoshtaSettingsSchema),
    defaultValues: {
      apiKey: defaultValues?.apiKey || "",
      senderRef: defaultValues?.senderRef || "",
      senderCityRef: defaultValues?.senderCityRef || "",
      senderAddress: defaultValues?.senderAddress || "",
      senderContact: defaultValues?.senderContact || "",
      senderPhone: defaultValues?.senderPhone || "",
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast({
        title: "Успіх",
        description: defaultValues ? "Налаштування оновлено успішно" : "Налаштування створено успішно",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося обробити дані",
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
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>API ключ Нової Пошти *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Введіть API ключ"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senderRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Референс відправника</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Референс відправника в НП"
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
                <FormLabel>Референс міста відправника</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Референс міста в НП"
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
              <FormItem>
                <FormLabel>Адреса відправника</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Адреса відправника"
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
                    placeholder="ПІБ контактної особи"
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
                <FormLabel>Телефон відправника</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Активні налаштування</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Використовувати ці налаштування для відправлень
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