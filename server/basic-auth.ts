import type { Request, Response, NextFunction } from "express";

// Простий middleware для базової аутентифікації
export function basicAuth(req: Request, res: Response, next: NextFunction) {
  // Для демо-версії просто пропускаємо всі запити
  next();
}

// Простий middleware для перевірки сесії
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Для демо-версії просто пропускаємо всі запити
  next();
}