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
      throw new Error('NOVA_POSHTA_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
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
    const response = await this.makeRequest<DeliveryCost>('InternetDocument', 'getDocumentPrice', params);
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
}

export const novaPoshtaApi = new NovaPoshtaApi();
export type { City, Warehouse, TrackingInfo, DeliveryCost, DeliveryCostRequest };