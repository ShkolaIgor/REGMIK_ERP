import { storage } from "./storage";
import type { InsertClient, InsertOrder, InsertOrderItem } from "@shared/schema";

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

    // Перевіряємо чи існує клієнт з таким external_id
    const existingClient = await storage.getClientByExternalId(companyId);
    
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

    // Отримуємо товари рахунку
    const items = await getOrderItemsFromBitrix(invoiceData.ID);

    // Формуємо дані для створення замовлення в ERP
    const orderData: InsertOrder = {
      orderNumber: invoiceData.ACCOUNT_NUMBER,
      clientId: clientSync.clientId,
      status: mapBitrixStatusToERP(invoiceData.STATUS),
      totalAmount: invoiceData.PRICE,
      currency: invoiceData.CURRENCY || "UAH",
      orderDate: new Date(invoiceData.DATE),
      notes: `Синхронізовано з Бітрікс24 (ID: ${invoiceData.ID})`,
      externalId: invoiceData.ID
    };

    // Перевіряємо чи існує замовлення з таким external_id
    const existingOrder = await storage.getOrderByExternalId(invoiceData.ID);
    
    let order;
    if (existingOrder) {
      // Оновлюємо існуюче замовлення
      order = await storage.updateOrder(existingOrder.id, orderData);
      console.log(`Оновлено замовлення в ERP: ${order.orderNumber} (ID: ${order.id})`);
    } else {
      // Створюємо нове замовлення
      order = await storage.createOrder(orderData);
      console.log(`Створено нове замовлення в ERP: ${order.orderNumber} (ID: ${order.id})`);
    }

    // Синхронізуємо товари замовлення
    if (items && items.productRows.length > 0) {
      // Спочатку видаляємо існуючі товари замовлення
      await storage.deleteOrderItems(order.id);

      // Додаємо нові товари
      for (const item of items.productRows) {
        // Знаходимо товар в нашій системі за кодом
        const product = await storage.getProductBySku(item.productCode);
        
        if (product) {
          const orderItemData: InsertOrderItem = {
            orderId: order.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            notes: `Тип товару: ${item.type}, Одиниця: ${item.measureName}`
          };

          await storage.createOrderItem(orderItemData);
          console.log(`Додано товар до замовлення: ${product.name} x${item.quantity}`);
        } else {
          console.warn(`Товар не знайдено в ERP за кодом: ${item.productCode}`);
        }
      }
    }

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