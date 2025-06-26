import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Package, FileText, TrendingUp, Calendar, Search, Filter, Download, Upload, Edit, Trash2 } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { UkrainianDate } from "@/components/ui/ukrainian-date";

// Interfaces
interface SupplierReceipt {
  id: number;
  receipt_date: string;
  supplier_id: number;
  document_type_id: number;
  supplier_document_date: string | null;
  supplier_document_number: string | null;
  total_amount: string;
  comment: string | null;
  purchase_order_id: number | null;
  created_at: string;
  updated_at: string;
  supplier_name?: string;
  document_type_name?: string;
  purchase_order_number?: string;
}

// Form schema
const supplierReceiptSchema = z.object({
  receipt_date: z.string().min(1, "Дата обов'язкова"),
  supplier_id: z.string().min(1, "Постачальник обов'язковий"),
  document_type_id: z.string().min(1, "Тип документу обов'язковий"),
  supplier_document_date: z.string().optional(),
  supplier_document_number: z.string().optional(),
  total_amount: z.string().min(1, "Сума обов'язкова"),
  comment: z.string().optional(),
  purchase_order_id: z.string().optional(),
});

type SupplierReceiptFormData = z.infer<typeof supplierReceiptSchema>;

export default function SupplierReceipts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<SupplierReceipt | null>(null);
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: supplierReceiptsData = [], isLoading } = useQuery({
    queryKey: ["/api/supplier-receipts"],
  });
  const receiptsArray = Array.isArray(supplierReceiptsData) ? supplierReceiptsData : [];

  const { data: suppliersData = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });
  const suppliers = Array.isArray(suppliersData) ? suppliersData : [];

  const { data: componentsData = [] } = useQuery({
    queryKey: ["/api/components"],
  });
  const components = Array.isArray(componentsData) ? componentsData : [];

  const { data: documentTypesData = [] } = useQuery({
    queryKey: ["/api/supplier-document-types"],
  });
  const documentTypes = Array.isArray(documentTypesData) ? documentTypesData : [];

  const { data: purchaseOrdersData = [] } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });
  const purchaseOrders = Array.isArray(purchaseOrdersData) ? purchaseOrdersData : [];

  // Form
  const form = useForm<SupplierReceiptFormData>({
    resolver: zodResolver(supplierReceiptSchema),
    defaultValues: {
      receipt_date: "",
      supplier_id: "",
      document_type_id: "",
      supplier_document_date: "",
      supplier_document_number: "",
      total_amount: "",
      comment: "",
      purchase_order_id: "none",
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/supplier-receipts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Прихід створено успішно" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка створення приходу", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/supplier-receipts/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      setIsDialogOpen(false);
      setEditingReceipt(null);
      form.reset();
      toast({ title: "Прихід оновлено успішно" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка оновлення приходу", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/supplier-receipts/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      toast({ title: "Прихід видалено успішно" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка видалення приходу", description: error.message, variant: "destructive" });
    },
  });

  // Statistics
  const statistics = useMemo(() => {
    const totalReceipts = receiptsArray.length;
    const totalAmount = receiptsArray.reduce((sum: number, receipt: any) => sum + parseFloat(receipt.total_amount || '0'), 0);
    const uniqueSuppliers = new Set(receiptsArray.map((r: any) => r.supplier_id)).size;
    const thisMonthReceipts = receiptsArray.filter((receipt: any) => {
      const receiptDate = new Date(receipt.receipt_date);
      const now = new Date();
      return receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear();
    }).length;

    return { totalReceipts, totalAmount, uniqueSuppliers, thisMonthReceipts };
  }, [receiptsArray]);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receiptsArray.filter((receipt: any) => {
      const supplierName = receipt.supplier_name || '';
      const documentTypeName = receipt.document_type_name || '';
      const receiptDate = new Date(receipt.receipt_date);
      const now = new Date();
      
      const matchesSupplier = supplierFilter === 'all' || supplierName === supplierFilter;
      const matchesDocumentType = documentTypeFilter === 'all' || documentTypeName === documentTypeFilter;
      
      // Period filter
      let matchesPeriod = true;
      if (periodFilter !== 'all') {
        const timeDiff = now.getTime() - receiptDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        switch (periodFilter) {
          case 'week':
            matchesPeriod = daysDiff <= 7;
            break;
          case 'month':
            matchesPeriod = daysDiff <= 30;
            break;
          case 'quarter':
            matchesPeriod = daysDiff <= 90;
            break;
          case 'year':
            matchesPeriod = daysDiff <= 365;
            break;
        }
      }
      
      return matchesSupplier && matchesDocumentType && matchesPeriod;
    });
  }, [receiptsArray, supplierFilter, documentTypeFilter, periodFilter]);

  // Handlers
  const onSubmit = (data: SupplierReceiptFormData) => {
    const formattedData = {
      ...data,
      supplier_id: parseInt(data.supplier_id),
      document_type_id: parseInt(data.document_type_id),
      purchase_order_id: (data.purchase_order_id && data.purchase_order_id !== "none") ? parseInt(data.purchase_order_id) : null,
      total_amount: parseFloat(data.total_amount),
    };

    if (editingReceipt) {
      updateMutation.mutate({ id: editingReceipt.id, ...formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (receipt: SupplierReceipt) => {
    setEditingReceipt(receipt);
    form.reset({
      receipt_date: receipt.receipt_date.split('T')[0],
      supplier_id: receipt.supplier_id.toString(),
      document_type_id: receipt.document_type_id.toString(),
      supplier_document_date: receipt.supplier_document_date?.split('T')[0] || '',
      supplier_document_number: receipt.supplier_document_number || '',
      total_amount: receipt.total_amount,
      comment: receipt.comment || '',
      purchase_order_id: receipt.purchase_order_id?.toString() || 'none',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Ви впевнені, що хочете видалити цей прихід?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleExpand = (receiptId: string | number) => {
    const id = typeof receiptId === 'string' ? parseInt(receiptId) : receiptId;
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Receipt items component for expanded view
  const ReceiptItemsView = ({ receiptId }: { receiptId: number }) => {
    const { data: receiptItemsData = [], isLoading: itemsLoading } = useQuery({
      queryKey: [`/api/supplier-receipt-items/${receiptId}`],
      enabled: !!receiptId,
    });
    
    const receiptItems = Array.isArray(receiptItemsData) ? receiptItemsData : [];

    if (itemsLoading) {
      return <div className="p-4 text-center">Завантаження...</div>;
    }

    if (!receiptItems.length) {
      return <div className="p-4 text-center text-gray-500">Немає позицій</div>;
    }

    return (
      <div className="border-t bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
          {/*<div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2">
            <h4 className="text-lg font-semibold text-white">Позиції документу</h4>
          </div>*/}
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 border-b">Компонент</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 border-b w-23">SKU</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 border-b w-23">Кількість</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 border-b w-23">Ціна за од.</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 border-b w-23">Cума</th>
                </tr>
              </thead>
              <tbody>
                {receiptItems.map((item: any, index: number) => {
                  const component = components.find((c: any) => c.id === item.component_id);
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-2 border-b border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900">
                            {component?.name || '-'}
                          </div>
                          {/*<div className="text-sm text-gray-500">
                            SKU: {component?.sku || 'N/A'}
                          </div>*/}
                          {item.supplier_component_name && (
                            <div className="text-xs text-blue-600 mt-1">
                              Назва у постачальника: {item.supplier_component_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-1 text-center border-b border-gray-100">
                        <span className="font-medium text-gray-900">
                          {component?.sku || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-center border-b border-gray-100">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-1 text-center border-b border-gray-100">
                        <span className="font-medium text-gray-900">
                          {parseFloat(item.unit_price).toFixed(2)} ₴
                        </span>
                      </td>
                      <td className="px-7 py-1 text-center border-b border-gray-100">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                          {parseFloat(item.total_price).toFixed(2)} ₴
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gradient-to-r from-blu-50 to-blue-10">
                <tr>
                  <td colSpan={4} className="px-5 py-2 text-right font-semibold text-gray-700 border-t-2 border-gray-300">
                    Загальна сума позицій:
                  </td>
                  <td className="px-5 py-2 text-center border-t-2 ">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-base font-bold bg-green-200 text-green-900">
                      {receiptItems.reduce((sum: number, item: any) => sum + parseFloat(item.total_price), 0).toFixed(2)} ₴
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Каталог приходів постачальників
              </h1>
              <p className="text-gray-600 text-lg">Керування документами надходжень товарів та матеріалів</p>
              <div className="flex items-center space-x-4">
                <Badge className="bg-green-100 text-green-800 px-3 py-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Активний модуль
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  Управління запасами
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                <Upload className="h-4 w-4 mr-2" />
                Імпорт XML
              </Button>
              <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <Download className="h-4 w-4 mr-2" />
                Експорт
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => {
                      setEditingReceipt(null);
                      form.reset({
                        receipt_date: new Date().toISOString().split('T')[0],
                        supplier_id: "",
                        document_type_id: "",
                        supplier_document_date: "",
                        supplier_document_number: "",
                        total_amount: "",
                        comment: "",
                        purchase_order_id: "none",
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Новий прихід
                  </Button>
                </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Загальна кількість приходів</p>
                  <p className="text-3xl font-bold text-blue-900">{statistics.totalReceipts}</p>
                  <p className="text-sm text-blue-600 mt-1">Всього документів у системі</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Загальна сума приходів</p>
                  <p className="text-3xl font-bold text-emerald-900">{statistics.totalAmount.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴</p>
                  <p className="text-sm text-emerald-600 mt-1">Сума всіх приходів</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Активні постачальники</p>
                  <p className="text-3xl font-bold text-purple-900">{statistics.uniqueSuppliers}</p>
                  <p className="text-sm text-purple-600 mt-1">Постачальників з приходами</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">Приходи цього місяця</p>
                  <p className="text-3xl font-bold text-orange-900">{statistics.thisMonthReceipts}</p>
                  <p className="text-sm text-orange-600 mt-1">За поточний місяць</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DataTable */}
        <DataTable
          data={filteredReceipts}
          columns={[
            { key: 'id', label: 'ID', sortable: true },
            { 
              key: 'receipt_date', 
              label: 'Дата приходу', 
              sortable: true,
              render: (value: any) => <UkrainianDate date={value} format="short" />
            },
            { key: 'supplier_name', label: 'Постачальник', sortable: true },
            { key: 'document_type_name', label: 'Тип документу', sortable: true },
            { key: 'supplier_document_number', label: 'Номер документу', sortable: true },
            { 
              key: 'total_amount', 
              label: 'Сума', 
              sortable: true,
              render: (value: any) => `${parseFloat(value || 0).toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴`
            },
            { key: 'purchase_order_number', label: 'Замовлення', sortable: true },
          ]}
          loading={isLoading}
          title="Список приходів від постачальників"
          storageKey="supplier-receipts"
          actions={(receipt) => (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(receipt);
                }}
                className="h-8 w-8 p-0"
                title="Редагувати"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
          expandableContent={(receipt) => <ReceiptItemsView receiptId={receipt.id} />}
          expandedItems={expandedItems}
          onToggleExpand={(itemId) => {
            const id = typeof itemId === 'string' ? parseInt(itemId) : itemId;
            setExpandedItems(prev => {
              const newSet = new Set(prev);
              if (newSet.has(id)) {
                newSet.delete(id);
              } else {
                newSet.add(id);
              }
              return newSet;
            });
          }}
        />
      </div>

      {/* Dialog for Create/Edit Receipt */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingReceipt ? 'Редагувати прихід' : 'Створити новий прихід'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingReceipt ? 'Внесіть зміни до інформації про прихід від постачальника' : 'Заповніть форму для створення нового приходу від постачальника'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="receipt_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дата приходу</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="supplier_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Постачальник</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть постачальника" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {suppliers.map((supplier: any) => (
                                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                    {supplier.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="document_type_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Тип документу</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть тип документу" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {documentTypes.map((type: any) => (
                                  <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="purchase_order_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Замовлення (опціонально)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть замовлення" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Без замовлення</SelectItem>
                                {purchaseOrders.map((order: any) => (
                                  <SelectItem key={order.id} value={order.id.toString()}>
                                    {order.orderNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="supplier_document_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дата документу постачальника</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="supplier_document_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Номер документу постачальника</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="total_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Загальна сума</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Коментар</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-between space-x-2">
                      {editingReceipt && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          onClick={() => {
                            if (confirm('Ви впевнені, що хочете видалити цей прихід? Цю дію неможливо скасувати.')) {
                              handleDelete(editingReceipt.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deleteMutation.isPending ? 'Видалення...' : 'Видалити'}
                        </Button>
                      )}
                      <div className="flex space-x-2 ml-auto">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Скасувати
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                          {createMutation.isPending || updateMutation.isPending ? 'Збереження...' : 'Зберегти'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <main className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Загальна кількість приходів</p>
                  <p className="text-3xl font-bold text-blue-900">{statistics.totalReceipts}</p>
                  <p className="text-sm text-blue-600 mt-1">Всього документів у системі</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Package className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Загальна сума приходів</p>
                  <p className="text-3xl font-bold text-emerald-900">{statistics.totalAmount.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴</p>
                  <p className="text-sm text-emerald-600 mt-1">Сума всіх приходів</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Активні постачальники</p>
                  <p className="text-3xl font-bold text-purple-900">{statistics.uniqueSuppliers}</p>
                  <p className="text-sm text-purple-600 mt-1">Постачальників з приходами</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">Приходи цього місяця</p>
                  <p className="text-3xl font-bold text-orange-900">{statistics.thisMonthReceipts}</p>
                  <p className="text-sm text-orange-600 mt-1">За поточний місяць</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Фільтри:</span>
              </div>
              <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Фільтр за типом документу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі типи документів</SelectItem>
                  {[...new Set(receiptsArray.map((r: any) => r.document_type_name).filter(Boolean))].map((name) => (
                    <SelectItem key={name as string} value={name as string}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Фільтр за періодом" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі періоди</SelectItem>
                  <SelectItem value="week">Останній тиждень</SelectItem>
                  <SelectItem value="month">Останній місяць</SelectItem>
                  <SelectItem value="quarter">Останній квартал</SelectItem>
                  <SelectItem value="year">Останній рік</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Знайдено: {filteredReceipts.length} з {receiptsArray.length} приходів</span>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          data={filteredReceipts}
          columns={[
            { key: 'id', label: 'ID', sortable: true },
            { 
              key: 'receipt_date', 
              label: 'Дата приходу', 
              sortable: true,
              render: (value: any) => <UkrainianDate date={value} format="short" />
            },
            { key: 'supplier_name', label: 'Постачальник', sortable: true },
            { key: 'document_type_name', label: 'Тип документу', sortable: true },
            { key: 'supplier_document_number', label: 'Номер документу', sortable: true },
            { key: 'total_amount', label: 'Сума', sortable: true },
            { key: 'purchase_order_number', label: 'Замовлення', sortable: true },
          ]}
          loading={isLoading}
          title="Список приходів від постачальників"
          storageKey="supplier-receipts"
          actions={(receipt) => (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(receipt);
                }}
                className="h-8 w-8 p-0"
                title="Редагувати"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
          expandableContent={(receipt) => <ReceiptItemsView receiptId={receipt.id} />}
          expandedItems={expandedItems}
          onToggleExpand={(itemId) => {
            const id = typeof itemId === 'string' ? parseInt(itemId) : itemId;
            setExpandedItems(prev => {
              const newSet = new Set(prev);
              if (newSet.has(id)) {
                newSet.delete(id);
              } else {
                newSet.add(id);
              }
              return newSet;
            });
          }}
        />
      </main>
    </div>
  );
}