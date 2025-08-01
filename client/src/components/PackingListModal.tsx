import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface PackingItem {
  id: number;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  notes?: string;
  itemName?: string;
  productName?: string;
  productSku?: string;
  categoryName?: string;
}

interface PackingListData {
  order: {
    id: number;
    orderNumber: string;
    invoiceNumber?: string;
    status: string;
    dueDate?: string;
    shippedDate?: string;
    notes?: string;
    createdAt: string;
    trackingNumber?: string;
    client?: {
      name: string;
      taxCode?: string;
      phone?: string;
    };
    contactPerson?: {
      name: string;
      email?: string;
      phone?: string;
      secondaryPhone?: string;
    };
    carrier?: {
      name: string;
      trackingUrl?: string;
      recipientCityName?: string;
      recipientWarehouseAddress?: string;
    };
    company?: {
      name: string;
    };
  };
  items: PackingItem[];
  totalAmount: string;
}

interface PackingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
}

export function PackingListModal({ isOpen, onClose, orderId }: PackingListModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [packingData, setPackingData] = useState<PackingListData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && orderId) {
      loadPackingData();
    }
  }, [isOpen, orderId]);

  const loadPackingData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/packing-list`);
      if (!response.ok) throw new Error('Failed to load packing data');
      
      const data = await response.json();
      setPackingData(data);
    } catch (error) {
      console.error('Failed to load packing data:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити дані для пакувального листа",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!packingData) return;
    
    setIsPrinting(true);
    
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePackingHTML(packingData));
        printWindow.document.close();
        printWindow.print();
        
        // Підтверджуємо друк на сервері
        const response = await fetch(`/api/orders/${orderId}/confirm-packing-print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          toast({
            title: "Успіх",
            description: "Пакувальний лист відправлено на друк",
          });
          
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          onClose();
        }
      }
    } catch (error) {
      console.error('Failed to print packing list:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося роздрукувати пакувальний лист",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const generatePackingHTML = (data: PackingListData) => {
    const { order, items, totalAmount } = data;
    const currentDate = new Date().toLocaleDateString('uk-UA');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Пакувальний лист ${order.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #000;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 14px;
            color: #333;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-group {
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
          }
          .label {
            font-weight: bold;
            min-width: 140px;
            margin-right: 10px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th, .items-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }
          .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .quantity, .price {
            text-align: right;
            font-weight: bold;
          }
          .total-section {
            text-align: right;
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .total-amount {
            font-size: 16px;
            font-weight: bold;
            background-color: #f0f0f0;
            padding: 10px;
            border: 2px solid #000;
            display: inline-block;
          }
          .signatures {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
          }
          .signature-box {
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            text-align: center;
            min-height: 60px;
          }
          @media print {
            body { background: white; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">📦 Пакувальний лист</div>
          <div class="subtitle">Замовлення № ${order.orderNumber}</div>
        </div>

        <div class="info-grid">
          <div>
            <div class="info-group">
              <span class="label">📅 Дата:</span> ${currentDate}
            </div>
            <div class="info-group">
              <span class="label">📋 Замовлення:</span> ${order.orderNumber}
            </div>
            ${order.invoiceNumber ? `
              <div class="info-group">
                <span class="label">🧾 Рахунок:</span> ${order.invoiceNumber}
              </div>
            ` : ''}
            ${order.company ? `
              <div class="info-group">
                <span class="label">🏢 Підприємство:</span> ${order.company.name}
              </div>
            ` : ''}
          </div>
          <div>
            ${order.client ? `
              <div class="info-group">
                <span class="label">👤 Клієнт:</span> ${order.client.name}
              </div>
              ${order.client.taxCode ? `
                <div class="info-group">
                  <span class="label">🏢 ЄДРПОУ:</span> ${order.client.taxCode}
                </div>
              ` : ''}
            ` : ''}
            ${order.contactPerson ? `
              <div class="info-group">
                <span class="label">📞 Контакт:</span> ${order.contactPerson.name}
              </div>
              ${order.contactPerson.phone ? `
                <div class="info-group">
                  <span class="label">📱 Телефон:</span> ${order.contactPerson.phone}
                </div>
              ` : ''}
            ` : ''}
            ${order.carrier ? `
              <div class="info-group">
                <span class="label">🚚 Перевізник:</span> ${order.carrier.name}
              </div>
              ${order.carrier.recipientCityName ? `
                <div class="info-group">
                  <span class="label">🏪 Місто:</span> ${order.carrier.recipientCityName}
                </div>
              ` : ''}
              ${order.carrier.recipientWarehouseAddress ? `
                <div class="info-group">
                  <span class="label">📍 Відділення:</span> ${order.carrier.recipientWarehouseAddress}
                </div>
              ` : ''}
              ${order.trackingNumber ? `
                <div class="info-group">
                  <span class="label">📦 ТТН:</span> ${order.trackingNumber}
                </div>
              ` : ''}
            ` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%">№</th>
              <th style="width: 40%">Найменування товару</th>
              <th style="width: 15%">Артикул</th>
              <th style="width: 10%">Кількість</th>
              <th style="width: 15%">Ціна за од.</th>
              <th style="width: 15%">Сума</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>
                  <strong>${item.productName || item.itemName || 'Без назви'}</strong>
                  ${item.categoryName ? `<br><small style="color: #666;">(${item.categoryName})</small>` : ''}
                  ${item.notes ? `<br><small style="color: #999; font-style: italic;">${item.notes}</small>` : ''}
                </td>
                <td style="text-align: center; font-family: monospace;">
                  ${item.productSku || '-'}
                </td>
                <td class="quantity">${item.quantity} шт.</td>
                <td class="price">${parseFloat(item.unitPrice).toFixed(2)} грн</td>
                <td class="price">${parseFloat(item.totalPrice).toFixed(2)} грн</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-amount">
            💰 Загальна сума: ${parseFloat(totalAmount).toFixed(2)} грн
          </div>
        </div>

        ${order.notes ? `
          <div style="margin-top: 20px; padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9;">
            <strong>📝 Примітки до замовлення:</strong><br>
            ${order.notes}
          </div>
        ` : ''}

        <div class="signatures">
          <div>
            <div style="margin-bottom: 10px;"><strong>Підготував:</strong></div>
            <div class="signature-box"></div>
            <div style="text-align: center; margin-top: 5px;">підпис / ПІБ</div>
          </div>
          <div>
            <div style="margin-bottom: 10px;"><strong>Перевірив:</strong></div>
            <div class="signature-box"></div>
            <div style="text-align: center; margin-top: 5px;">підпис / ПІБ</div>
          </div>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
          Документ згенеровано автоматично ${currentDate}
        </div>
      </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Пакувальний лист - Замовлення #{orderId}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3">Завантаження даних...</span>
          </div>
        ) : packingData ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Інформація про замовлення:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Замовлення:</strong> {packingData.order.orderNumber}</p>
                  {packingData.order.invoiceNumber && (
                    <p><strong>Рахунок:</strong> {packingData.order.invoiceNumber}</p>
                  )}
                  {packingData.order.client && (
                    <p><strong>Клієнт:</strong> {packingData.order.client.name}</p>
                  )}
                </div>
                <div>
                  {packingData.order.carrier && (
                    <>
                      <p><strong>Перевізник:</strong> {packingData.order.carrier.name}</p>
                      {packingData.order.carrier.recipientCityName && (
                        <p><strong>Місто:</strong> {packingData.order.carrier.recipientCityName}</p>
                      )}
                      {packingData.order.carrier.recipientWarehouseAddress && (
                        <p><strong>Відділення:</strong> {packingData.order.carrier.recipientWarehouseAddress}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Позиції для упакування:</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">№</th>
                      <th className="border border-gray-300 p-2 text-left">Найменування</th>
                      <th className="border border-gray-300 p-2 text-left">Артикул</th>
                      <th className="border border-gray-300 p-2 text-right">Кількість</th>
                      <th className="border border-gray-300 p-2 text-right">Ціна</th>
                      <th className="border border-gray-300 p-2 text-right">Сума</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packingData.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 p-2">{index + 1}</td>
                        <td className="border border-gray-300 p-2">
                          <div>
                            <strong>{item.productName || item.itemName || 'Без назви'}</strong>
                            {item.categoryName && (
                              <div className="text-sm text-gray-500">({item.categoryName})</div>
                            )}
                            {item.notes && (
                              <div className="text-sm text-gray-400 italic">{item.notes}</div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center font-mono">
                          {item.productSku || '-'}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {item.quantity} шт.
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {parseFloat(item.unitPrice).toFixed(2)} грн
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-bold">
                          {parseFloat(item.totalPrice).toFixed(2)} грн
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-right">
                <div className="inline-block bg-blue-50 border-2 border-blue-200 p-3 rounded">
                  <strong className="text-lg">
                    💰 Загальна сума: {parseFloat(packingData.totalAmount).toFixed(2)} грн
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Закрити
              </Button>
              <Button onClick={handlePrint} disabled={isPrinting}>
                <Printer className="h-4 w-4 mr-2" />
                {isPrinting ? 'Друкування...' : 'Роздрукувати'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>Не вдалося завантажити дані для пакувального листа</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}