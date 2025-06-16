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
import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
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
  discount: z.string().optional().transform(val => val || "0.00"),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  carrierId: z.number().optional(),
  cityRef: z.string().optional(),
  warehouseRef: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

interface ClientFormProps {
  editingClient?: any | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  prefillName?: string;
}

export function ClientForm({ editingClient, onSubmit, onCancel, isLoading, prefillName }: ClientFormProps) {
  const { toast } = useToast();
  const fullNameInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: clientTypes } = useQuery({ queryKey: ["/api/client-types"] });
  const { data: carriers } = useQuery({ queryKey: ["/api/carriers"] });

  // Nova Poshta state
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | undefined>();
  const [cityQuery, setCityQuery] = useState('');
  const [warehouseQuery, setWarehouseQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

  // Nova Poshta data queries
  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/nova-poshta/cities", cityQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (cityQuery) {
        params.set('q', cityQuery);
      }
      const response = await fetch(`/api/nova-poshta/cities?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      return response.json();
    },
    enabled: cityQuery.length >= 2 && selectedCarrierId === 4,
  });

  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ["/api/nova-poshta/warehouses", selectedCity?.Ref],
    queryFn: () => fetch(`/api/nova-poshta/warehouses/${selectedCity?.Ref}`).then(res => res.json()),
    enabled: !!selectedCity?.Ref && selectedCarrierId === 4,
  });

  // Filter cities and warehouses
  const filteredCities = cityQuery.length >= 2 ? (cities as any[])?.filter((city: any) =>
    city.Description.toLowerCase().includes(cityQuery.toLowerCase())
  ) || [] : [];

  const filteredWarehouses = warehouseQuery ? (warehouses as any[])?.filter((warehouse: any) =>
    warehouse.Number.toString().includes(warehouseQuery) ||
    warehouse.ShortAddress.toLowerCase().includes(warehouseQuery.toLowerCase())
  ) || [] : warehouses || [];

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
      notes: "",
      isActive: true,
      carrierId: undefined,
      cityRef: "",
      warehouseRef: ""
    }
  });

  // Initialize form for editing
  useEffect(() => {
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
        notes: editingClient.notes || "",
        isActive: editingClient.isActive ?? true,
        carrierId: editingClient.carrierId || undefined,
        cityRef: editingClient.cityRef || "",
        warehouseRef: editingClient.warehouseRef || ""
      });

      // Set Nova Poshta state
      console.log("Ініціалізація перевізника:", editingClient.carrierId);
      if (editingClient.carrierId) {
        setSelectedCarrierId(editingClient.carrierId);
      } else {
        setSelectedCarrierId(null);
      }
      if (editingClient.cityRef) {
        setCityQuery(""); // Will be set when cities load
      }
    }
  }, [editingClient, form]);

  // Load city by Ref for editing client
  const { data: cityByRef } = useQuery({
    queryKey: ["/api/nova-poshta/city", editingClient?.cityRef],
    queryFn: async () => {
      if (!editingClient?.cityRef) return null;
      const response = await fetch(`/api/nova-poshta/city/${editingClient.cityRef}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!editingClient?.cityRef && selectedCarrierId === 4,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Initialize city from editing client
  useEffect(() => {
    if (cityByRef && editingClient?.cityRef) {
      console.log("Ініціалізація міста:", cityByRef.Description);
      setSelectedCity(cityByRef);
      setCityQuery(cityByRef.Description);
    }
  }, [cityByRef, editingClient?.cityRef]);

  useEffect(() => {
    if (editingClient?.warehouseRef && warehouses) {
      const warehouse = (warehouses as any[])?.find((w: any) => w.Ref === editingClient.warehouseRef);
      if (warehouse) {
        setSelectedWarehouse(warehouse);
        setWarehouseQuery(warehouse.ShortAddress || warehouse.Description);
      }
    }
  }, [editingClient?.warehouseRef, warehouses]);

  // Watch form values
  const watchedClientTypeId = form.watch("clientTypeId");
  const watchedTaxCode = form.watch("taxCode");

  // Get selected client type
  const selectedClientType = clientTypes?.find((type: any) => type.id === watchedClientTypeId);

  // Auto-suggest client type based on tax code
  useEffect(() => {
    if (watchedTaxCode && !editingClient) {
      const cleanCode = watchedTaxCode.replace(/\D/g, '');
      
      if (cleanCode.length === 8 || cleanCode.length === 10) {
        const possibleTypes = (clientTypes as any[])?.filter((type: any) => {
          if (cleanCode.length === 8) return type.name === "Юридична особа";
          if (cleanCode.length === 10) return type.name === "Фізична особа";
          return false;
        }).map((type: any) => type.id) || [];

        if (possibleTypes.length > 0 && possibleTypes[0] !== watchedClientTypeId) {
          const suggestedType = possibleTypes[0];
          form.setValue("clientTypeId", suggestedType);
          
          const clientType = clientTypes?.find((type: any) => type.id === suggestedType);
          toast({
            title: "Тип клієнта встановлено автоматично",
            description: `${cleanCode.length === 8 ? '8-значний код (ЄДРПОУ)' : '10-значний код (ІПН)'} відповідає типу: ${clientType?.name}`,
            duration: 4000,
          });
        }
      }
    }
  }, [watchedTaxCode, clientTypes, form, toast, editingClient, watchedClientTypeId]);

  // Auto-focus full name for legal entities
  useEffect(() => {
    if (selectedClientType?.name === "Юридична особа" && fullNameInputRef.current) {
      fullNameInputRef.current.focus();
    }
  }, [watchedClientTypeId, selectedClientType]);

  // Handlers
  const handleAddressMatch = (checked: boolean) => {
    if (checked) {
      const legalAddress = form.getValues("legalAddress");
      form.setValue("physicalAddress", legalAddress);
    }
  };

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

  const isNovaPoshtaCarrier = selectedCarrierId === 4;

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Скорочена назва *</FormLabel>
                <FormControl>
                  <Input placeholder="ТОВ Приклад" {...field} />
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
                    ref={fullNameInputRef}
                    placeholder="Товариство з обмеженою відповідальністю Приклад" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="legalAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Юридична адреса</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="вул. Хрещатик 1, м. Київ, 01001"
                    {...field} 
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
                <FormLabel>Фізична адреса</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="вул. Хрещатик 1, м. Київ, 01001"
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
                <FormLabel>
                  Фізична адреса збігається з юридичною
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Знижка (%)</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" {...field} />
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
                  onValueChange={(value) => handleCarrierChange(parseInt(value))}
                  value={field.value?.toString() || ""}
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

        {isNovaPoshtaCarrier && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Вибір адреси доставки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Пошук міст...
                      </div>
                    )}
                    {filteredCities && filteredCities.length > 0 && cityQuery.length >= 2 && !selectedCity && (
                      <div className="mt-2 border border-gray-200 rounded-md bg-white max-h-48 overflow-y-auto">
                        {filteredCities.map((city: any) => (
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
                    {cityQuery.length >= 2 && !citiesLoading && (
                      <div className="mt-2 text-xs text-gray-400">
                        Знайдено: {filteredCities?.length || 0} міст для "{cityQuery}"
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
                          {filteredWarehouses && filteredWarehouses.length > 0 && (
                            <div className="mt-2 border border-gray-200 rounded-md bg-white max-h-64 overflow-y-auto">
                              {filteredWarehouses.map((warehouse: any) => (
                                <div
                                  key={warehouse.Ref}
                                  className="px-3 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                  onClick={() => handleWarehouseSelect(warehouse)}
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
                            Всього відділень: {warehouses?.length || 0}
                            {warehouseQuery && ` | Знайдено: ${filteredWarehouses?.length || 0}`}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
                <Textarea placeholder="Додаткова інформація про клієнта..." {...field} />
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
                <FormLabel>
                  Активний клієнт
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} type="button">
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