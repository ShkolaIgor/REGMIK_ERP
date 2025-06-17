import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Схема валідації з оновленими правилами для taxCode
const formSchema = z.object({
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
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  discount: z.string().optional(),
  carrierId: z.number().optional(),
  cityRef: z.string().optional(),
  warehouseRef: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface ClientFormProps {
  editingClient?: any | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  prefillName?: string;
}

export function ClientForm({ editingClient, onSubmit, onCancel, onDelete, isLoading, prefillName }: ClientFormProps) {
  const { toast } = useToast();
  const fullNameRef = useRef<HTMLInputElement>(null);

  // Data queries
  const { data: clientTypes } = useQuery({ queryKey: ['/api/client-types'] });
  const { data: carriers } = useQuery({ queryKey: ['/api/carriers'] });

  // Nova Poshta state
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>();
  const [cityQuery, setCityQuery] = useState('');
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

  // Determine if Nova Poshta carrier is selected
  const selectedCarrier = (carriers as any[])?.find((carrier: any) => carrier.id === selectedCarrierId);
  const isNovaPoshtaCarrier = selectedCarrier ? 
    selectedCarrier.name.toLowerCase().includes('пошта') || 
    selectedCarrier.name.toLowerCase().includes('nova poshta') ||
    (selectedCarrier.alternativeNames || []).some((altName: string) => 
      altName && altName.toLowerCase().includes('пошта')
    ) : false;

  // Nova Poshta data queries - робоча логіка з відвантажень
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/nova-poshta/cities", cityQuery],
    queryFn: async () => {
      const response = await fetch(`/api/nova-poshta/cities?q=${encodeURIComponent(cityQuery)}`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return response.json();
    },
    enabled: cityQuery.length >= 2 && isNovaPoshtaCarrier && !!selectedCarrierId,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ["/api/nova-poshta/warehouses", selectedCity?.Ref],
    queryFn: () => fetch(`/api/nova-poshta/warehouses/${selectedCity?.Ref}`).then(res => res.json()),
    enabled: !!selectedCity?.Ref && isNovaPoshtaCarrier && !!selectedCarrierId,
  });

  // Використовуємо результати сервера без додаткової фільтрації
  const filteredCities = cities;

  const filteredWarehouses = warehouseQuery ? (warehouses as any[])?.filter((warehouse: any) =>
    warehouse.Number.toString().includes(warehouseQuery) ||
    warehouse.ShortAddress.toLowerCase().includes(warehouseQuery.toLowerCase())
  ) || [] : warehouses || [];

  // Load city by Ref for editing
  const loadCityByRef = React.useCallback(async (cityRef: string) => {
    try {
      const response = await fetch(`/api/nova-poshta/city/${cityRef}`);
      if (response.ok) {
        const city = await response.json();
        if (city) {
          setSelectedCity(city);
          setCityQuery(city.Description);
        }
      }
    } catch (error) {
      console.error('Failed to load city by ref:', error);
    }
  }, []);

  // Load warehouse by Ref for editing
  const loadWarehouseByRef = React.useCallback(async (warehouseRef: string, cityRef: string) => {
    try {
      const response = await fetch(`/api/nova-poshta/warehouses/${cityRef}`);
      if (response.ok) {
        const warehouses = await response.json();
        const warehouse = warehouses.find((w: any) => w.Ref === warehouseRef);
        if (warehouse) {
          setSelectedWarehouse(warehouse);
          setWarehouseQuery(warehouse.ShortAddress);
        }
      }
    } catch (error) {
      console.error('Failed to load warehouse by ref:', error);
    }
  }, []);

  // Form initialization
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taxCode: "",
      clientTypeId: 1,
      name: prefillName || "",
      fullName: "",
      legalAddress: "",
      physicalAddress: "",
      addressesMatch: false,
      discount: "0.00",
      carrierId: undefined,
      cityRef: "",
      warehouseRef: "",
      contactPerson: "",
      phone: "",
      email: "",
      website: "",
      notes: "",
      isActive: true,
    },
  });

  // Watch form values for auto-suggestions
  const watchedTaxCode = form.watch("taxCode");
  const watchedClientTypeId = form.watch("clientTypeId");
  const watchedAddressesMatch = form.watch("addressesMatch");
  const watchedLegalAddress = form.watch("legalAddress");

  // Load existing client data
  useEffect(() => {
    const loadClientData = async () => {
      if (editingClient) {
        form.reset({
          taxCode: editingClient.taxCode || "",
          clientTypeId: editingClient.clientTypeId || 1,
          name: editingClient.name || "",
          fullName: editingClient.fullName || "",
          legalAddress: editingClient.legalAddress || "",
          physicalAddress: editingClient.physicalAddress || "",
          addressesMatch: editingClient.addressesMatch || false,
          discount: editingClient.discount || "0.00",
          carrierId: editingClient.carrierId || undefined,
          cityRef: editingClient.cityRef || "",
          warehouseRef: editingClient.warehouseRef || "",
          contactPerson: editingClient.contactPerson || "",
          phone: editingClient.phone || "",
          email: editingClient.email || "",
          website: editingClient.website || "",
          notes: editingClient.notes || "",
          isActive: editingClient.isActive ?? true,
        });

        // Set Nova Poshta selections if editing
        if (editingClient.carrierId) {
          setSelectedCarrierId(editingClient.carrierId);
          // Explicitly set form value to ensure it's reflected in the UI
          form.setValue("carrierId", editingClient.carrierId);
        }
        
        // Load city data from API if cityRef exists
        if (editingClient.cityRef) {
          await loadCityByRef(editingClient.cityRef);
          // Explicitly set form value after loading
          form.setValue("cityRef", editingClient.cityRef);
        }
        
        // Load warehouse data from API if warehouseRef exists (after city is loaded)
        if (editingClient.warehouseRef && editingClient.cityRef) {
          await loadWarehouseByRef(editingClient.warehouseRef, editingClient.cityRef);
          // Explicitly set form value after loading
          form.setValue("warehouseRef", editingClient.warehouseRef);
        }
      }
    };

    loadClientData();
  }, [editingClient, form, loadCityByRef, loadWarehouseByRef]);

  // Handle carrier changes
  const handleCarrierChange = (carrierId: number) => {
    setSelectedCarrierId(carrierId);
    form.setValue("carrierId", carrierId);
    
    // Clear Nova Poshta selections when changing carrier
    setSelectedCity(null);
    setSelectedWarehouse(null);
    setCityQuery('');
    setWarehouseQuery('');
    form.setValue("cityRef", "");
    form.setValue("warehouseRef", "");
  };

  const handleCitySelect = (city: any) => {
    console.log("Місто обрано:", city.Description, "Ref:", city.Ref);
    setSelectedCity(city);
    setCityQuery(city.Description);
    form.setValue("cityRef", city.Ref);
    
    // Clear warehouse selection
    setSelectedWarehouse(null);
    setWarehouseQuery('');
    form.setValue("warehouseRef", "");
  };

  const handleWarehouseSelect = (warehouse: any) => {
    console.log("Відділення обрано:", warehouse.ShortAddress, "Ref:", warehouse.Ref);
    setSelectedWarehouse(warehouse);
    setWarehouseQuery(warehouse.ShortAddress);
    form.setValue("warehouseRef", warehouse.Ref);
    console.log("Форма оновлена з warehouseRef:", warehouse.Ref);
  };

  const handleFormSubmit = (data: FormData) => {
    console.log("Form submitted with data:", data);
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="taxCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ЄДРПОУ/ІПН</FormLabel>
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
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  value={field.value?.toString()}
                >
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
                <FormLabel>Повна назва</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Товариство з обмеженою відповідальністю 'Компанія'" 
                    {...field}
                    ref={fullNameRef}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="legalAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Юридична адреса</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Вкажіть юридичну адресу" 
                    {...field}
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="physicalAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Фактична адреса</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Вкажіть фактичну адресу" 
                    {...field}
                    className="min-h-[80px]"
                    disabled={watchedAddressesMatch}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="addressesMatch"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Фактична адреса збігається з юридичною
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Контактна особа</FormLabel>
                <FormControl>
                  <Input placeholder="Іван Іванович" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Телефон</FormLabel>
                <FormControl>
                  <Input placeholder="+380671234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="company@example.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Веб-сайт</FormLabel>
                <FormControl>
                  <Input placeholder="https://company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Знижка (%)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="0.00" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="100" 
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
                <Select 
                  onValueChange={(value) => {
                    const carrierId = parseInt(value);
                    field.onChange(carrierId);
                    handleCarrierChange(carrierId);
                  }} 
                  value={field.value?.toString()}
                  key={`carrier-${field.value}`}
                >
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
        </div>

        {/* Nova Poshta Integration */}
        {isNovaPoshtaCarrier && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Інтеграція з Новою Поштою
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* City Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Місто</label>
                  {selectedCity ? (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{selectedCity.Description}</p>
                          <p className="text-sm text-gray-600">{selectedCity.AreaDescription}</p>
                        </div>
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
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Пошук міст...
                        </div>
                      )}
                      {filteredCities.length > 0 && cityQuery.length >= 2 && !selectedCity && (
                        <div className="mt-2 border border-gray-200 rounded-md bg-white max-h-48 overflow-y-auto">
                          {filteredCities.map((city) => (
                            <div
                              key={city.Ref}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              onClick={() => handleCitySelect(city)}
                            >
                              <div className="font-medium text-sm">{city.Description}</div>
                              <div className="text-xs text-gray-500">{city.AreaDescription}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Дебагінг інформація */}
                      {cityQuery.length >= 2 && !citiesLoading && (
                        <div className="mt-2 text-xs text-gray-400">
                          Знайдено: {filteredCities.length} міст для "{cityQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Warehouse Selection */}
                {selectedCity && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Відділення в місті {selectedCity.Description}
                    </label>
                    {warehousesLoading ? (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
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
                          <div className="relative">
                            <Input
                              placeholder="Пошук по номеру відділення або адресі..."
                              value={warehouseQuery}
                              onChange={(e) => setWarehouseQuery(e.target.value)}
                              className="mt-2"
                            />
                            {filteredWarehouses.length > 0 && (
                              <div className="mt-2 border border-gray-200 rounded-md bg-white max-h-64 overflow-y-auto">
                                {filteredWarehouses.map((warehouse: any) => (
                                  <div
                                    key={warehouse.Ref}
                                    className="px-3 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                    onClick={() => {
                                      setSelectedWarehouse(warehouse);
                                      setWarehouseQuery('');
                                      form.setValue("warehouseRef", warehouse.Ref);
                                    }}
                                  >
                                    <div className="flex justify-between">
                                      <div>
                                        <div className="font-medium">№{warehouse.Number}</div>
                                        <div className="text-sm text-gray-600">{warehouse.ShortAddress}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
                  {...field}
                  className="min-h-[100px]"
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
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Активний клієнт
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Активні клієнти відображаються у списках та доступні для вибору
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-between items-center pt-4">
          {editingClient && onDelete ? (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => onDelete(editingClient.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Видалити
            </Button>
          ) : (
            <div></div>
          )}
          
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Скасувати
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Збереження...
                </>
              ) : (
                editingClient ? "Оновити" : "Створити"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}