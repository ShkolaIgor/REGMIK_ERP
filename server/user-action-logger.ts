import { db } from "./db";
import { userActionLogs, type InsertUserActionLog } from "@shared/schema";

export interface LogActionParams {
  userId: number;
  action: 'create' | 'update' | 'delete' | 'inventory_change' | 'view' | 'export' | 'import';
  entityType: string;
  entityId: number;
  oldValues?: any;
  newValues?: any;
  description: string;
  module: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  additionalData?: any;
}

export class UserActionLogger {
  static async logAction(params: LogActionParams): Promise<void> {
    try {
      const logEntry: InsertUserActionLog = {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues || null,
        newValues: params.newValues || null,
        description: params.description,
        module: params.module,
        severity: params.severity || 'info',
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        sessionId: params.sessionId || null,
        additionalData: params.additionalData || null,
      };

      await db.insert(userActionLogs).values(logEntry);
    } catch (error) {
      console.error('Помилка логування дії користувача:', error);
      // Не кидаємо помилку, щоб не перервати основну функціональність
    }
  }

  // Зручні методи для різних типів дій
  static async logInventoryChange(
    userId: number,
    productId: number,
    warehouseId: number,
    oldQuantity: number,
    newQuantity: number,
    reason: string,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    const quantityChange = newQuantity - oldQuantity;
    const changeType = quantityChange > 0 ? 'збільшення' : 'зменшення';
    
    await this.logAction({
      userId,
      action: 'inventory_change',
      entityType: 'inventory',
      entityId: productId,
      oldValues: { quantity: oldQuantity, warehouseId },
      newValues: { quantity: newQuantity, warehouseId },
      description: `${changeType.charAt(0).toUpperCase() + changeType.slice(1)} кількості товару на ${Math.abs(quantityChange)} одиниць. Причина: ${reason}`,
      module: 'inventory',
      severity: 'info',
      ipAddress,
      userAgent,
      sessionId,
      additionalData: {
        quantityChange,
        reason,
        warehouseId
      }
    });
  }

  static async logProductUpdate(
    userId: number,
    productId: number,
    oldProduct: any,
    newProduct: any,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'update',
      entityType: 'product',
      entityId: productId,
      oldValues: oldProduct,
      newValues: newProduct,
      description: `Оновлено товар "${newProduct.name}" (SKU: ${newProduct.sku})`,
      module: 'products',
      severity: 'info',
      ipAddress,
      userAgent,
      sessionId
    });
  }

  static async logProductCreate(
    userId: number,
    productId: number,
    product: any,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'create',
      entityType: 'product',
      entityId: productId,
      newValues: product,
      description: `Створено новий товар "${product.name}" (SKU: ${product.sku})`,
      module: 'products',
      severity: 'info',
      ipAddress,
      userAgent,
      sessionId
    });
  }

  static async logProductDelete(
    userId: number,
    productId: number,
    product: any,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'delete',
      entityType: 'product',
      entityId: productId,
      oldValues: product,
      description: `Видалено товар "${product.name}" (SKU: ${product.sku})`,
      module: 'products',
      severity: 'warning',
      ipAddress,
      userAgent,
      sessionId
    });
  }
}

// Middleware для автоматичного збору IP та User-Agent
export function getUserInfo(req: any) {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    sessionId: req.sessionID || req.session?.id || 'unknown'
  };
}