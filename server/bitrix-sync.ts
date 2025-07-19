import { storage } from "./storage";
import type { InsertClient, InsertOrder, InsertOrderItem, InsertProduct } from "@shared/schema";

// Функція конвертації валютного коду
function convertCurrencyCode(currencyCode: string): string {
  const currencyMap: Record<string, string> = {
    '980': 'UAH',  // Україна гривня
    '840': 'USD',  // США долар
    '978': 'EUR',  // Євро
    '643': 'RUB',  // Російський рубль
    '985': 'PLN'   // Польський злотий
  };
  
  return currencyMap[currencyCode] || currencyCode;
}

// Типи для Бітрікс24 API
interface BitrixCompanyData {
  ID: string;
  TITLE: string;
  PHONE?: Array<{ VALUE: string }>;
  EMAIL?: Array<{ VALUE: string }>;
}

interface BitrixRequisite {
  ID: string;
  RQ_COMPANY_FULL_NAME: string;
  RQ_INN?: string;
  RQ_EDRPOU?: string;
  PRESET_ID?: number;
}

interface BitrixInvoiceData {
  ID: string;
  ACCOUNT_NUMBER: string;
  DATE: string;
  PRICE: number;
  CURRENCY: string;
  COMPANY: string;
  CLIENT: string;
  MANAGER?: string;
  STATUS?: string;
}

interface BitrixInvoiceItem {
  productName: string;
  quantity: number;
  price: number;
  priceAccount: number;
  priceNetto: number;
  priceBrutto: number;
  priceExclusive: number;
  productCode: string;
  type: number;
  measureName: string;
  discountSum: number;
  taxRate: number;
}

interface BitrixInvoiceItems {
  productRows: BitrixInvoiceItem[];
}

/**
 * Отримати дані підприємства з Бітрікс24
 */
async function getCompanyData(companyId: string): Promise<BitrixCompanyData | null> {
  // Тут має бути виклик до Бітрікс24 REST API для отримання даних компанії
  // Наприклад: crm.company.get?id=${companyId}
  console.log(`Отримання даних компанії з Бітрікс24: ${companyId}`);
  return null; // Заглушка - користувач має налаштувати API
}

/**
 * Отримати реквізити підприємства з Бітрікс24
 */
async function getCompanyRequisite(companyId: string): Promise<BitrixRequisite | null> {
  // Тут має бути виклик до Бітрікс24 REST API для отримання реквізитів
  // Наприклад: crm.requisite.list?filter[ENTITY_ID]=${companyId}
  console.log(`Отримання реквізитів компанії з Бітрікс24: ${companyId}`);
  return null; // Заглушка - користувач має налаштувати API
}

/**
 * Отримати адресу підприємства з Бітрікс24
 */
async function getCompanyAddress(requisiteId: string): Promise<string> {
  // Тут має бути виклик до Бітрікс24 REST API для отримання адреси
  // Наприклад: crm.address.list?filter[ENTITY_ID]=${requisiteId}
  console.log(`Отримання адреси з Бітрікс24: ${requisiteId}`);
  return ""; // Заглушка - користувач має налаштувати API
}

/**
 * Отримати товари рахунку з Бітрікс24
 */
async function getOrderItemsFromBitrix(invoiceId: string): Promise<BitrixInvoiceItems | null> {
  // Тут має бути виклик до Бітрікс24 REST API для отримання товарів рахунку
  // Наприклад: crm.deal.productrows.get?id=${invoiceId}
  console.log(`Отримання товарів рахунку з Бітрікс24: ${invoiceId}`);
  return null; // Заглушка - користувач має налаштувати API
}

/**
 * Синхронізувати дані компанії з Бітрікс24 до нашої ERP
 */
export async function sendCompanyDataToERP(companyId: string): Promise<{ success: boolean; message: string; clientId?: number }> {
  try {
    // Отримуємо дані з Бітрікс24
    const requisite = await getCompanyRequisite(companyId);
    const company = await getCompanyData(companyId);
    const address = requisite ? await getCompanyAddress(requisite.ID) : "";

    if (!requisite || !company) {
      return {
        success: false,
        message: "Не вдалося отримати дані компанії з Бітрікс24"
      };
    }



    // Визначаємо тип клієнта за замовчуванням (1 - юридична особа)
    let clientTypeId = 1;
    if (requisite.PRESET_ID === 2) {
      clientTypeId = 2; // фізична особа
    }

    // Формуємо дані для створення клієнта в ERP
    const clientData: InsertClient = {
      name: requisite.RQ_COMPANY_FULL_NAME || company.TITLE,
      fullName: requisite.RQ_COMPANY_FULL_NAME,
      clientTypeId: clientTypeId,
      taxCode: requisite.RQ_INN || null,
      legalAddress: address || null,
      notes: `Синхронізовано з Бітрікс24 (ID: ${companyId})`,
      externalId: companyId,
      source: "bitrix24",
      isCustomer: true,
      isSupplier: false
    };

    // Спочатку спробуємо знайти клієнта за ЄДРПОУ або ІПН
    let existingClient = null;
    if (requisite.RQ_EDRPOU) {
      const clients = await storage.getClients();
      existingClient = clients.find(c => c.taxCode === requisite.RQ_EDRPOU);
    }
    
    let client;
    if (existingClient) {
      // Оновлюємо існуючого клієнта
      client = await storage.updateClient(existingClient.id, clientData);
      console.log(`Оновлено клієнта в ERP: ${client.name} (ID: ${client.id})`);
    } else {
      // Створюємо нового клієнта
      client = await storage.createClient(clientData);
      console.log(`Створено нового клієнта в ERP: ${client.name} (ID: ${client.id})`);
    }

    return {
      success: true,
      message: `Клієнт успішно синхронізований: ${client.name}`,
      clientId: client.id
    };

  } catch (error) {
    console.error("Помилка синхронізації клієнта з Бітрікс24:", error);
    return {
      success: false,
      message: `Помилка синхронізації: ${error instanceof Error ? error.message : "Невідома помилка"}`
    };
  }
}

/**
 * Синхронізувати рахунок з Бітрікс24 до нашої ERP
 */
export async function sendInvoiceToERP(invoiceData: BitrixInvoiceData): Promise<{ success: boolean; message: string; orderId?: number }> {
  try {
    // Спочатку синхронізуємо компанію-клієнта
    const clientSync = await sendCompanyDataToERP(invoiceData.CLIENT);
    if (!clientSync.success || !clientSync.clientId) {
      return {
        success: false,
        message: `Не вдалося синхронізувати клієнта: ${clientSync.message}`
      };
    }

    // Формуємо дані для створення замовлення в ERP
    const orderData: InsertOrder = {
      orderNumber: invoiceData.ACCOUNT_NUMBER,
      clientId: clientSync.clientId,
      status: mapBitrixStatusToERP(invoiceData.STATUS),
      totalAmount: invoiceData.PRICE.toString(),
      notes: `Синхронізовано з Бітрікс24 (ID: ${invoiceData.ID})`
    };

    // Створюємо нове замовлення (спрощена версія)
    const order = await storage.createOrder(orderData);
    console.log(`Створено нове замовлення в ERP: ${order.orderNumber} (ID: ${order.id})`);

    return {
      success: true,
      message: `Рахунок успішно синхронізований: ${order.orderNumber}`,
      orderId: order.id
    };

  } catch (error) {
    console.error("Помилка синхронізації рахунку з Бітрікс24:", error);
    return {
      success: false,
      message: `Помилка синхронізації: ${error instanceof Error ? error.message : "Невідома помилка"}`
    };
  }
}

/**
 * Мапінг статусів Бітрікс24 до статусів ERP
 */
function mapBitrixStatusToERP(bitrixStatus?: string): "pending" | "confirmed" | "in_progress" | "shipped" | "delivered" | "cancelled" {
  switch (bitrixStatus) {
    case "NEW":
    case "PREPARATION":
      return "pending";
    case "PREPAYMENT_INVOICE":
    case "EXECUTING":
      return "confirmed";
    case "FINAL_INVOICE":
      return "in_progress";
    case "SENT":
      return "shipped";
    case "PAID":
    case "WON":
      return "delivered";
    case "LOSE":
    case "DECLINED":
      return "cancelled";
    default:
      return "pending";
  }
}

/**
 * Генерує наступний номер замовлення на основі останнього
 */
function generateNextOrderNumber(lastOrderNumber?: string): string {
  if (!lastOrderNumber) {
    return "ORD-000001";
  }
  
  // Якщо номер має формат ORD-XXXXXX, інкрементуємо
  const match = lastOrderNumber.match(/ORD-(\d+)/);
  if (match) {
    const nextNumber = parseInt(match[1], 10) + 1;
    return `ORD-${nextNumber.toString().padStart(6, '0')}`;
  }
  
  // Якщо номер цифровий, інкрементуємо
  const numericMatch = lastOrderNumber.match(/^\d+$/);
  if (numericMatch) {
    const nextNumber = parseInt(lastOrderNumber, 10) + 1;
    return `ORD-${nextNumber.toString().padStart(6, '0')}`;
  }
  
  // За замовчуванням
  return `ORD-${Date.now().toString().slice(-6)}`;
}

/**
 * Шукає товар в ERP за назвою (точний збіг або часткове співпадіння)
 */
async function findProductByName(productName: string): Promise<any> {
  try {
    const products = await storage.getProducts();
    
    // Спочатку шукаємо точний збіг за назвою
    let product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
    
    if (!product) {
      // Потім шукаємо часткове співпадіння
      product = products.find(p => 
        p.name.toLowerCase().includes(productName.toLowerCase()) ||
        productName.toLowerCase().includes(p.name.toLowerCase())
      );
    }
    
    return product || null;
  } catch (error) {
    console.error("[WEBHOOK ERP] Помилка пошуку товару:", error);
    return null;
  }
}

/**
 * Створює новий товар в ERP на основі позиції з Бітрікс24
 */
async function createProductFromBitrixItem(item: BitrixInvoiceItem): Promise<any> {
  try {
    // Генеруємо унікальний SKU
    const sku = item.productCode || `BTX-${Date.now()}`;
    
    const productData: InsertProduct = {
      name: item.productName,
      sku: sku,
      description: `Товар синхронізований з Бітрікс24. Код: ${item.productCode || 'не вказано'}`,
      isActive: true,
      categoryId: 1, // Використовуємо базову категорію
      costPrice: item.price.toString(),
      retailPrice: item.price.toString(),

    };

    const product = await storage.createProduct(productData);
    console.log(`[WEBHOOK ERP] Автоматично створено товар: ${product.name} (SKU: ${product.sku})`);
    
    return product;
  } catch (error) {
    console.error("[WEBHOOK ERP] Помилка створення товару:", error);
    throw error;
  }
}

/**
 * Масова синхронізація компаній з Бітрікс24
 */
export async function syncAllCompaniesFromBitrix(): Promise<{ success: boolean; message: string; syncedCount: number }> {
  try {
    // Тут має бути виклик до Бітрікс24 REST API для отримання списку компаній
    // Наприклад: crm.company.list
    console.log("Початок масової синхронізації компаній з Бітрікс24...");
    
    let syncedCount = 0;
    // const companies = await getBitrixCompanies(); // Заглушка
    
    // for (const company of companies) {
    //   const result = await sendCompanyDataToERP(company.ID);
    //   if (result.success) {
    //     syncedCount++;
    //   }
    // }

    return {
      success: true,
      message: `Синхронізацію завершено. Оброблено компаній: ${syncedCount}`,
      syncedCount
    };

  } catch (error) {
    console.error("Помилка масової синхронізації:", error);
    return {
      success: false,
      message: `Помилка масової синхронізації: ${error instanceof Error ? error.message : "Невідома помилка"}`,
      syncedCount: 0
    };
  }
}

/**
 * Масова синхронізація рахунків з Бітрікс24
 */
export async function syncAllInvoicesFromBitrix(): Promise<{ success: boolean; message: string; syncedCount: number }> {
  try {
    // Тут має бути виклик до Бітрікс24 REST API для отримання списку рахунків
    // Наприклад: crm.deal.list або crm.quote.list
    console.log("Початок масової синхронізації рахунків з Бітрікс24...");
    
    let syncedCount = 0;
    // const invoices = await getBitrixInvoices(); // Заглушка
    
    // for (const invoice of invoices) {
    //   const result = await sendInvoiceToERP(invoice);
    //   if (result.success) {
    //     syncedCount++;
    //   }
    // }

    return {
      success: true,
      message: `Синхронізацію завершено. Оброблено рахунків: ${syncedCount}`,
      syncedCount
    };

  } catch (error) {
    console.error("Помилка масової синхронізації рахунків:", error);
    return {
      success: false,
      message: `Помилка масової синхронізації: ${error instanceof Error ? error.message : "Невідома помилка"}`,
      syncedCount: 0
    };
  }
}

// ================================
// WEBHOOK ФУНКЦІЇ ДЛЯ ERP
// (Викликаються Бітрікс24 автоматично)
// ================================

/**
 * Функція для відправки даних компанії з Бітрікс24 в ERP
 * Викликається автоматично Бітрікс24 при створенні/оновленні компанії
 * Аналогічна до sendCompanyInfoTo1C з PHP коду
 */
export async function sendCompanyDataToERPWebhook(companyId: string, requisiteId?: string): Promise<{ success: boolean; message: string; clientId?: number }> {
  try {
    console.log(`[WEBHOOK ERP] Початок синхронізації компанії з Бітрікс24: ${companyId}`);

    // Отримуємо дані компанії з Бітрікс24
    const companyData = await getCompanyData(companyId);
    if (!companyData) {
      return {
        success: false,
        message: `Не вдалося отримати дані компанії з Бітрікс24: ${companyId}`
      };
    }

    // Отримуємо реквізити компанії
    const requisite = await getCompanyRequisite(companyId);
    if (!requisite) {
      return {
        success: false,
        message: `Не вдалося отримати реквізити компанії з Бітрікс24: ${companyId}`
      };
    }

    // Отримуємо адресу компанії
    const address = await getCompanyAddress(requisite.ID);

    // Формуємо дані для створення клієнта в ERP
    const clientData: InsertClient = {
      name: companyData.TITLE || requisite.RQ_COMPANY_FULL_NAME,
      fullName: requisite.RQ_COMPANY_FULL_NAME,
      taxCode: requisite.RQ_EDRPOU || requisite.RQ_INN,
      legalAddress: address,
      contactPerson: companyData.PHONE?.[0]?.VALUE || "",
      email: companyData.EMAIL?.[0]?.VALUE || "",
      notes: `Синхронізовано з Бітрікс24 через webhook (ID: ${companyId})`,
      clientTypeId: requisite.PRESET_ID === 2 ? 2 : 1, // 2 - фіз.особа, 1 - юр.особа
      externalId: companyId,
      isCustomer: true,
      isSupplier: false
    };

    // Використовуємо універсальний метод з валідацією ЄДРПОУ
    const client = await storage.findOrCreateClient({
      name: companyData.TITLE || requisite.RQ_COMPANY_FULL_NAME,
      taxCode: requisite.RQ_EDRPOU || requisite.RQ_INN,
      email: companyData.EMAIL?.[0]?.VALUE,
      phone: companyData.PHONE?.[0]?.VALUE,
      address: address,
      clientTypeId: requisite.PRESET_ID === 2 ? 2 : 1,
      source: 'bitrix24'
    });
    
    console.log(`[WEBHOOK ERP] Клієнт оброблений в ERP: ${client.name} (ID: ${client.id})`);
    
    // Оновлюємо додаткові поля якщо потрібно
    if (client.id) {
      await storage.updateClient(client.id, {
        fullName: requisite.RQ_COMPANY_FULL_NAME,
        externalId: companyId,
        isCustomer: true,
        isSupplier: false,
        notes: `Синхронізовано з Бітрікс24 через webhook (ID: ${companyId})`
      });
    }

    // Тепер відправляємо дані в зовнішню ERP систему (аналогічно до sendCompanyInfoTo1C)
    const erpData = {
      NameShort: companyData.TITLE || requisite.RQ_COMPANY_FULL_NAME,
      NameFull: requisite.RQ_COMPANY_FULL_NAME,
      TaxCode: requisite.RQ_EDRPOU || requisite.RQ_INN,
      Address: address,
      Phone: companyData.PHONE?.[0]?.VALUE || "",
      Email: companyData.EMAIL?.[0]?.VALUE || "",
      BitrixId: companyId,
      Type: requisite.PRESET_ID === 2 ? "Individual" : "Legal"
    };

    try {
      const erpResponse = await fetch("https://erp.regmik.ua/bitrix/hs/sync/receive_company/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from("ШкоМ.:100").toString("base64")
        },
        body: JSON.stringify(erpData)
      });

      if (!erpResponse.ok) {
        console.log(`[WEBHOOK ERP] Помилка відправки в зовнішню ERP: ${erpResponse.status}`);
      } else {
        console.log(`[WEBHOOK ERP] Дані успішно відправлені в зовнішню ERP систему`);
      }
    } catch (erpError) {
      console.log(`[WEBHOOK ERP] Помилка з'єднання з зовнішньою ERP: ${erpError}`);
    }

    return {
      success: true,
      message: `[ERP] Клієнт успішно синхронізований: ${client.name}`,
      clientId: client.id
    };

  } catch (error) {
    console.error("[WEBHOOK ERP] Помилка синхронізації компанії з Бітрікс24:", error);
    return {
      success: false,
      message: `[ERP] Помилка синхронізації: ${error instanceof Error ? error.message : "Невідома помилка"}`
    };
  }
}

/**
 * Функція для відправки даних рахунку з Бітрікс24 в ERP
 * Викликається автоматично Бітрікс24 при створенні/оновленні рахунку
 * Аналогічна до sendInvoiceTo1C
 */
export async function sendInvoiceToERPWebhook(invoiceData: BitrixInvoiceData): Promise<{ success: boolean; message: string; orderId?: number }> {
  try {
    console.log(`[WEBHOOK ERP] Початок синхронізації рахунку з Бітрікс24: ${invoiceData.ID}`);

    // Спочатку синхронізуємо компанію-клієнта через webhook функцію
    const clientSync = await sendCompanyDataToERPWebhook(invoiceData.CLIENT);
    if (!clientSync.success || !clientSync.clientId) {
      return {
        success: false,
        message: `[ERP] Не вдалося синхронізувати клієнта: ${clientSync.message}`
      };
    }

    // Генеруємо автоматичний номер замовлення як інкремент останнього
    const orders = await storage.getOrders();
    const lastOrder = orders.length > 0 ? orders[orders.length - 1] : null;
    const nextOrderNumber = generateNextOrderNumber(lastOrder?.orderNumber);

    // Формуємо дані для створення замовлення в ERP
    const orderData: InsertOrder = {
      orderNumber: nextOrderNumber,
      clientId: clientSync.clientId,
      status: mapBitrixStatusToERP(invoiceData.STATUS),
      totalAmount: invoiceData.PRICE.toString(),
      notes: `Синхронізовано з Бітрікс24 через webhook (ID: ${invoiceData.ID}, рахунок: ${invoiceData.ACCOUNT_NUMBER})`
    };

    // Створюємо нове замовлення
    const order = await storage.createOrder(orderData);
    console.log(`[WEBHOOK ERP] Створено нове замовлення в ERP: ${order.orderNumber} (ID: ${order.id})`);

    // Отримуємо позиції рахунку з Бітрікс24
    const invoiceItems = await getOrderItemsFromBitrix(invoiceData.ID);
    if (invoiceItems && invoiceItems.productRows.length > 0) {
      console.log(`[WEBHOOK ERP] Обробка ${invoiceItems.productRows.length} позицій рахунку`);
      
      for (const item of invoiceItems.productRows) {
        // Шукаємо товар в ERP за назвою
        let product = await findProductByName(item.productName);
        
        if (!product) {
          // Створюємо новий товар, якщо не знайдено
          product = await createProductFromBitrixItem(item);
          console.log(`[WEBHOOK ERP] Створено новий товар: ${product.name} (SKU: ${product.sku})`);
        }

        // Створюємо позицію замовлення
        const orderItemData: InsertOrderItem = {
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          unitPrice: item.price.toString(),
          totalPrice: item.priceBrutto.toString(),
          notes: `Товар з Бітрікс24: ${item.productCode || 'без коду'}`
        };

        await storage.createOrderItem(orderItemData);
        console.log(`[WEBHOOK ERP] Додано позицію: ${product.name} x${item.quantity}`);
      }
    }

    // Відправляємо дані рахунку в зовнішню ERP систему (аналогічно до sendInvoiceTo1C)
    const erpInvoiceData = {
      InvoiceNumber: invoiceData.ACCOUNT_NUMBER,
      InvoiceDate: invoiceData.DATE,
      TotalAmount: invoiceData.PRICE,
      Currency: convertCurrencyCode(invoiceData.CURRENCY) || "UAH",
      ClientId: invoiceData.CLIENT,
      Status: invoiceData.STATUS,
      BitrixId: invoiceData.ID,
      Manager: invoiceData.MANAGER || ""
    };

    try {
      const erpResponse = await fetch("https://erp.regmik.ua/bitrix/hs/sync/receive_invoice/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from("ШкоМ.:100").toString("base64")
        },
        body: JSON.stringify(erpInvoiceData)
      });

      if (!erpResponse.ok) {
        console.log(`[WEBHOOK ERP] Помилка відправки рахунку в зовнішню ERP: ${erpResponse.status}`);
      } else {
        console.log(`[WEBHOOK ERP] Рахунок успішно відправлений в зовнішню ERP систему`);
      }
    } catch (erpError) {
      console.log(`[WEBHOOK ERP] Помилка з'єднання з зовнішньою ERP при відправці рахунку: ${erpError}`);
    }

    return {
      success: true,
      message: `[ERP] Рахунок успішно синхронізований: ${order.orderNumber}`,
      orderId: order.id
    };

  } catch (error) {
    console.error("[WEBHOOK ERP] Помилка синхронізації рахунку з Бітрікс24:", error);
    return {
      success: false,
      message: `[ERP] Помилка синхронізації: ${error instanceof Error ? error.message : "Невідома помилка"}`
    };
  }
}