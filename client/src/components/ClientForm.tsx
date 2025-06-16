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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { insertClientSchema, type Client } from "@shared/schema";

// Функція для визначення можливих типів клієнта за кодом
const getPossibleClientTypes = (taxCode: string | undefined): number[] => {
  if (!taxCode || taxCode.trim() === '') return [];
  const cleanCode = taxCode.replace(/\D/g, ''); // Видаляємо всі не-цифри
  if (cleanCode.length === 8) {
    return [1, 3]; // Юридична особа, Відокремлений підрозділ (ЄДРПОУ - 8 цифр)
  } else if (cleanCode.length === 10) {
    return [2]; // Фізична особа (ІПН - 10 цифр)
  }
  return [];
};

// Функція для валідації відповідності коду та типу клієнта
const validateTaxCodeAndType = (taxCode: string | undefined, clientTypeId: number): string | null => {
  if (!taxCode || taxCode.trim() === '') return null; // Empty is valid
  const possibleTypes = getPossibleClientTypes(taxCode);
  if (possibleTypes.length > 0 && !possibleTypes.includes(clientTypeId)) {
    const cleanCode = taxCode.replace(/\D/g, '');
    if (cleanCode.length === 8) {
      return "8-значний код (ЄДРПОУ) відповідає юридичній особі або відокремленому підрозділу";
    } else if (cleanCode.length === 10) {
      return "10-значний код (ІПН) відповідає фізичній особі";
    }
  }
  return null;
};

// Розширена схема валідації
const formSchema = insertClientSchema.extend({
  taxCode: z.string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Optional field
      const cleanCode = val.replace(/\D/g, '');
      return cleanCode.length === 8 || cleanCode.length === 10;
    }, "Код повинен містити 8 цифр (ЄДРПОУ) або 10 цифр (ІПН)"),
  clientTypeId: z.number().min(1, "Тип клієнта обов'язковий"),
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
}).refine((data) => {
  const validationError = validateTaxCodeAndType(data.taxCode, data.clientTypeId);
  return !validationError;
}, {
  message: "Невідповідність між кодом та типом клієнта",
  path: ["clientTypeId"]
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
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [warehouseSearchOpen, setWarehouseSearchOpen] = useState(false);
  const [citySearchValue, setCitySearchValue] = useState("");
  const [warehouseSearchValue, setWarehouseSearchValue] = useState("");
  
  // Nova Poshta state
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [cityQuery, setCityQuery] = useState("");
  const [warehouseQuery, setWarehouseQuery] = useState("");
  
  const { toast } = useToast();
  
  // Завантаження перевізників
  const { data: carriers = [] } = useQuery({
    queryKey: ['/api/carriers'],
  });

  // Завантаження міст Нової Пошти з пошуком
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ['/api/nova-poshta/cities', cityQuery],
    queryFn: () => {
      const searchParam = cityQuery ? `?q=${encodeURIComponent(cityQuery)}` : '';
      return fetch(`/api/nova-poshta/cities${searchParam}`).then(res => res.json());
    },
    enabled: !!selectedCarrierId && (carriers as any[])?.some((c: any) => c.id === selectedCarrierId && c.name.toLowerCase().includes('пошта')) && cityQuery.length >= 2
  });

  // Завантаження типів клієнтів
  const { data: clientTypes = [] } = useQuery({
    queryKey: ['/api/client-types'],
  }) as { data: any[] };

  // Завантаження відділень Нової Пошти для обраного міста
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['/api/nova-poshta/warehouses', selectedCityRef, warehouseSearchValue],
    queryFn: () => {
      if (!selectedCityRef) return Promise.resolve([]);
      const searchParam = warehouseSearchValue ? `?q=${encodeURIComponent(warehouseSearchValue)}` : '';
      return fetch(`/api/nova-poshta/warehouses/${selectedCityRef}${searchParam}`).then(res => res.json());
    },
    enabled: !!selectedCarrierId && !!selectedCity?.Ref && (carriers as any[])?.some((c: any) => c.id === selectedCarrierId && c.name.toLowerCase().includes('пошта'))
  });

  // Filter functions for Nova Poshta
  const filteredCities = (cities as any[])?.filter((city: any) =>
    city.Description.toLowerCase().includes(cityQuery.toLowerCase())
  ) || [];

  const filteredWarehouses = (warehouses as any[])?.filter((warehouse: any) =>
    warehouseQuery === '' || 
    warehouse.Number.toString().includes(warehouseQuery) ||
    warehouse.ShortAddress.toLowerCase().includes(warehouseQuery.toLowerCase())
  ) || [];
  
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

  // Ініціалізація форми для редагування клієнта
  useEffect(() => {
    if (editingClient) {
      setSelectedCarrierId(editingClient.carrierId || undefined);
      setSelectedCityRef(editingClient.cityRef || undefined);
      
      // Initialize Nova Poshta state for editing
      if (editingClient.cityRef && editingClient.carrierId) {
        // Find the city from the loaded cities
        const city = (cities as any[])?.find((c: any) => c.Ref === editingClient.cityRef);
        if (city) {
          setSelectedCity(city);
          setCityQuery(city.Description);
        }
        
        // Initialize warehouse if available
        if (editingClient.warehouseRef && warehouses) {
          const warehouse = (warehouses as any[])?.find((w: any) => w.Ref === editingClient.warehouseRef);
          if (warehouse) {
            setSelectedWarehouse(warehouse);
            setWarehouseQuery(warehouse.Description);
          }
        }
      }
      
      // Reset form with editing client data
      form.reset({
        taxCode: editingClient.taxCode || "",
        clientTypeId: editingClient.clientTypeId || 1,
        name: editingClient.name || "",
        fullName: editingClient.fullName || "",
        legalAddress: editingClient.legalAddress || "",
        physicalAddress: editingClient.physicalAddress || "",
        addressesMatch: editingClient.addressesMatch || false,
        discount: editingClient.discount || "0.00",
        notes: editingClient.notes || "",
        isActive: editingClient.isActive ?? true,
        carrierId: editingClient.carrierId || undefined,
        cityRef: editingClient.cityRef || "",
        warehouseRef: editingClient.warehouseRef || ""
      });
    }
  }, [editingClient, form, cities]);

  // Відслідковуємо зміни типу клієнта та коду
  const watchedClientTypeId = form.watch("clientTypeId");
  const watchedTaxCode = form.watch("taxCode");
  const selectedClientType = (clientTypes as any[])?.find((type: any) => type.id === watchedClientTypeId);
  
  // Автоматичне визначення типу клієнта за кодом (тільки для нових клієнтів)
  useEffect(() => {
    if (watchedTaxCode && clientTypes.length > 0 && !editingClient) {
      const possibleTypes = getPossibleClientTypes(watchedTaxCode);
      const currentTypeId = form.getValues("clientTypeId");
      
      if (possibleTypes.length > 0 && !possibleTypes.includes(currentTypeId)) {
        // Автоматично встановлюємо перший можливий тип тільки для нових клієнтів
        const suggestedType = possibleTypes[0];
        form.setValue("clientTypeId", suggestedType);
        
        // Показуємо сповіщення про автоматичну зміну
        const clientType = clientTypes?.find((type: any) => type.id === suggestedType);
        const cleanCode = watchedTaxCode.replace(/\D/g, '');
        
        toast({
          title: "Тип клієнта встановлено автоматично",
          description: `${cleanCode.length === 8 ? '8-значний код (ЄДРПОУ)' : '10-значний код (ІПН)'} відповідає типу: ${clientType?.name}`,
          duration: 4000,
        });
      }
    } else if (watchedTaxCode && clientTypes.length > 0 && editingClient) {
      // Для існуючих клієнтів показуємо тільки попередження про невідповідність
      const possibleTypes = getPossibleClientTypes(watchedTaxCode);
      const currentTypeId = form.getValues("clientTypeId");
      
      if (possibleTypes.length > 0 && !possibleTypes.includes(currentTypeId)) {
        const cleanCode = watchedTaxCode.replace(/\D/g, '');
        
        toast({
          title: "Можлива невідповідність типу клієнта",
          description: `${cleanCode.length === 8 ? '8-значний код (ЄДРПОУ)' : '10-значний код (ІПН)'} зазвичай відповідає іншому типу клієнта`,
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  }, [watchedTaxCode, clientTypes, form, toast, editingClient]);
  
  // Автоматичне фокусування на повній назві при зміні типу на організацію
  useEffect(() => {
    if (selectedClientType?.name === "Юридична особа" && fullNameInputRef.current) {
      fullNameInputRef.current.focus();
    }
  }, [watchedClientTypeId, selectedClientType]);

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
    setSelectedCity(null);
    setSelectedWarehouse(null);
    setSelectedCityRef(undefined);
    setCityQuery('');
    setWarehouseQuery('');
    form.setValue("cityRef", "");
    form.setValue("warehouseRef", "");
  };

  // Обробка зміни міста
  const handleCityChange = (cityRef: string) => {
    const city = (cities as any[])?.find((c: any) => c.Ref === cityRef);
    if (city) {
      setSelectedCity(city);
      setSelectedCityRef(cityRef);
      setCityQuery(city.Description);
      form.setValue("cityRef", cityRef);
      // Очистити вибір відділення при зміні міста
      setSelectedWarehouse(null);
      setWarehouseQuery('');
      form.setValue("warehouseRef", "");
    }
  };

  // Обробка зміни відділення
  const handleWarehouseChange = (warehouseRef: string) => {
    const warehouse = (warehouses as any[])?.find((w: any) => w.Ref === warehouseRef);
    if (warehouse) {
      setSelectedWarehouse(warehouse);
      setWarehouseQuery(warehouse.Description);
      form.setValue("warehouseRef", warehouseRef);
    }
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
            name="clientTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип клієнта *</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(clientTypes as any[])?.map((type: any) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
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
                  {selectedClientType?.name === "Юридична особа" ? "Повна назва" : "Повне ім'я"}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={selectedClientType?.name === "Юридична особа" 
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
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Пошук міста</label>
              {selectedCity ? (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                  <span className="text-green-800">Обрано: {selectedCity.Description} ({selectedCity.AreaDescription})</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedCity(null);
                      setSelectedWarehouse(null);
                      setCityQuery('');
                      form.setValue("cityRef", "");
                      form.setValue("warehouseRef", "");
                    }}
                  >
                    Змінити
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Введіть назву міста..."
                    value={cityQuery}
                    onChange={(e) => setCityQuery(e.target.value)}
                    className="mt-2"
                  />
                  {citiesLoading && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Пошук міст...
                    </div>
                  )}
                  {filteredCities.length > 0 && cityQuery.length >= 2 && !selectedCity && (
                    <div className="mt-2 border border-gray-200 rounded-md bg-white max-h-48 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <div
                          key={city.Ref}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => {
                            setSelectedCity(city);
                            setCityQuery(city.Description);
                            form.setValue("cityRef", city.Ref);
                          }}
                        >
                          <div className="font-medium text-sm">{city.Description}</div>
                          <div className="text-xs text-gray-500">{city.AreaDescription}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {cityQuery.length >= 2 && !citiesLoading && (
                    <div className="mt-2 text-xs text-gray-400">
                      Знайдено: {filteredCities.length} міст для "{cityQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedCity && (
              <div>
                <label className="text-sm font-medium">
                  Відділення в місті {selectedCity.Description}
                </label>
                {warehousesLoading ? (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Завантаження відділень...
                  </div>
                ) : (
                  <div>
                    {selectedWarehouse ? (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">№{selectedWarehouse.Number}</p>
                            <p className="text-sm text-gray-600">{selectedWarehouse.ShortAddress}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWarehouse(null);
                              setWarehouseQuery('');
                              form.setValue("warehouseRef", "");
                            }}
                          >
                            Змінити
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Input
                          placeholder="Пошук відділення за номером або адресою..."
                          value={warehouseQuery}
                          onChange={(e) => setWarehouseQuery(e.target.value)}
                          className="mt-2"
                        />
                        {filteredWarehouses.length > 0 && (
                          <div className="mt-2 border border-gray-200 rounded-md bg-white max-h-48 overflow-y-auto">
                            {filteredWarehouses.slice(0, 20).map((warehouse) => (
                              <div
                                key={warehouse.Ref}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                onClick={() => {
                                  setSelectedWarehouse(warehouse);
                                  setWarehouseQuery(`№${warehouse.Number}`);
                                  form.setValue("warehouseRef", warehouse.Ref);
                                }}
                              >
                                <div className="font-medium text-sm">
                                  №{warehouse.Number}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {warehouse.ShortAddress}
                                </div>
                                {warehouse.Phone && (
                                  <div className="text-xs text-gray-500">
                                    {warehouse.Phone}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-400">
                          Всього відділень: {warehouses.length}
                          {warehouseQuery && ` | Знайдено: ${filteredWarehouses.length}`}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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