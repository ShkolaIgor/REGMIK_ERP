import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
//import { Card, CardContent } from "@/components/ui/card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Package, FileText, TrendingUp, Calendar, Download, Upload, HandPlatter, Edit, Scan, Printer, AlertTriangle} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { UkrainianDate } from "@/components/ui/ukrainian-date";
import { useAuth } from "@/hooks/useAuth";

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
  supplier_name?: string;
  document_type_name?: string;
  purchase_order_number?: string;
}

// Form schema
const supplierReceiptSchema = z.object({
  receipt_date: z.string().min(1, "Дата приходу обов'язкова"),
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<SupplierReceipt | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Queries
  const { data: receiptsData = [], isLoading } = useQuery({
    queryKey: ["/api/supplier-receipts"],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ["/api/supplier-document-types"],
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });

  const receiptsArray = Array.isArray(receiptsData) ? receiptsData : [];

  // Form
  const form = useForm<SupplierReceiptFormData>({
    resolver: zodResolver(supplierReceiptSchema),
    defaultValues: {
      receipt_date: new Date().toISOString().split('T')[0],
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

  // Filter receipts based on search and filters
  const filteredReceipts = useMemo(() => {
    return receiptsArray.filter((receipt: any) => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        receipt.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.document_type_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.supplier_document_number?.toLowerCase().includes(searchQuery.toLowerCase());

      // Supplier filter
      const matchesSupplier = supplierFilter === "all" || 
        receipt.supplier_id.toString() === supplierFilter;

      // Document type filter
      const matchesDocumentType = documentTypeFilter === "all" || 
        receipt.document_type_id.toString() === documentTypeFilter;

      return matchesSearch && matchesSupplier && matchesDocumentType;
    });
  }, [receiptsArray, searchQuery, supplierFilter, documentTypeFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const totalReceipts = filteredReceipts.length;
    const totalAmount = filteredReceipts.reduce((sum: number, receipt: any) => sum + parseFloat(receipt.total_amount || '0'), 0);
    const uniqueSuppliers = new Set(filteredReceipts.map((r: any) => r.supplier_id)).size;
    const thisMonthReceipts = filteredReceipts.filter((receipt: any) => {
      const receiptDate = new Date(receipt.receipt_date);
      const now = new Date();
      return receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear();
    }).length;

    return { totalReceipts, totalAmount, uniqueSuppliers, thisMonthReceipts };
  }, [filteredReceipts]);

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

  // Receipt items component for expanded view
  const ReceiptItemsView = ({ receiptId }: { receiptId: number }) => {
    console.log('ReceiptItemsView called with receiptId:', receiptId);
    
    const { data: receiptItemsData = [], isLoading: itemsLoading, error } = useQuery({
      queryKey: [`/api/supplier-receipt-items/${receiptId}`],
      enabled: !!receiptId,
    });
    
    console.log('Receipt items data:', receiptItemsData);
    console.log('Loading:', itemsLoading);
    console.log('Error:', error);
    
    const receiptItems = Array.isArray(receiptItemsData) ? receiptItemsData : [];

    if (itemsLoading) {
      return <div className="p-4 text-center">Завантаження позицій...</div>;
    }

    if (error) {
      return <div className="p-4 text-center text-red-500">Помилка завантаження: {error.message}</div>;
    }

    if (!receiptItems.length) {
      return <div className="p-4 text-center text-gray-500">Немає позицій для цього приходу</div>;
    }

    return (
      <div className="border-t bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 border-b">Компонент</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 border-b w-23">SKU</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 border-b w-23">Кількість</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 border-b w-23">Ціна за од.</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 border-b w-23">Сума</th>
                </tr>
              </thead>
              <tbody>
                {receiptItems.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="px-4 py-3 text-sm">{item.component_name || 'Невідомий компонент'}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{item.component_sku || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-center">{parseFloat(item.unit_price || 0).toFixed(2)} ₴</td>
                    <td className="px-4 py-3 text-sm text-center font-bold text-blue-600">
                      {(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)).toFixed(2)} ₴
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700">Загальна сума:</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-700 text-lg">
                    {receiptItems.reduce((sum: number, item: any) => 
                      sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)), 0
                    ).toFixed(2)} ₴
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // DataTable columns
  const columns: DataTableColumn[] = [
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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <HandPlatter className="w-6 h-6 text-white" />
            </div>
            <div >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Приходи постачальників
              </h1>
              <p className="text-gray-600 mt-1">Керування документами надходжень товарів та матеріалів</p>
            </div>
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
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Загальна кількість приходів</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{statistics.totalReceipts}</p>
                  <p className="text-xs text-blue-600">Всього документів у системі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">Загальна сума приходів</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900 mb-1">{statistics.totalAmount.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴</p>
                  <p className="text-xs text-emerald-600">Сума всіх приходів</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Активні постачальники</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{statistics.uniqueSuppliers}</p>
                  <p className="text-xs text-purple-600">Постачальників з приходами</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Приходи цього місяця</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{statistics.thisMonthReceipts}</p>
                  <p className="text-xs text-orange-600">За поточний місяць</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="w-full py-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Пошук приходів за постачальником, документом, номером..."
            filters={[
              {
                key: "supplier",
                label: "Постачальник",
                value: supplierFilter,
                onChange: setSupplierFilter,
                options: [
                  { value: "all", label: "Всі постачальники" },
                  ...suppliers.map((supplier: any) => ({
                    value: supplier.id.toString(),
                    label: supplier.name
                  }))
                ]
              },
              {
                key: "documentType",
                label: "Тип документу",
                value: documentTypeFilter,
                onChange: setDocumentTypeFilter,
                options: [
                  { value: "all", label: "Всі типи" },
                  ...documentTypes.map((type: any) => ({
                    value: type.id.toString(),
                    label: type.name
                  }))
                ]
              }
            ]}
          />
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(true)}
                  className={`border-blue-200 text-blue-600 hover:bg-blue-50 ${!isAuthenticated ? 'opacity-50' : ''}`}
                  disabled={!isAuthenticated}
                  title={!isAuthenticated ? "Потрібна авторизація для імпорту" : ""}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Імпорт XML
                  {!isAuthenticated && <AlertTriangle className="ml-2 h-4 w-4 text-orange-500" />}
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Експорт
                </Button>
                <Button variant="outline" disabled>
                  <Scan className="w-4 h-4 mr-2" />
                  Сканер штрих-кодів
                </Button>
                <Button variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Друкувати етикетки
                </Button>
              </div>
              </div>
              </CardContent>
              </Card>
              </div>

        {/* DataTable */}
        <DataTable
          data={filteredReceipts}
          columns={columns}
          loading={isLoading}
          title="Список приходів від постачальників"
          description="Оберіть прихід для перегляду та редагування"
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
              <div className="flex justify-between">
                <div>
                  {editingReceipt && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => handleDelete(editingReceipt.id)}
                    >
                      Видалити
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Скасувати
                  </Button>
                  <Button type="submit">
                    {editingReceipt ? 'Оновити' : 'Створити'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}