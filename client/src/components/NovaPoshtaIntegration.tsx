import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Package, Truck, FileText } from "lucide-react";

interface City {
  ref: string;
  name: string;
  area: string;
}

interface Warehouse {
  ref: string;
  number: string;
  description: string;
  shortAddress: string;
  phone: string;
  schedule: any;
}

interface TrackingInfo {
  Number: string;
  Status: string;
  StatusCode: string;
  RecipientFullName: string;
  CityRecipient: string;
  WarehouseRecipient: string;
  DateCreated: string;
  ActualDeliveryDate: string;
  DocumentWeight: string;
  DocumentCost: string;
}

interface DeliveryCost {
  Cost: string;
  AssessedCost: string;
  CostRedelivery: string;
}

interface SenderSettings {
  id: number;
  name: string;
  phone: string;
  cityRef: string;
  cityName: string;
  warehouseRef: string;
  warehouseAddress: string;
  isDefault: boolean;
}

interface CustomerAddress {
  id: number;
  customerName: string;
  customerPhone: string;
  cityRef: string;
  cityName: string;
  warehouseRef: string;
  warehouseAddress: string;
  isDefault: boolean;
}

interface NovaPoshtaIntegrationProps {
  onAddressSelect?: (address: string, cityRef: string, warehouseRef: string) => void;
  onCostCalculated?: (cost: DeliveryCost) => void;
  orderId?: string;
  trackingNumber?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  declaredValue?: string;
  recipientName?: string;
  recipientPhone?: string;
}

export function NovaPoshtaIntegration({
  onAddressSelect,
  onCostCalculated,
  orderId,
  trackingNumber,
  weight: externalWeight,
  length: externalLength,
  width: externalWidth,
  height: externalHeight,
  declaredValue: externalDeclaredValue,
  recipientName: externalRecipientName,
  recipientPhone: externalRecipientPhone
}: NovaPoshtaIntegrationProps) {
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouseQuery, setWarehouseQuery] = useState("");
  const [weight, setWeight] = useState("");
  const [cost, setCost] = useState("");
  const [deliveryCost, setDeliveryCost] = useState<{ cost: string; estimatedDeliveryDate: string } | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientType, setRecipientType] = useState('Organization'); // PrivatePerson або Organization
  const [description, setDescription] = useState('');
  const [seatsAmount, setSeatsAmount] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [payerType, setPayerType] = useState('Sender');
  const [createdInvoice, setCreatedInvoice] = useState<{ number: string; cost: string } | null>(null);
  
  // Нові стани для відправника та адрес клієнтів
  const [selectedSender, setSelectedSender] = useState<SenderSettings | null>(null);
  const [selectedCustomerAddress, setSelectedCustomerAddress] = useState<CustomerAddress | null>(null);
  const [senderSettings, setSenderSettings] = useState<SenderSettings[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);

  // Завантаження даних при ініціалізації
  useEffect(() => {
    loadSenderSettings();
    loadCustomerAddresses();
    if (orderId) {
      loadOrderDescription();
    }
  }, [orderId]);

  // Автоматичний розрахунок вартості доставки при зміні параметрів
  useEffect(() => {
    if (selectedCity && selectedWarehouse && externalWeight && externalDeclaredValue && selectedSender) {
      calculateDeliveryCost();
    }
  }, [selectedCity, selectedWarehouse, externalWeight, externalDeclaredValue, selectedSender]);

  // Автоматичне заповнення полів отримувача з пропсів
  useEffect(() => {
    if (externalRecipientName) {
      setRecipientName(externalRecipientName);
    }
    if (externalRecipientPhone) {
      setRecipientPhone(externalRecipientPhone);
    }
  }, [externalRecipientName, externalRecipientPhone]);

  // Функція для завантаження опису замовлення
  const loadOrderDescription = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const order = await response.json();
        if (order && order.items && order.items.length > 0) {
          const itemNames = order.items.map((item: any) => item.product?.name || 'Товар').join(', ');
          const orderDescription = itemNames.length > 100 ? itemNames.substring(0, 97) + '...' : itemNames;
          setDescription(orderDescription);
        }
      }
    } catch (error) {
      console.error('Failed to load order description:', error);
    }
  };

  const loadSenderSettings = async () => {
    try {
      const response = await fetch('/api/sender-settings');
      const settings = await response.json();
      setSenderSettings(settings);
      
      // Автоматично вибираємо налаштування за замовчуванням
      const defaultSetting = settings.find((s: SenderSettings) => s.isDefault);
      if (defaultSetting) {
        setSelectedSender(defaultSetting);
      }
    } catch (error) {
      console.error('Failed to load sender settings:', error);
    }
  };

  const loadCustomerAddresses = async () => {
    try {
      const response = await fetch('/api/customer-addresses');
      const addresses = await response.json();
      setCustomerAddresses(addresses);
    } catch (error) {
      console.error('Failed to load customer addresses:', error);
    }
  };

  // Функція розрахунку вартості доставки
  const calculateDeliveryCost = async () => {
    if (!selectedCity || !selectedWarehouse || !externalWeight || !externalDeclaredValue || !selectedSender) return;
    
    try {
      const response = await fetch('/api/nova-poshta/calculate-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CitySender: selectedSender.cityRef,
          CityRecipient: selectedCity.ref,
          Weight: externalWeight,
          ServiceType: 'WarehouseWarehouse',
          Cost: externalDeclaredValue,
          CargoType: 'Cargo',
          SeatsAmount: '1'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('API response:', result);
        
        // Перевірка структури відповіді
        if (result && typeof result === 'object') {
          setDeliveryCost({
            cost: result.Cost || result.cost || 'Не визначено',
            estimatedDeliveryDate: result.EstimatedDeliveryDate || result.estimatedDeliveryDate || 'Не визначено'
          });
          if (onCostCalculated) {
            onCostCalculated({
              Cost: result.Cost || result.cost || 0,
              estimatedDeliveryDate: result.EstimatedDeliveryDate || result.estimatedDeliveryDate || 'Не визначено'
            });
          }
        } else {
          console.error('Неочікувана структура відповіді:', result);
        }
      } else {
        console.error('Помилка API:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Текст помилки:', errorText);
      }
    } catch (error) {
      console.error('Помилка розрахунку вартості:', error);
    }
  };

  // Функція створення накладної
  const createInvoice = async () => {
    if (!selectedCity || !selectedWarehouse || !recipientName || !recipientPhone || !externalWeight || !externalDeclaredValue) return;
    
    try {
      const requestData = {
        cityRecipient: selectedCity.ref,
        warehouseRecipient: selectedWarehouse.ref,
        citySender: selectedSender?.cityRef,
        warehouseSender: selectedSender?.warehouseRef,
        senderName: selectedSender?.name,
        senderPhone: selectedSender?.phone,
        recipientName,
        recipientPhone,
        recipientType,
        description,
        weight: parseFloat(externalWeight),
        cost: parseFloat(externalDeclaredValue),
        seatsAmount: parseInt(seatsAmount),
        paymentMethod,
        payerType,
        orderId
      };
      
      console.log('Sending create invoice request:', JSON.stringify(requestData, null, 2));
      
      const response = await fetch('/api/nova-poshta/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        const result = await response.json();
        setCreatedInvoice({
          number: result.Number,
          cost: result.Cost
        });
      } else {
        const errorData = await response.json();
        console.error('Помилка API:', errorData);
      }
    } catch (error) {
      console.error('Помилка створення накладної:', error);
    }
  };

  // Пошук міст
  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ["/api/nova-poshta/cities", cityQuery],
    queryFn: async () => {
      const response = await fetch(`/api/nova-poshta/cities?q=${encodeURIComponent(cityQuery)}`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return response.json();
    },
    enabled: cityQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // Кеш на 5 хвилин
  });

  // Використовуємо результати сервера без додаткової фільтрації
  const filteredCities = cities;

  // Отримання відділень для обраного міста
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery<Warehouse[]>({
    queryKey: ["/api/nova-poshta/warehouses", selectedCity?.ref],
    queryFn: async () => {
      if (!selectedCity?.ref) throw new Error('No city selected');
      const response = await fetch(`/api/nova-poshta/warehouses/${selectedCity.ref}`);
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      return response.json();
    },
    enabled: !!selectedCity?.ref,
  });

  // Фільтрація відділень по номеру або адресі з пріоритизацією точних співпадінь
  const filteredWarehouses = warehouses.filter(warehouse => {
    if (!warehouseQuery) return true;
    const query = warehouseQuery.toLowerCase();
    return (
      warehouse.number.toLowerCase().includes(query) ||
      warehouse.shortAddress.toLowerCase().includes(query) ||
      warehouse.description.toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    if (!warehouseQuery) return 0;
    
    const query = warehouseQuery.toLowerCase();
    
    // Точне співпадіння номера відділення має найвищий пріоритет
    const aNumberExact = a.number.toLowerCase() === query;
    const bNumberExact = b.number.toLowerCase() === query;
    if (aNumberExact && !bNumberExact) return -1;
    if (!aNumberExact && bNumberExact) return 1;
    
    // Номер відділення починається з запиту
    const aNumberStarts = a.number.toLowerCase().startsWith(query);
    const bNumberStarts = b.number.toLowerCase().startsWith(query);
    if (aNumberStarts && !bNumberStarts) return -1;
    if (!aNumberStarts && bNumberStarts) return 1;
    
    // Адреса починається з запиту
    const aAddressStarts = a.shortAddress.toLowerCase().startsWith(query);
    const bAddressStarts = b.shortAddress.toLowerCase().startsWith(query);
    if (aAddressStarts && !bAddressStarts) return -1;
    if (!aAddressStarts && bAddressStarts) return 1;
    
    // За замовчуванням сортуємо за номером відділення
    return parseInt(a.number) - parseInt(b.number);
  });

  // Дебагінг
  console.log('Warehouses:', warehouses, 'Filtered:', filteredWarehouses, 'Query:', warehouseQuery);

  // Відстеження відвантаження
  const { data: trackingInfo, isLoading: trackingLoading } = useQuery<TrackingInfo>({
    queryKey: ["/api/nova-poshta/track", trackingNumber],
    enabled: !!trackingNumber,
  });



  const handleWarehouseSelect = (warehouseRef: string) => {
    const warehouse = warehouses.find(w => w.ref === warehouseRef);
    if (warehouse && selectedCity) {
      setSelectedWarehouse(warehouse);
      const fullAddress = `${selectedCity.name}, ${warehouse.description}`;
      onAddressSelect?.(fullAddress, selectedCity.ref, warehouse.ref);
    }
  };

  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case "1": return "bg-yellow-500";
      case "2": return "bg-blue-500";
      case "3": return "bg-green-500";
      case "4": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (statusCode: string) => {
    switch (statusCode) {
      case "1": return "Нова пошта отримала";
      case "2": return "Видалено";
      case "3": return "У місті одержувача";
      case "4": return "Отримано";
      case "5": return "Не доставлено";
      case "6": return "Повернуто відправнику";
      case "7": return "Знищено";
      case "8": return "Створено";
      case "9": return "Готовий до доставки";
      case "10": return "Повернено";
      case "11": return "Очікує на складі";
      default: return "Невідомий статус";
    }
  };

  return (
    <div className="space-y-6">
      {/* Вибір адреси доставки */}
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
                <span className="text-green-800">Обрано: {selectedCity.name} ({selectedCity.area})</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedCity(null);
                    setSelectedWarehouse(null);
                    setCityQuery('');
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
                {filteredCities.length > 0 && cityQuery.length >= 2 && !selectedCity && (
                  <div className="mt-2 border border-gray-200 rounded-md bg-white max-h-48 overflow-y-auto">
                    {filteredCities.map((city) => (
                      <div
                        key={city.ref}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        onClick={() => {
                          setSelectedCity(city);
                          setCityQuery(city.name);
                        }}
                      >
                        <div className="font-medium text-sm">{city.name}</div>
                        <div className="text-xs text-gray-500">{city.area}</div>
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

          {selectedCity && (
            <div>
              <label className="text-sm font-medium">
                Відділення в місті {selectedCity.name}
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
                          <p className="font-medium">№{selectedWarehouse.number}</p>
                          <p className="text-sm text-gray-600">{selectedWarehouse.shortAddress}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedWarehouse(null);
                            setWarehouseQuery('');
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
                          {filteredWarehouses.map((warehouse) => (
                            <div
                              key={warehouse.ref}
                              className="px-3 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              onClick={() => {
                                setSelectedWarehouse(warehouse);
                                setWarehouseQuery('');
                                if (onAddressSelect) {
                                  onAddressSelect(
                                    warehouse.shortAddress,
                                    selectedCity?.ref || '',
                                    warehouse.ref
                                  );
                                }
                              }}
                            >
                              <div className="font-medium text-sm">
                                №{warehouse.number}
                              </div>
                              <div className="text-xs text-gray-600">
                                {warehouse.shortAddress}
                              </div>
                              {warehouse.phone && (
                                <div className="text-xs text-gray-500">
                                  {warehouse.phone}
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


        </CardContent>
      </Card>

      {/* Автоматично розрахована вартість доставки */}
      {deliveryCost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Вартість доставки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-800 text-lg">Вартість доставки: {deliveryCost.cost} грн</p>
              <p className="text-sm text-green-600">Орієнтовний час доставки: {deliveryCost.estimatedDeliveryDate}</p>
            </div>
            {externalWeight && externalDeclaredValue && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Параметри відправлення:</p>
                <p className="font-medium">Вага: {externalWeight} кг</p>
                <p className="font-medium">Оголошена вартість: {externalDeclaredValue} грн</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Створення накладної */}
      {selectedCity && selectedWarehouse && deliveryCost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Створення накладної
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Тип отримувача</label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PrivatePerson">Фізична особа</SelectItem>
                  <SelectItem value="Organization">Юридична особа</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  {recipientType === 'Organization' ? 'Назва організації' : 'ПІБ отримувача'}
                </label>
                <Input
                  placeholder={recipientType === 'Organization' ? 'ТОВ "Назва компанії"' : 'Іваненко Іван Іванович'}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Телефон отримувача</label>
                <Input
                  placeholder="+380501234567"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Опис відправлення</label>
              <Input
                placeholder="Документи, товар тощо"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Кількість місць</label>
                <Input
                  type="number"
                  placeholder="1"
                  value={seatsAmount}
                  onChange={(e) => setSeatsAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Тип оплати</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Готівка</SelectItem>
                    <SelectItem value="NonCash">Безготівковий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Хто платить</label>
                <Select value={payerType} onValueChange={setPayerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Отримувач" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sender">Відправник</SelectItem>
                    <SelectItem value="Recipient">Отримувач</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              type="button"
              onClick={createInvoice}
              disabled={!recipientName || !recipientPhone || !description || !seatsAmount || !paymentMethod}
              className="w-full"
            >
              Створити накладну
            </Button>
            
            {createdInvoice && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium">Накладну створено успішно!</p>
                <p className="text-sm">Номер накладної: <span className="font-mono">{createdInvoice.number}</span></p>
                <p className="text-sm text-gray-600">Вартість доставки: {createdInvoice.cost} грн</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.open(`https://novaposhta.ua/tracking/?cargo_number=${createdInvoice.number}`, '_blank')}>
                    Відстежити
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    if (trackingNumber !== createdInvoice.number) {
                      window.location.href = `/shipments?tracking=${createdInvoice.number}`;
                    }
                  }}>
                    Показати статус
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Відстеження відвантаження */}
      {trackingNumber && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Відстеження відвантаження
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trackingLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Завантаження інформації про відстеження...
              </div>
            ) : trackingInfo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(trackingInfo.StatusCode)}>
                    {getStatusText(trackingInfo.StatusCode)}
                  </Badge>
                  <span className="text-sm font-medium">№ {trackingInfo.Number}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Одержувач:</span>
                    <p>{trackingInfo.RecipientFullName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Місто доставки:</span>
                    <p>{trackingInfo.CityRecipient}</p>
                  </div>
                  <div>
                    <span className="font-medium">Відділення:</span>
                    <p>{trackingInfo.WarehouseRecipient}</p>
                  </div>
                  <div>
                    <span className="font-medium">Вага:</span>
                    <p>{trackingInfo.DocumentWeight} кг</p>
                  </div>
                  <div>
                    <span className="font-medium">Дата створення:</span>
                    <p>{new Date(trackingInfo.DateCreated).toLocaleDateString()}</p>
                  </div>
                  {trackingInfo.ActualDeliveryDate && (
                    <div>
                      <span className="font-medium">Дата доставки:</span>
                      <p>{new Date(trackingInfo.ActualDeliveryDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Інформація про відстеження недоступна
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}