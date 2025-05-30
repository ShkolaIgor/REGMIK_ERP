import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Download, FileText, Package, ShoppingCart, TrendingUp, Users, Warehouse, Factory, AlertTriangle } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdvancedReports() {
  const [selectedReport, setSelectedReport] = useState<string>("inventory");
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [dateRange, setDateRange] = useState<string>("last-month");

  // Запити для отримання даних
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const { data: shortages = [] } = useQuery({
    queryKey: ["/api/material-shortages"],
  });

  const { data: costCalculations = [] } = useQuery({
    queryKey: ["/api/cost-calculations"],
  });

  const { data: productionTasks = [] } = useQuery({
    queryKey: ["/api/production-tasks"],
  });

  const { data: supplierOrders = [] } = useQuery({
    queryKey: ["/api/supplier-orders"],
  });

  // Функції експорту
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value || '';
        }).join(",")
      )
    ].join("\n");
    
    // Додаємо BOM для правильного відображення українських символів
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportToExcel = (data: any[], filename: string) => {
    // Простий метод створення Excel-подібного CSV
    exportToCSV(data, filename + "_excel");
  };

  const exportToPDF = (data: any[], filename: string, reportTitle: string) => {
    if (!data.length) return;
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Додаємо заголовок UTF-8
    doc.setFontSize(16);
    doc.text(reportTitle, 20, 20);
    
    // Додаємо дату
    doc.setFontSize(10);
    doc.text(`Дата: ${new Date().toLocaleDateString('uk-UA')}`, 20, 30);
    
    // Підготовляємо дані для таблиці
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => String(row[header] || ''))
    );
    
    // Створюємо таблицю з Unicode підтримкою
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        fontStyle: 'normal'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 40, left: 10, right: 10 },
      tableWidth: 'auto',
      columnStyles: {},
      didParseCell: function(data) {
        // Встановлюємо Unicode текст
        if (data.cell.text && Array.isArray(data.cell.text)) {
          data.cell.text = data.cell.text.map(text => String(text));
        }
      }
    });
    
    // Зберігаємо файл
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Функція транслітерації українського тексту
  const transliterateText = (text: string): string => {
    const translitMap: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie', 
      'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 
      'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 
      'ю': 'iu', 'я': 'ia', "ʼ": "",
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ie', 
      'Ж': 'Zh', 'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'I', 'Й': 'I', 'К': 'K', 'Л': 'L', 
      'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 
      'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 
      'Ю': 'Iu', 'Я': 'Ia'
    };
    
    return text.split('').map(char => translitMap[char] || char).join('');
  };

  // Підготовка даних для звітів
  const inventoryReportData = Array.isArray(inventory) ? inventory.map((item: any) => ({
    "ID товару": item.product?.id || "",
    Товар: item.product?.name || "N/A",
    SKU: item.product?.sku || "",
    Склад: item.warehouse?.name || "N/A",
    Кількість: item.quantity,
    Одиниця: item.product?.unit || "N/A",
    "Вартість за одиницю": item.product?.costPrice || "0",
    "Загальна вартість": parseFloat(item.product?.costPrice || "0") * item.quantity,
    "Мін. запас": item.product?.minStock || "N/A",
    "Макс. запас": item.product?.maxStock || "N/A",
    Статус: item.quantity < (item.product?.minStock || 0) ? "Низькі запаси" : "Норма",
    "Дата останнього оновлення": new Date(item.updatedAt || item.createdAt).toLocaleDateString('uk-UA')
  })) : [];

  const ordersReportData = Array.isArray(orders) ? orders.map((order: any) => ({
    "ID замовлення": order.id,
    "№ Замовлення": order.orderNumber,
    "Дата створення": new Date(order.orderDate).toLocaleDateString('uk-UA'),
    Статус: order.status,
    "Загальна сума": order.totalAmount,
    Валюта: order.currency,
    "Кількість позицій": order.items?.length || 0,
    Примітки: order.notes || "—",
    "Термін виконання": order.dueDate ? new Date(order.dueDate).toLocaleDateString('uk-UA') : "—"
  })) : [];

  const suppliersReportData = Array.isArray(suppliers) ? suppliers.map((supplier: any) => ({
    "ID постачальника": supplier.id,
    Назва: supplier.name,
    "Контактна особа": supplier.contactPerson || "—",
    Email: supplier.email || "—",
    Телефон: supplier.phone || "—",
    Адреса: supplier.address || "—",
    "Умови оплати": supplier.paymentTerms || "—",
    "Умови доставки": supplier.deliveryTerms || "—",
    Рейтинг: supplier.rating || "—",
    Статус: supplier.isActive ? "Активний" : "Неактивний",
    "Дата створення": new Date(supplier.createdAt || Date.now()).toLocaleDateString('uk-UA')
  })) : [];

  const shortagesReportData = Array.isArray(shortages) ? shortages.map((shortage: any) => ({
    "ID дефіциту": shortage.id,
    "ID товару": shortage.product?.id || "",
    Товар: shortage.product?.name || "N/A",
    SKU: shortage.product?.sku || "",
    "Потрібна кількість": shortage.requiredQuantity,
    "Доступна кількість": shortage.availableQuantity,
    "Дефіцит": shortage.shortageQuantity,
    Одиниця: shortage.unit,
    Пріоритет: shortage.priority,
    "Орієнтовна вартість": shortage.estimatedCost,
    Статус: shortage.status,
    "Рекомендований постачальник": shortage.supplierRecommendationId || "—",
    Примітки: shortage.notes || "—",
    "Дата створення": new Date(shortage.createdAt || Date.now()).toLocaleDateString('uk-UA')
  })) : [];

  const productionReportData = Array.isArray(productionTasks) ? productionTasks.map((task: any) => ({
    "ID завдання": task.id,
    "ID рецепту": task.recipe?.id || "",
    Рецепт: task.recipe?.name || "N/A",
    Кількість: task.quantity,
    Статус: task.status,
    "Дата початку": new Date(task.startDate).toLocaleDateString('uk-UA'),
    "Дата завершення": task.endDate ? new Date(task.endDate).toLocaleDateString('uk-UA') : "—",
    "Прогрес %": task.progress || 0,
    Примітки: task.notes || "—"
  })) : [];

  const costAnalysisData = Array.isArray(costCalculations) ? costCalculations.map((calc: any) => ({
    "ID розрахунку": calc.id,
    "ID товару": calc.product?.id || "",
    Товар: calc.product?.name || "N/A",
    SKU: calc.product?.sku || "",
    "Вартість матеріалів": calc.materialCost,
    "Вартість праці": calc.laborCost,
    "Накладні витрати": calc.overheadCost,
    "Загальна вартість": calc.totalCost,
    Маржа: calc.margin,
    "Відсоток маржі": calc.marginPercent,
    "Ціна продажу": calc.sellingPrice || "—",
    "Дата розрахунку": new Date(calc.createdAt || Date.now()).toLocaleDateString('uk-UA')
  })) : [];

  const supplierOrdersReportData = Array.isArray(supplierOrders) ? supplierOrders.map((order: any) => ({
    "ID замовлення": order.id,
    "№ Замовлення": order.orderNumber,
    "Постачальник": order.supplierName,
    "Дата замовлення": new Date(order.orderDate).toLocaleDateString('uk-UA'),
    "Очікувана дата": order.expectedDate ? new Date(order.expectedDate).toLocaleDateString('uk-UA') : "—",
    Статус: order.status,
    "Загальна сума": order.totalAmount,
    "Кількість позицій": order.items?.length || 0,
    Примітки: order.notes || "—"
  })) : [];

  const reportTypes = [
    { 
      id: "inventory", 
      name: "Запаси", 
      icon: Warehouse, 
      data: inventoryReportData,
      description: "Детальний звіт по всіх товарах на складах"
    },
    { 
      id: "orders", 
      name: "Замовлення", 
      icon: ShoppingCart, 
      data: ordersReportData,
      description: "Звіт по всіх замовленнях та їх статусах"
    },
    { 
      id: "suppliers", 
      name: "Постачальники", 
      icon: Users, 
      data: suppliersReportData,
      description: "Інформація про всіх постачальників"
    },
    { 
      id: "shortages", 
      name: "Дефіцити", 
      icon: AlertTriangle, 
      data: shortagesReportData,
      description: "Аналіз дефіциту матеріалів та товарів"
    },
    { 
      id: "production", 
      name: "Виробництво", 
      icon: Factory, 
      data: productionReportData,
      description: "Звіт по виробничим завданням"
    },
    { 
      id: "costs", 
      name: "Собівартість", 
      icon: TrendingUp, 
      data: costAnalysisData,
      description: "Аналіз собівартості та прибутковості"
    },
    { 
      id: "supplier-orders", 
      name: "Замовлення постачальникам", 
      icon: Package, 
      data: supplierOrdersReportData,
      description: "Звіт по замовленнях постачальникам"
    }
  ];

  const currentReportData = reportTypes.find(r => r.id === selectedReport)?.data || [];
  const currentReport = reportTypes.find(r => r.id === selectedReport);

  const exportData = (format: string) => {
    const reportTitle = currentReport?.name || "Звіт";
    if (format === "csv") {
      exportToCSV(currentReportData, `${selectedReport}-report`);
    } else if (format === "json") {
      exportToJSON(currentReportData, `${selectedReport}-report`);
    } else if (format === "excel") {
      exportToExcel(currentReportData, `${selectedReport}-report`);
    } else if (format === "pdf") {
      exportToPDF(currentReportData, `${selectedReport}-report`, reportTitle);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Розширена звітність</h1>
          <p className="text-muted-foreground">Детальні звіти з можливістю експорту</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-week">Останній тиждень</SelectItem>
              <SelectItem value="last-month">Останній місяць</SelectItem>
              <SelectItem value="last-quarter">Останній квартал</SelectItem>
              <SelectItem value="last-year">Останній рік</SelectItem>
            </SelectContent>
          </Select>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => exportData(exportFormat)}
            disabled={!currentReportData.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Експорт
          </Button>
        </div>
      </div>

      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="grid w-full grid-cols-7">
          {reportTypes.map((report) => (
            <TabsTrigger key={report.id} value={report.id} className="flex items-center gap-2">
              <report.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{report.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {reportTypes.map((report) => (
          <TabsContent key={report.id} value={report.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <report.icon className="h-5 w-5" />
                  {report.name}
                </CardTitle>
                <CardDescription>
                  {report.description}
                  <br />
                  Всього записів: <Badge variant="secondary">{report.data.length}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {report.data.length > 0 ? (
                  <>
                    <div className="mb-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Швидка статистика:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Загалом записів:</span>
                          <div className="font-semibold">{report.data.length}</div>
                        </div>
                        {report.id === "inventory" && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Низькі запаси:</span>
                              <div className="font-semibold text-red-600">
                                {report.data.filter((item: any) => item.Статус === "Низькі запаси").length}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Загальна вартість:</span>
                              <div className="font-semibold">
                                {report.data.reduce((sum: number, item: any) => sum + (item["Загальна вартість"] || 0), 0).toFixed(2)} ₴
                              </div>
                            </div>
                          </>
                        )}
                        {report.id === "orders" && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Завершені:</span>
                              <div className="font-semibold text-green-600">
                                {report.data.filter((item: any) => item.Статус === "completed").length}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">В процесі:</span>
                              <div className="font-semibold text-blue-600">
                                {report.data.filter((item: any) => item.Статус === "in-progress").length}
                              </div>
                            </div>
                          </>
                        )}
                        {report.id === "shortages" && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Критичні:</span>
                              <div className="font-semibold text-red-600">
                                {report.data.filter((item: any) => item.Пріоритет === "high").length}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Загальна вартість:</span>
                              <div className="font-semibold">
                                {report.data.reduce((sum: number, item: any) => sum + parseFloat(item["Орієнтовна вартість"] || "0"), 0).toFixed(2)} ₴
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="rounded-md border overflow-auto max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(report.data[0]).map((header) => (
                              <TableHead key={header} className="whitespace-nowrap">{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.data.slice(0, 50).map((row: any, index: number) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value: any, cellIndex: number) => (
                                <TableCell key={cellIndex} className="whitespace-nowrap">
                                  {typeof value === 'string' && value.includes('Низькі запаси') ? (
                                    <Badge variant="destructive">{value}</Badge>
                                  ) : typeof value === 'string' && value.includes('Норма') ? (
                                    <Badge variant="default">{value}</Badge>
                                  ) : typeof value === 'string' && value.includes('Активний') ? (
                                    <Badge variant="default">{value}</Badge>
                                  ) : typeof value === 'string' && value.includes('Неактивний') ? (
                                    <Badge variant="secondary">{value}</Badge>
                                  ) : typeof value === 'string' && value.includes('completed') ? (
                                    <Badge variant="default">{value}</Badge>
                                  ) : typeof value === 'string' && value.includes('pending') ? (
                                    <Badge variant="secondary">{value}</Badge>
                                  ) : typeof value === 'string' && value.includes('high') ? (
                                    <Badge variant="destructive">{value}</Badge>
                                  ) : typeof value === 'string' && value.includes('medium') ? (
                                    <Badge variant="outline">{value}</Badge>
                                  ) : typeof value === 'string' && value.includes('low') ? (
                                    <Badge variant="secondary">{value}</Badge>
                                  ) : (
                                    String(value)
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {report.data.length > 50 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Показано перші 50 записів з {report.data.length}. 
                          Використайте експорт для отримання повного звіту.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Немає даних для відображення</p>
                    <p className="text-sm mt-2">Перевірте, чи є дані в системі для цього типу звіту</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}