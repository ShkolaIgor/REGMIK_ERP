import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { InsertClientNovaPoshtaSettings } from "@shared/schema";

const formSchema = z.object({
  apiKey: z.string().min(1, "API ключ обов'язковий"),
  senderRef: z.string().optional(),
  senderAddress: z.string().optional(),
  senderCityRef: z.string().optional(),
  senderPhone: z.string().optional(),
  senderContact: z.string().optional(),
  defaultServiceType: z.string().default("WarehouseWarehouse"),
  defaultCargoType: z.string().default("Parcel"),
  defaultPaymentMethod: z.string().default("Cash"),
  defaultPayer: z.string().default("Sender"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface NovaPoshtaSettingsFormProps {
  onSubmit: (data: InsertClientNovaPoshtaSettings) => void;
  defaultValues?: Partial<InsertClientNovaPoshtaSettings>;
  isLoading?: boolean;
}

export default function NovaPoshtaSettingsForm({
  onSubmit,
  defaultValues,
  isLoading = false,
}: NovaPoshtaSettingsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: defaultValues?.apiKey || "",
      senderRef: defaultValues?.senderRef || "",
      senderAddress: defaultValues?.senderAddress || "",
      senderCityRef: defaultValues?.senderCityRef || "",
      senderPhone: defaultValues?.senderPhone || "",
      senderContact: defaultValues?.senderContact || "",
      defaultServiceType: defaultValues?.defaultServiceType || "WarehouseWarehouse",
      defaultCargoType: defaultValues?.defaultCargoType || "Parcel",
      defaultPaymentMethod: defaultValues?.defaultPaymentMethod || "Cash",
      defaultPayer: defaultValues?.defaultPayer || "Sender",
      description: defaultValues?.description || "",
      isActive: defaultValues?.isActive ?? true,
      isPrimary: defaultValues?.isPrimary ?? false,
    },
  });

  const handleSubmit = (data: FormValues) => {
    onSubmit(data as InsertClientNovaPoshtaSettings);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* API налаштування */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">API налаштування</h3>
          
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API ключ *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Введіть API ключ Нової Пошти" 
                    {...field} 
                    type="password"
                  />
                </FormControl>
                <FormDescription>
                  API ключ для роботи з сервісом Нової Пошти
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Опис</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Опис налаштувань..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Додатковий опис для ідентифікації налаштувань
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Налаштування відправника */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Налаштування відправника</h3>
          
          <FormField
            control={form.control}
            name="senderRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Референс відправника</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Референс відправника в системі НП"
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
            name="senderCityRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Референс міста відправника</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Референс міста в системі НП"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="senderPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон відправника</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+380..."
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
                      placeholder="П.І.Б. контактної особи"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Налаштування за замовчуванням */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Налаштування за замовчуванням</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="defaultServiceType"
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
              name="defaultCargoType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип вантажу</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть тип вантажу" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Parcel">Посилка</SelectItem>
                      <SelectItem value="Cargo">Вантаж</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultPaymentMethod"
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
              name="defaultPayer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Хто платить</FormLabel>
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
          
          <div className="space-y-3">
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
                    <FormDescription>
                      Чи активні ці налаштування для використання
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrimary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Основні налаштування</FormLabel>
                    <FormDescription>
                      Використовувати ці налаштування за замовчуванням для клієнта
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      </form>
    </Form>
  );
}