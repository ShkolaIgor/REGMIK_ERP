import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface PrintData {
  orderNumber: string;
  invoiceNumber?: string;
  date: string;
  shippedDate?: string;
  client?: {
    name: string;
    phone?: string;
    email?: string;
    taxCode?: string;
  };
  company?: {
    name: string;
    taxCode?: string;
  };
  items: Array<{
    position: number;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  totalAmount: string;
  notes?: string;
  status: string;
}

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  printData: PrintData | null;
  orderId: number;
}

export function PrintPreviewModal({ isOpen, onClose, printData, orderId }: PrintPreviewModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePrint = async () => {
    if (!printData) return;
    
    setIsPrinting(true);
    
    try {
      // Відкриваємо вікно друку
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePrintHTML(printData));
        printWindow.document.close();
        printWindow.print();
        
        // Підтверджуємо друк на сервері
        const response = await fetch(`/api/orders/${orderId}/confirm-print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          toast({
            title: "Успіх",
            description: "Документ відправлено на друк",
          });
          
          // Оновлюємо кеш замовлень щоб показати нові дані printedAt
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Помилка друку:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося роздрукувати документ",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const generatePrintHTML = (data: PrintData) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Документи замовлення ${data.orderNumber}</title>
    <style>
        @page {
            size: A4;
            margin: 10mm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            line-height: 1.2;
            margin: 0;
            padding: 0;
            color: #000;
        }
        .page-break {
            page-break-after: always;
        }
        .document {
            border: 2px solid #000;
            margin-bottom: 5mm;
            padding: 3mm;
            height: 270mm;
            box-sizing: border-box;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #000;
            padding-bottom: 2mm;
            margin-bottom: 3mm;
        }
        .order-number {
            background: #000;
            color: white;
            padding: 1mm 3mm;
            font-weight: bold;
            font-size: 10px;
        }
        .document-title {
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
        }
        .date {
            font-weight: bold;
            font-size: 9px;
        }
        .section {
            margin-bottom: 5mm;
        }
        .item-row {
            display: flex;
            align-items: center;
            border-bottom: 1px dotted #ccc;
            padding: 1mm 0;
            min-height: 5mm;
        }
        .item-number {
            background: #000;
            color: white;
            width: 6mm;
            height: 4mm;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 2mm;
            font-weight: bold;
        }
        .item-name {
            flex: 1;
            padding-right: 2mm;
        }
        .operations-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 3mm;
        }
        .operations-table th,
        .operations-table td {
            border: 1px solid #000;
            padding: 2mm;
            text-align: left;
        }
        .operations-table th {
            background: #f0f0f0;
            font-weight: bold;
        }
        .checkbox {
            width: 4mm;
            height: 4mm;
            border: 1px solid #000;
            display: inline-block;
            margin-right: 2mm;
        }
        .company-info {
            text-align: center;
            font-size: 8px;
            margin: 2mm 0;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            width: 40mm;
            height: 8mm;
            display: inline-block;
            margin: 0 5mm;
        }
        .two-column {
            display: flex;
            gap: 5mm;
        }
        .column {
            flex: 1;
        }
    </style>
</head>
<body>
    <!-- Паспорт технологічний -->
    <div class="document">
        <div class="header">
            <div class="order-number">№ ${data.orderNumber}</div>
            <div class="document-title">ПАСПОРТ ТЕХНОЛОГІЧНИЙ</div>
            <div class="date">${data.date}</div>
        </div>
        
        <!-- Основна інформація -->
        <div style="display: flex; gap: 10px; margin-bottom: 5mm;">
            <div style="flex: 1; border: 1px solid #000; padding: 2mm;">
                <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: 2mm;">ІНФОРМАЦІЯ ПРО ЗАМОВЛЕННЯ</div>
                <div><strong>Номер рахунку:</strong> ${data.invoiceNumber || data.orderNumber}</div>
                <div><strong>Дата замовлення:</strong> ${data.date}</div>
                <div><strong>Дата відвантаження:</strong> ${data.shippedDate || 'Не вказано'}</div>
                <div><strong>Статус:</strong> ${data.status}</div>
            </div>
            <div style="flex: 1; border: 1px solid #000; padding: 2mm;">
                <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: 2mm;">ІНФОРМАЦІЯ ПРО КЛІЄНТА</div>
                <div><strong>Назва:</strong> ${data.client?.name || 'Не вказано'}</div>
                ${data.client?.taxCode ? `<div><strong>Податковий код:</strong> ${data.client.taxCode}</div>` : ''}
                ${data.client?.phone ? `<div><strong>Телефон:</strong> ${data.client.phone}</div>` : ''}
                ${data.client?.email ? `<div><strong>Email:</strong> ${data.client.email}</div>` : ''}
            </div>
        </div>
        
        <!-- Таблиця позицій -->
        <div style="margin-bottom: 5mm;">
            <div style="font-weight: bold; margin-bottom: 2mm; font-size: 10px;">ЗАМОВЛЕНІ ПОЗИЦІЇ</div>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid #000; padding: 2mm; text-align: left;">№</th>
                        <th style="border: 1px solid #000; padding: 2mm; text-align: left;">Назва товару</th>
                        <th style="border: 1px solid #000; padding: 2mm; text-align: left;">Артикул</th>
                        <th style="border: 1px solid #000; padding: 2mm; text-align: center;">Кільк.</th>
                        <th style="border: 1px solid #000; padding: 2mm; text-align: right;">Ціна</th>
                        <th style="border: 1px solid #000; padding: 2mm; text-align: right;">Сума</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 2mm;">${item.position}</td>
                        <td style="border: 1px solid #000; padding: 2mm;">${item.name}</td>
                        <td style="border: 1px solid #000; padding: 2mm; font-family: monospace;">${item.sku}</td>
                        <td style="border: 1px solid #000; padding: 2mm; text-align: center;">${item.quantity}</td>
                        <td style="border: 1px solid #000; padding: 2mm; text-align: right;">${item.unitPrice}</td>
                        <td style="border: 1px solid #000; padding: 2mm; text-align: right;">${item.totalPrice}</td>
                    </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td colspan="5" style="border: 1px solid #000; padding: 2mm; text-align: right;">ЗАГАЛЬНА СУМА:</td>
                        <td style="border: 1px solid #000; padding: 2mm; text-align: right; font-size: 11px;">${data.totalAmount}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <table class="operations-table">
            <thead>
                <tr>
                    <th>Операція</th>
                    <th>Виконавець</th>
                    <th>Дата</th>
                    <th>Підпис</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Контроль брозза</td><td>Бортько Т.М.</td><td></td><td></td></tr>
                <tr><td>Виварювання</td><td>Довгкнц Т.М.</td><td></td><td></td></tr>
            </tbody>
        </table>
        
        <div class="company-info">
            ${data.company ? `Виготовлювач: ${data.company.taxCode ? data.company.taxCode + ' ' : ''}${data.company.name}` : 'Виготовлювач: 4384319 ПП "НВФ "РЕГМІК"'} &nbsp;&nbsp;&nbsp; ☎ (0462) 614-663<br>
            Отримувач: ${data.client?.name || 'Не вказано'}<br>
            ${data.notes ? `Примітки: ${data.notes}` : ''}
        </div>
    </div>

    <!-- Маршрут механічної обробки -->
    <div class="document page-break">
        <div class="header">
            <div class="order-number">${data.orderNumber}</div>
            <div class="document-title">МАРШРУТ механічної обробки</div>
            <div class="date">${data.date}</div>
        </div>
        
        <div class="two-column">
            <div class="column">
                ${data.items.slice(0, Math.ceil(data.items.length/2)).map(item => `
                <div class="item-row">
                    <div class="item-number">${item.position}</div>
                    <div class="item-name">${item.name}</div>
                </div>
                `).join('')}
            </div>
            <div class="column">
                ${data.items.slice(Math.ceil(data.items.length/2)).map(item => `
                <div class="item-row">
                    <div class="item-number">${item.position}</div>
                    <div class="item-name">${item.name}</div>
                </div>
                `).join('')}
            </div>
        </div>
        
        <table class="operations-table">
            <thead>
                <tr>
                    <th>Операція</th>
                    <th>Виконавець</th>
                    <th>Отримав</th>
                    <th>Здав</th>
                    <th>Підпис</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Комплектування</td><td>Довгіщ Т.М.</td><td></td><td></td><td></td></tr>
                <tr><td>Механічна обробка</td><td>Бурець В.С.</td><td><div class="checkbox"></div>Купіє</td><td><div class="checkbox"></div>Марій</td><td></td></tr>
                <tr><td>Засвержця</td><td>Куніц С.Л.</td><td></td><td></td><td></td></tr>
                <tr><td>Вирості, зв гексистич</td><td>Буртєсь</td><td><div class="checkbox"></div>Купіє</td><td></td><td></td></tr>
                <tr><td>Контроль мех. обробки</td><td></td><td></td><td></td><td></td></tr>
            </tbody>
        </table>
    </div>

    <!-- Пакувальний лист -->
    <div class="document">
        <div class="header">
            <div class="order-number">${data.orderNumber}</div>
            <div class="document-title">ПАКУВАЛЬНИЙ ЛИСТ</div>
            <div class="date">${data.date}</div>
        </div>
        
        <div class="section">
            ${data.items.map(item => `
            <div class="item-row">
                <div class="item-number">${item.position}</div>
                <div class="item-name">${item.name} - ${item.quantity} шт.</div>
            </div>
            `).join('')}
        </div>
        
        <div class="company-info" style="margin-top: 20mm;">
            Пакувальник: <div class="signature-line"></div> дата: <div class="signature-line"></div>
        </div>
    </div>

    <!-- Маршрут виготовлення датчика -->
    <div class="document">
        <div class="header">
            <div class="order-number">${data.orderNumber}</div>
            <div class="document-title">МАРШРУТ виготовлення датчика</div>
            <div class="date">${data.date}</div>
        </div>
        
        <div class="section">
            ${data.items.map(item => `
            <div class="item-row">
                <div class="item-number">${item.position}</div>
                <div class="item-name">${item.name}</div>
            </div>
            `).join('')}
        </div>
        
        <table class="operations-table">
            <thead>
                <tr>
                    <th>Операція</th>
                    <th>Виконавець</th>
                    <th>Отримав</th>
                    <th>Здав</th>
                    <th>Підпис</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Комплектування</td><td>Довгішг Т.М.</td><td>+Е -</td><td></td><td></td></tr>
                <tr><td>Електричний монтаж</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Збирання</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Випроб. електричні</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Маркування та контроль</td><td></td><td></td><td></td><td></td></tr>
            </tbody>
        </table>
        
        <div style="margin-top: 10mm;">
            Кабель: <div class="signature-line"></div>
        </div>
    </div>
</body>
</html>
    `;
  };

  if (!printData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Попередній перегляд друку - Замовлення №{printData.orderNumber}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 p-4">
          <div 
            className="bg-white min-h-full"
            dangerouslySetInnerHTML={{ 
              __html: generatePrintHTML(printData).replace(/<!DOCTYPE html>[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*?<\/html>/, '')
            }}
          />
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            Клієнт: {printData.client?.name} | Статус: {printData.status} | Сума: {printData.totalAmount} грн
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            <Button onClick={handlePrint} disabled={isPrinting}>
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? 'Друкую...' : 'Друкувати'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}