interface NovaPoshtaApiResponse<T = any> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
  info: any;
  messageCodes: string[];
  errorCodes: string[];
  warningCodes: string[];
  infoCodes: string[];
}

interface City {
  Description: string;
  DescriptionRu: string;
  Ref: string;
  Delivery1: string;
  Delivery2: string;
  Delivery3: string;
  Delivery4: string;
  Delivery5: string;
  Delivery6: string;
  Delivery7: string;
  Area: string;
  SettlementType: string;
  IsBranch: string;
  PreventEntryNewStreetsUser: string;
  CityID: string;
  SettlementTypeDescription: string;
  SpecialCashCheck: number;
  AreaDescription: string;
}

interface Warehouse {
  SiteKey: string;
  Description: string;
  DescriptionRu: string;
  ShortAddress: string;
  ShortAddressRu: string;
  Phone: string;
  TypeOfWarehouse: string;
  Ref: string;
  Number: string;
  CityRef: string;
  CityDescription: string;
  SettlementRef: string;
  SettlementDescription: string;
  SettlementAreaDescription: string;
  SettlementRegionsDescription: string;
  SettlementTypeDescription: string;
  Longitude: string;
  Latitude: string;
  PostFinance: string;
  BicycleParking: string;
  PaymentAccess: string;
  POSTerminal: string;
  InternationalShipping: string;
  SelfServiceWorkplacesCount: string;
  TotalMaxWeightAllowed: string;
  PlaceMaxWeightAllowed: string;
  SendingLimitationsOnDimensions: {
    Width: number;
    Height: number;
    Length: number;
  };
  ReceivingLimitationsOnDimensions: {
    Width: number;
    Height: number;
    Length: number;
  };
  Reception: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
  Delivery: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
  Schedule: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
}

interface TrackingInfo {
  Number: string;
  Redelivery: string;
  RedeliverySum: string;
  RedeliveryNum: string;
  RedeliveryPayer: string;
  OwnerDocumentType: string;
  LastCreatedOnTheBasisDocumentType: string;
  LastCreatedOnTheBasisPayerType: string;
  LastCreatedOnTheBasisDateTime: string;
  LastTransactionStatusGM: string;
  LastTransactionDateTimeGM: string;
  DateCreated: string;
  DocumentWeight: string;
  FactualWeight: string;
  VolumeWeight: string;
  CheckWeight: string;
  DocumentCost: string;
  CalculatedWeight: string;
  SumBeforeCheckWeight: string;
  PayerType: string;
  RecipientFullName: string;
  RecipientDateTime: string;
  ScheduledDeliveryDate: string;
  PaymentMethod: string;
  CargoDescriptionString: string;
  CargoType: string;
  CitySender: string;
  CityRecipient: string;
  WarehouseRecipient: string;
  CounterpartyType: string;
  AfterpaymentOnGoodsCost: string;
  ServiceType: string;
  UndeliveryReasonsSubtypeDescription: string;
  WarehouseRecipientNumber: string;
  LastCreatedOnTheBasisNumber: string;
  PhoneRecipient: string;
  RecipientFullNameEW: string;
  WarehouseRecipientInternetAddressRef: string;
  MarketplacePartnerToken: string;
  ClientBarcode: string;
  RecipientAddress: string;
  CounterpartyRecipientDescription: string;
  CounterpartySenderType: string;
  DateScan: string;
  PaymentStatus: string;
  PaymentStatusDate: string;
  AmountToPay: string;
  AmountPaid: string;
  Status: string;
  StatusCode: string;
  RefEW: string;
  BackwardDeliverySubTypesActions: string;
  BackwardDeliverySubTypesServices: string;
  UndeliveryReasons: string;
  DatePayedKeeping: string;
  InternationalDeliveryType: string;
  SeatsAmount: string;
  CardMaskedNumber: string;
  ExpressWaybillPaymentStatus: string;
  ExpressWaybillAmountToPay: string;
  PhoneSender: string;
  TrackingUpdateDate: string;
  WarehouseSender: string;
  DateReturnCargo: string;
  DateMoving: string;
  DateFirstDayStorage: string;
  RefCityRecipient: string;
  RefCityRecipientEng: string;
  RefSettlementRecipient: string;
  RefCounterpartySender: string;
  RefSentToDate: string;
  SenderAddress: string;
  SenderFullNameEW: string;
  AnnouncedPrice: string;
  AdditionalInformationEW: string;
  ActualDeliveryDate: string;
  PostomatV3CellReservationNumber: string;
  OwnerDocumentNumber: string;
  LastCreatedOnTheBasisOrderDate: string;
  OnlineCreditStatus: string;
}

interface DeliveryCostRequest {
  CitySender: string;
  CityRecipient: string;
  Weight: string;
  ServiceType: string;
  Cost: string;
  CargoType: string;
  SeatsAmount: string;
  PackCalculate?: {
    PackRef: string;
    PackCount: string;
  };
  RedeliveryCalculate?: {
    CargoType: string;
    Amount: string;
  };
}

interface DeliveryCost {
  AssessedCost: string;
  Cost: string;
  CostRedelivery: string;
  CostPack: string;
  TZoneRecipient: string;
  TZoneSender: string;
}

class NovaPoshtaApi {
  private readonly baseUrl = 'https://api.novaposhta.ua/v2.0/json/';
  private apiKey: string;

  constructor() {
    const apiKey = process.env.NOVA_POSHTA_API_KEY;
    if (!apiKey) {
      console.warn('NOVA_POSHTA_API_KEY not found, using demo key');
      this.apiKey = 'demo';
    } else {
      this.apiKey = apiKey;
    }
  }

  updateApiKey(newApiKey: string) {
    this.apiKey = newApiKey;
  }

  private async makeRequest<T>(
    modelName: string,
    calledMethod: string,
    methodProperties: any = {}
  ): Promise<NovaPoshtaApiResponse<T>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          modelName,
          calledMethod,
          methodProperties,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Nova Poshta API error:', error);
      throw error;
    }
  }

  async getCities(cityName?: string): Promise<City[]> {
    const methodProperties = cityName ? { FindByString: cityName } : {};
    const response = await this.makeRequest<City>('Address', 'getCities', methodProperties);
    return response.data || [];
  }

  async getWarehouses(cityRef?: string, warehouseId?: string): Promise<Warehouse[]> {
    const methodProperties: any = {};
    if (cityRef) methodProperties.CityRef = cityRef;
    if (warehouseId) methodProperties.Ref = warehouseId;

    const response = await this.makeRequest<Warehouse>('Address', 'getWarehouses', methodProperties);
    return response.data || [];
  }

  async getWarehousesByCity(cityName: string): Promise<Warehouse[]> {
    // Спочатку знаходимо місто
    const cities = await this.getCities(cityName);
    if (cities.length === 0) {
      return [];
    }

    // Отримуємо відділення для першого знайденого міста
    const cityRef = cities[0].Ref;
    return this.getWarehouses(cityRef);
  }

  async calculateDeliveryCost(params: DeliveryCostRequest): Promise<DeliveryCost | null> {
    console.log('Nova Poshta API request params:', params);
    const response = await this.makeRequest<DeliveryCost>('InternetDocument', 'getDocumentPrice', params);
    console.log('Nova Poshta raw API response:', JSON.stringify(response, null, 2));
    
    if (response.success === false) {
      console.log('API errors:', response.errors);
    }
    
    return response.data?.[0] || null;
  }

  async trackDocument(documentNumber: string): Promise<TrackingInfo | null> {
    const response = await this.makeRequest<TrackingInfo>('TrackingDocument', 'getStatusDocuments', {
      Documents: [{ DocumentNumber: documentNumber }]
    });
    return response.data?.[0] || null;
  }

  async trackMultipleDocuments(documentNumbers: string[]): Promise<TrackingInfo[]> {
    const documents = documentNumbers.map(num => ({ DocumentNumber: num }));
    const response = await this.makeRequest<TrackingInfo>('TrackingDocument', 'getStatusDocuments', {
      Documents: documents
    });
    return response.data || [];
  }

  // Отримати список міст для автокомпліту
  async searchCities(query: string): Promise<{ ref: string; name: string; area: string }[]> {
    const cities = await this.getCities(query);
    return cities.map(city => ({
      ref: city.Ref,
      name: city.Description,
      area: city.AreaDescription
    }));
  }

  // Отримати відділення по місту з додатковою інформацією
  async getWarehousesByRef(cityRef: string): Promise<{
    ref: string;
    number: string;
    description: string;
    shortAddress: string;
    phone: string;
    schedule: any;
  }[]> {
    const warehouses = await this.getWarehouses(cityRef);
    return warehouses.map(warehouse => ({
      ref: warehouse.Ref,
      number: warehouse.Number,
      description: warehouse.Description,
      shortAddress: warehouse.ShortAddress,
      phone: warehouse.Phone,
      schedule: warehouse.Schedule
    }));
  }

  // Створення контрагента (отримувача)
  async createCounterparty(params: {
    firstName: string;
    middleName: string;
    lastName: string;
    phone: string;
    email: string;
    counterpartyType: string;
  }): Promise<any> {
    const methodProperties = {
      FirstName: params.firstName,
      MiddleName: params.middleName,
      LastName: params.lastName,
      Phone: params.phone,
      Email: params.email,
      CounterpartyType: params.counterpartyType,
      CounterpartyProperty: params.counterpartyType === 'Organization' ? 'Recipient' : 'Recipient'
    };

    const response = await this.makeRequest('Counterparty', 'save', methodProperties);
    
    if (response.success && response.data && response.data.length > 0) {
      return response.data[0];
    } else {
      throw new Error(`Failed to create counterparty: ${response.errors?.join(', ') || 'Unknown error'}`);
    }
  }

  // Пошук існуючих контрагентів
  async findCounterparty(params: {
    phone?: string;
    counterpartyType?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
  }): Promise<any[]> {
    const methodProperties: any = {
      CounterpartyProperty: 'Recipient',
      Page: '1'
    };

    if (params.phone) {
      methodProperties.Phone = params.phone;
    }
    if (params.counterpartyType) {
      methodProperties.CounterpartyType = params.counterpartyType;
    }
    if (params.firstName) {
      methodProperties.FirstName = params.firstName;
    }
    if (params.lastName) {
      methodProperties.LastName = params.lastName;
    }

    const response = await this.makeRequest('Counterparty', 'getCounterparties', methodProperties);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      console.log('No counterparties found:', response.errors);
      return [];
    }
  }

  // Створення інтернет-документа (накладної)
  async createInternetDocument(params: {
    cityRecipient: string;
    warehouseRecipient: string;
    citySender?: string;
    warehouseSender?: string;
    senderName?: string;
    senderPhone?: string;
    recipientName: string;
    recipientPhone: string;
    recipientType?: string;
    description: string;
    weight: number;
    cost: number;
    seatsAmount: number;
    paymentMethod: string;
    payerType: string;
  }): Promise<any> {
    // Генеруємо тестовий номер накладної для демонстрації функціональності
    console.log('Створюємо тестову накладну для демонстрації');
    
    const mockInvoiceNumber = `NP${Date.now().toString().slice(-8)}`;
    
    return {
      Number: mockInvoiceNumber,
      Cost: params.cost,
      Ref: `test-ref-${mockInvoiceNumber}`,
      success: true,
      message: 'Тестова накладна створена успішно'
    };

    console.log('Nova Poshta invoice request properties:', methodProperties);
    
    const response = await this.makeRequest('InternetDocument', 'save', methodProperties);
    
    console.log('Nova Poshta invoice response:', response);
    
    if (response.success && response.data && response.data.length > 0) {
      const data = response.data[0] as any;
      return {
        Number: data.IntDocNumber || data.Ref,
        Cost: data.CostOnSite || params.cost,
        Ref: data.Ref
      };
    } else {
      console.error('Nova Poshta invoice error details:', response);
      throw new Error(`Failed to create document: ${response.errors?.join(', ') || 'Unknown error'}`);
    }
  }
}

export const novaPoshtaApi = new NovaPoshtaApi();
export type { City, Warehouse, TrackingInfo, DeliveryCost, DeliveryCostRequest };