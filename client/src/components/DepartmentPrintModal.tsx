import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, Building2, Package, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DepartmentItem {
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

interface Department {
  departmentId: number;
  departmentName: string;
  items: DepartmentItem[];
}

interface DepartmentPrintData {
  order: {
    id: number;
    orderNumber: string;
    invoiceNumber?: string;
    status: string;
    dueDate?: string;
    shippedDate?: string;
    notes?: string;
    createdAt: string;
    client?: {
      name: string;
      phone?: string;
    };
    company?: {
      name: string;
    };
  };
  departments: Department[];
  itemsWithoutDepartment: DepartmentItem[];
}

interface DepartmentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
}

export function DepartmentPrintModal({ isOpen, onClose, orderId }: DepartmentPrintModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState<DepartmentPrintData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Завантажуємо дані при відкритті модалу
  useEffect(() => {
    if (isOpen && orderId) {
      loadPrintData();
    }
  }, [isOpen, orderId]);

  const loadPrintData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/print-departments`);
      if (response.ok) {
        const data = await response.json();
        setPrintData(data);
      } else {
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити дані для друку",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
      toast({
        title: "Помилка",
        description: "Помилка підключення до сервера",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateConsolidatedPrintHTML = (): string => {
    if (!printData) return '';

    const { order, departments, itemsWithoutDepartment } = printData;
    const deliveryDate = order.dueDate ? new Date(order.dueDate).toLocaleDateString('uk-UA') : 'Не вказано';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Виробничий лист - Замовлення ${order.orderNumber}</title>
        <style>
          @page { 
            size: A4; 
            margin: 10mm;
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.3; 
            margin: 0; 
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .main-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
          }
          .order-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            flex-wrap: wrap;
            background-color: #f8fafc;
            padding: 8px;
            border-radius: 4px;
          }
          .info-group {
            margin-bottom: 5px;
          }
          .label {
            font-weight: bold;
            color: #374151;
          }
          .department-section {
            margin-bottom: 20px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            overflow: hidden;
          }
          .department-header {
            background-color: #2563eb;
            color: white;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 12px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #e5e7eb;
            padding: 6px;
            text-align: left;
          }
          .items-table th {
            background-color: #f9fafb;
            font-weight: bold;
            font-size: 10px;
          }
          .items-table tr:nth-child(even) {
            background-color: #fefefe;
          }
          .quantity {
            text-align: center;
            font-weight: bold;
            <!-- color: #059669; -->
          }
          .notes-section {
            margin-top: 15px;
            padding: 8px;
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            font-size: 10px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }
          .without-department {
            background-color: #fee2e2;
            border-color: #fca5a5;
          }
          .without-department .department-header {
            background-color: #dc2626;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="main-title">🏭 ВИРОБНИЧИЙ ЛИСТ</div>
          <div>${new Date().toLocaleString('uk-UA')}</div>
        </div>

        <div class="order-info">
          <div class="info-group">
            <span class="label">📋 Замовлення:</span> ${order.orderNumber}
          </div>
          <div class="info-group">
            <span class="label">📄 Рахунок:</span> ${order.invoiceNumber || 'Не вказано'}
          </div>
          <div class="info-group">
            <span class="label">📅 Дата відвантаження:</span> ${deliveryDate}
          </div>
          ${order.client ? `
            <div class="info-group">
              <span class="label">👤 Клієнт:</span> ${order.client.name}
            </div>
          ` : ''}
        </div>

        ${departments.map(department => `
          <div class="department-section">
            <div class="department-header">
              🏭 ${department.departmentName.toUpperCase()}
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%">№</th>
                  <th style="width: 45%">Найменування товару</th>
                  <!-- <th style="width: 15%">Артикул</th> -->
                  <th style="width: 10%">Кількість</th>
                  <th style="width: 25%">Примітки</th>
                </tr>
              </thead>
              <tbody>
                ${department.items.map((item, index) => `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>
                      <strong>${item.productName || item.itemName || 'Без назви'}</strong>
                      <!-- ${item.categoryName ? `<br><small style="color: #6b7280;">(${item.categoryName})</small>` : ''} -->
                    </td>
                    <!-- <td style="text-align: center; font-family: monospace;">
                      ${item.productSku || '-'}
                    </td> -->
                    <td class="quantity">${item.quantity} шт.</td>
                    <td style="font-size: 10px;">
                      ${item.notes || '-'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        ${itemsWithoutDepartment.length > 0 ? `
          <div class="department-section without-department">
            <div class="department-header">
              ⚠️ ТОВАРИ БЕЗ ВІДДІЛУ
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%">№</th>
                  <th style="width: 45%">Найменування товару</th>
                  <!-- <th style="width: 15%">Артикул</th> -->
                  <th style="width: 10%">Кількість</th>
                  <th style="width: 25%">Примітки</th>
                </tr>
              </thead>
              <tbody>
                ${itemsWithoutDepartment.map((item, index) => `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>
                      <strong>${item.productName || item.itemName || 'Без назви'}</strong>
                      <!-- ${item.categoryName ? `<br><small style="color: #6b7280;">(${item.categoryName})</small>` : ''} -->
                    </td>
                    <!-- <td style="text-align: center; font-family: monospace;">
                      ${item.productSku || '-'}
                    </td> -->
                    <td class="quantity">${item.quantity} шт.</td>
                    <td style="font-size: 10px;">
                      ${item.notes || '-'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${order.notes ? `
          <div class="notes-section">
            <strong>📝 Загальні примітки до замовлення:</strong><br>
            ${order.notes}
          </div>
        ` : ''}

        <!--<div class="footer">
          Система REGMIK ERP
        </div>-->
      </body>
      </html>
    `;
  };

  const generateDepartmentPrintHTML = (department: Department): string => {
    if (!printData) return '';

    const { order } = printData;
    const deliveryDate = order.dueDate ? new Date(order.dueDate).toLocaleDateString('uk-UA') : 'Не вказано';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Виробничий лист - ${department.departmentName} - ${order.orderNumber}</title>
        <style>
          @page { 
            size: A4; 
            margin: 15mm;
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            line-height: 1.4; 
            margin: 0; 
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
          }
          .main-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
          }
          .department-title {
            font-size: 16px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .order-info {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #2563eb;
          }
          .info-group {
            margin-bottom: 8px;
            display: inline-block;
            width: 48%;
            vertical-align: top;
          }
          .label {
            font-weight: bold;
            color: #1e40af;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          .items-table th {
            background-color: #2563eb;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
          }
          .items-table td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          .items-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .quantity {
            text-align: center;
            font-weight: bold;
            <!-- color: #059669; -->
            font-size: 12px;
          }
          .notes-section {
            margin-top: 20px;
            padding: 10px;
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            font-size: 11px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="main-title">🏭 ВИРОБНИЧИЙ ЛИСТ</div>
          <div class="department-title">${department.departmentName.toUpperCase()}</div>
        </div>

        <div class="order-info">
          <div class="info-group">
            <span class="label">📋 Замовлення:</span> ${order.orderNumber}
          </div>
          <div class="info-group">
            <span class="label">📄 Рахунок:</span> ${order.invoiceNumber || 'Не вказано'}
          </div>
          <div class="info-group">
            <span class="label">📅 Дата відвантаження:</span> ${deliveryDate}
          </div>
          ${order.client ? `
            <div class="info-group">
              <span class="label">👤 Клієнт:</span> ${order.client.name}
            </div>
          ` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%">№</th>
              <th style="width: 45%">Найменування товару</th>
              <!-- <th style="width: 15%">Артикул</th> -->
              <th style="width: 10%">Кількість</th>
              <th style="width: 25%">Примітки</th>
            </tr>
          </thead>
          <tbody>
            ${department.items.map((item, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>
                  <strong>${item.productName || item.itemName || 'Без назви'}</strong>
                  <!-- ${item.categoryName ? `<br><small style="color: #6b7280;">(${item.categoryName})</small>` : ''} -->
                <!-- <td style="text-align: center; font-family: monospace;">
                  ${item.productSku || '-'}
                </td> -->
                <td class="quantity">${item.quantity} шт.</td>
                <td style="font-size: 10px;">
                  ${item.notes || '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${order.notes ? `
          <div class="notes-section">
            <strong>📝 Загальні примітки до замовлення:</strong><br>
            ${order.notes}
          </div>
        ` : ''}

        <!-- <div class="footer">
          Виробничий лист для відділу "${department.departmentName}" створено: ${new Date().toLocaleString('uk-UA')}<br>
          Система REGMIK ERP
        </div> -->
      </body>
      </html>
    `;
  };

  const handlePrintDepartment = async (department: Department) => {
    setIsPrinting(true);
    
    try {
      const printHTML = generateDepartmentPrintHTML(department);
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.print();
        
        toast({
          title: "Успіх",
          description: `Виробничий лист для відділу "${department.departmentName}" відправлено на друк`,
        });
      }
    } catch (error) {
      console.error('Помилка друку:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося роздрукувати виробничий лист",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintAllDepartments = async () => {
    if (!printData) return;
    
    setIsPrinting(true);
    
    try {
      const printHTML = generateConsolidatedPrintHTML();
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.print();
        
        toast({
          title: "Успіх",
          description: "Виробничий лист для всіх відділів відправлено на друк",
        });
      }
    } catch (error) {
      console.error('Помилка друку:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося роздрукувати виробничий лист",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };



  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Завантаження даних для друку...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!printData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Помилка завантаження даних</DialogTitle>
          </DialogHeader>
          <p className="text-center p-8">Не вдалося завантажити дані для друку</p>
        </DialogContent>
      </Dialog>
    );
  }

  const { order, departments, itemsWithoutDepartment } = printData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Друк виробничих листів по відділах - {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Інформація про замовлення */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Інформація про замовлення
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Номер: </span>
                {order.orderNumber}
              </div>
              <div>
                <span className="font-medium">Дата відвантаження: </span>
                {order.dueDate ? new Date(order.dueDate).toLocaleDateString('uk-UA') : 'Не вказано'}
              </div>
              {order.client && (
                <div>
                  <span className="font-medium">Клієнт: </span>
                  {order.client.name}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Відділи виробництва */}
          {departments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Відділи виробництва ({departments.length})
                </h3>
                
                <Button 
                  onClick={handlePrintAllDepartments}
                  disabled={isPrinting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isPrinting ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-white border-t-transparent" />
                      Друк...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-2" />
                      Друкувати всі відділи
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4">
                {departments.map((department) => (
                  <Card key={department.departmentId} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-blue-700 flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {department.departmentName}
                          <Badge variant="outline" className="ml-2">
                            {department.items.length} поз.
                          </Badge>
                        </CardTitle>
                        
                        <Button 
                          onClick={() => handlePrintDepartment(department)}
                          disabled={isPrinting}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isPrinting ? (
                            <>
                              <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-white border-t-transparent" />
                              Друк...
                            </>
                          ) : (
                            <>
                              <Printer className="h-3 w-3 mr-1" />
                              Друкувати відділ
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {department.items.map((item, index) => (
                          <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                            <div className="flex-1">
                              <span className="font-medium">
                                {item.productName || item.itemName || 'Без назви'}
                              </span>
                              {item.productSku && (
                                <span className="text-gray-500 ml-2">({item.productSku})</span>
                              )}
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {item.quantity} шт.
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Товари без відділу */}
          {itemsWithoutDepartment.length > 0 && (
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-700 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Товари без призначеного відділу
                  <Badge variant="outline" className="ml-2">
                    {itemsWithoutDepartment.length} поз.
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {itemsWithoutDepartment.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm bg-yellow-50 p-2 rounded">
                      <div className="flex-1">
                        <span className="font-medium">
                          {item.productName || item.itemName || 'Без назви'}
                        </span>
                        {item.productSku && (
                          <span className="text-gray-500 ml-2">({item.productSku})</span>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {item.quantity} шт.
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  💡 Ці товари потребують призначення відділу в налаштуваннях категорій
                </p>
              </CardContent>
            </Card>
          )}

          {departments.length === 0 && itemsWithoutDepartment.length === 0 && (
            <Card>
              <CardContent className="text-center p-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Немає товарів для друку</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}