import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { insertClientSchema, type Client } from "@shared/schema";

// Розширена схема валідації
const formSchema = insertClientSchema.extend({
  taxCode: z.string().min(1, "ЄДРПОУ/ІПН обов'язковий").max(50, "Максимум 50 символів"),
  type: z.enum(["individual", "organization"]),
  name: z.string().min(1, "Скорочена назва обов'язкова"),
  fullName: z.string().optional(),
  legalAddress: z.string().optional(),
  physicalAddress: z.string().optional(), 
  addressesMatch: z.boolean().default(false),
  discount: z.string().optional().transform(val => val || "0.00"),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  carrierId: z.number().optional(),
  cityRef: z.string().optional(),
  warehouseRef: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

interface ClientFormProps {
  editingClient?: Client | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  prefillName?: string;
}

export function ClientForm({ editingClient, onSubmit, onCancel, isLoading, prefillName }: ClientFormProps) {
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>(editingClient?.carrierId || undefined);
  const [selectedCityRef, setSelectedCityRef] = useState<string | undefined>(editingClient?.cityRef || undefined);
  
  // Завантаження перевізників
  const { data: carriers = [] } = useQuery({
    queryKey: ['/api/carriers'],
  });

  // Завантаження міст Нової Пошти
  const { data: cities = [] } = useQuery({
    queryKey: ['/api/nova-poshta/cities'],
    enabled: !!selectedCarrierId && (carriers as any[])?.some((c: any) => c.id === selectedCarrierId && c.name.toLowerCase().includes('пошта'))
  });

  // Завантаження типів клієнтів
  const { data: clientTypes = [] } = useQuery({
    queryKey: ['/api/client-types'],
  });

  // Завантаження відділень Нової Пошти для обраного міста
  const { data: warehouses = [] } = useQuery({
    queryKey: ['/api/nova-poshta/warehouses', selectedCityRef],
    enabled: !!selectedCarrierId && !!selectedCityRef && (carriers as any[])?.some((c: any) => c.id === selectedCarrierId && c.name.toLowerCase().includes('пошта'))
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taxCode: editingClient?.taxCode || "",
      clientTypeId: editingClient?.clientTypeId || 1, // Default to "Юридична особа"
      name: editingClient?.name || prefillName || "",
      fullName: editingClient?.fullName || "",
      legalAddress: editingClient?.legalAddress || "",
      physicalAddress: editingClient?.physicalAddress || "",
      addressesMatch: editingClient?.addressesMatch || false,
      discount: editingClient?.discount || "0.00",
      notes: editingClient?.notes || "",
      isActive: editingClient?.isActive ?? true,
      carrierId: editingClient?.carrierId || undefined,
      cityRef: editingClient?.cityRef || "",
      warehouseRef: editingClient?.warehouseRef || ""
    }
  });

  // Автоматичне фокусування на повній назві при зміні типу на організацію
  useEffect(() => {
    if (form.watch("type") === "organization" && fullNameInputRef.current) {
      fullNameInputRef.current.focus();
    }
  }, [form.watch("type")]);

  // Автоматичне копіювання адреси
  const handleAddressMatch = (checked: boolean) => {
    if (checked) {
      const legalAddress = form.getValues("legalAddress");
      form.setValue("physicalAddress", legalAddress);
    }
  };

  // Обробка зміни перевізника
  const handleCarrierChange = (carrierId: string) => {
    const id = parseInt(carrierId);
    setSelectedCarrierId(id);
    form.setValue("carrierId", id);
    // Очистити вибір міста та відділення при зміні перевізника
    setSelectedCityRef(undefined);
    form.setValue("cityRef", "");
    form.setValue("warehouseRef", "");
  };

  // Обробка зміни міста
  const handleCityChange = (cityRef: string) => {
    setSelectedCityRef(cityRef);
    form.setValue("cityRef", cityRef);
    // Очистити вибір відділення при зміні міста
    form.setValue("warehouseRef", "");
  };

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="taxCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ЄДРПОУ/ІПН *</FormLabel>
                <FormControl>
                  <Input placeholder="12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип клієнта *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="organization">Юридична особа</SelectItem>
                    <SelectItem value="individual">Фізична особа</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Скорочена назва *</FormLabel>
                <FormControl>
                  <Input placeholder="ТОВ Компанія" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {form.watch("type") === "organization" ? "Повна назва" : "Повне ім'я"}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={form.watch("type") === "organization" 
                      ? "Товариство з обмеженою відповідальністю 'Компанія'" 
                      : "Іванов Іван Іванович"
                    } 
                    {...field}
                    ref={fullNameInputRef}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="legalAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Юридична адреса</FormLabel>
              <FormControl>
                <Input placeholder="вул. Примірна, 1, м. Київ, 01001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="addressesMatch"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    handleAddressMatch(checked as boolean);
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Фактична адреса збігається з юридичною</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {!form.watch("addressesMatch") && (
          <FormField
            control={form.control}
            name="physicalAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Фактична адреса</FormLabel>
                <FormControl>
                  <Input placeholder="вул. Фактична, 2, м. Київ, 02002" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="discount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Знижка (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="100" 
                  placeholder="0.00" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="carrierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Перевізник</FormLabel>
              <Select onValueChange={handleCarrierChange} value={field.value?.toString() || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть перевізника" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(carriers as any[])?.map((carrier: any) => (
                    <SelectItem key={carrier.id} value={carrier.id.toString()}>
                      {carrier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedCarrierId && (carriers as any[])?.some((c: any) => c.id === selectedCarrierId && c.name.toLowerCase().includes('пошта')) && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cityRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Місто</FormLabel>
                  <Select 
                    onValueChange={handleCityChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть місто" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(cities as any[])?.map((city: any) => (
                        <SelectItem key={city.ref} value={city.ref}>
                          {city.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="warehouseRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Відділення</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                    disabled={!selectedCityRef}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть відділення" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(warehouses as any[])?.map((warehouse: any) => (
                        <SelectItem key={warehouse.ref} value={warehouse.ref}>
                          {warehouse.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Примітки</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Додаткова інформація про клієнта"
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
                <FormLabel>Активний клієнт</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Скасувати
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Збереження..." : editingClient ? "Оновити" : "Створити"}
          </Button>
        </div>
      </form>
    </Form>
  );
}