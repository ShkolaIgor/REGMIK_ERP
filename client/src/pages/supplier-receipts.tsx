import React, { useState, useMemo, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Package, FileText, TrendingUp, Calendar, Download, Upload, HandPlatter, Edit, Scan, Printer, AlertTriangle, Trash2, ChevronsUpDown, Check} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { UkrainianDate } from "@/components/ui/ukrainian-date";
import { useAuth } from "@/hooks/useAuth";

import { 
  insertSupplierReceiptSchema, 
  type SupplierReceiptWithJoins 
} from "@/shared/schema";

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
  const [editingReceipt, setEditingReceipt] = useState<SupplierReceiptWithJoins | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [receiptItems, setReceiptItems] = useState<any[]>([]);

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

  const { data: components = [] } = useQuery({
    queryKey: ["/api/components"],
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      await queryClient.refetchQueries({ queryKey: ["/api/supplier-receipts"] });
      handleCloseDialog();
      toast({ title: "Прихід створено успішно" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка створення приходу", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/supplier-receipts/${id}`, "PUT", data),
    onSuccess: async (updatedReceipt, { id }) => {
      console.log('Update successful, updating cache...', updatedReceipt);
      
      // Оновлюємо дані в кеші
      queryClient.setQueryData(["/api/supplier-receipts"], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((receipt: any) => 
          receipt.id === id ? { ...receipt, ...updatedReceipt } : receipt
        );
      });
      
      // Додатково інвалідуємо кеш для гарантії
      await queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      
      console.log('Cache updated and invalidated');
      handleCloseDialog();
      toast({ title: "Прихід оновлено успішно" });
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast({ title: "Помилка оновлення приходу", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/supplier-receipts/${id}`, "DELETE"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      await queryClient.refetchQueries({ queryKey: ["/api/supplier-receipts"] });
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
        receipt.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.documentTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.supplierDocumentNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      // Supplier filter  
      const matchesSupplier = supplierFilter === "all" || 
        receipt.supplierId?.toString() === supplierFilter;

      // Document type filter
      const matchesDocumentType = documentTypeFilter === "all" || 
        receipt.documentTypeId?.toString() === documentTypeFilter;

      return matchesSearch && matchesSupplier && matchesDocumentType;
    });
  }, [receiptsArray, searchQuery, supplierFilter, documentTypeFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const totalReceipts = filteredReceipts.length;
    const totalAmount = filteredReceipts.reduce((sum: number, receipt: any) => sum + parseFloat(receipt.totalAmount || '0'), 0);
    const uniqueSuppliers = new Set(filteredReceipts.map((r: any) => r.supplierId)).size;
    const thisMonthReceipts = filteredReceipts.filter((receipt: any) => {
      const receiptDate = new Date(receipt.receiptDate);
      const now = new Date();
      return receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear();
    }).length;

    return { totalReceipts, totalAmount, uniqueSuppliers, thisMonthReceipts };
  }, [filteredReceipts]);

  // Функція для розрахунку загальної суми
  const calculateTotalAmount = (): number => {
    return receiptItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity || '0');
      const unitPrice = parseFloat(item.unitPrice || '0');
      return sum + (quantity * unitPrice);
    }, 0);
  };

  // Оновлення загальної суми при зміні позицій
  useEffect(() => {
    const totalAmount = calculateTotalAmount();
    form.setValue('total_amount', totalAmount.toFixed(2));
  }, [receiptItems, form]);

  // Handlers
  const onSubmit = (data: SupplierReceiptFormData) => {
    const formattedData = {
      ...data,
      receipt_date: data.receipt_date || new Date().toISOString().split('T')[0],
      supplier_document_date: data.supplier_document_date || null,
      supplier_id: parseInt(data.supplier_id),
      document_type_id: parseInt(data.document_type_id),
      purchase_order_id: (data.purchase_order_id && data.purchase_order_id !== "none") ? parseInt(data.purchase_order_id) : null,
      total_amount: parseFloat(data.total_amount) || calculateTotalAmount(),
      items: receiptItems.map(item => ({
        componentId: item.componentId,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
      })),
    };

    if (editingReceipt) {
      updateMutation.mutate({ id: editingReceipt.id, ...formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = async (receipt: any) => {
    setEditingReceipt(receipt);
    form.reset({
      receipt_date: receipt.receiptDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      supplier_id: receipt.supplierId?.toString() || '',
      document_type_id: receipt.documentTypeId?.toString() || '',
      supplier_document_date: receipt.supplierDocumentDate?.split('T')[0] || '',
      supplier_document_number: receipt.supplierDocumentNumber || '',
      total_amount: receipt.totalAmount?.toString() || '0',
      comment: receipt.comment || '',
      purchase_order_id: receipt.purchaseOrderId?.toString() || 'none',
    });

    // Завантажуємо позиції приходу для редагування
    try {
      const response = await fetch(`/api/supplier-receipts/${receipt.id}/items`);
      if (response.ok) {
        const items = await response.json();
        setReceiptItems(items.map((item: any) => ({
          componentId: item.component_id || 0,
          quantity: item.quantity?.toString() || "",
          unitPrice: item.unit_price?.toString() || "0",
          componentName: item.component_name || "",
        })));
      } else {
        setReceiptItems([]);
      }
    } catch (error) {
      console.error('Error loading receipt items:', error);
      setReceiptItems([]);
    }

    setIsDialogOpen(true);
  };

  // Функції для управління позиціями приходу
  const addReceiptItem = () => {
    setReceiptItems([...receiptItems, { componentId: 0, quantity: "", unitPrice: "", componentName: "" }]);
  };

  const removeReceiptItem = (index: number) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== index));
  };

  const updateReceiptItem = (index: number, field: string, value: any) => {
    const updated = [...receiptItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Якщо обирається компонент, автоматично встановлюємо його назву та ціну
    if (field === "componentId" && value > 0 && components) {
      const selectedComponent = components.find((c: any) => c.id === value);
      if (selectedComponent) {
        updated[index].componentName = selectedComponent.name;
        updated[index].unitPrice = selectedComponent.costPrice?.toString() || "0";
      }
    }
    
    setReceiptItems(updated);
  };

  // Функція закриття діалогу з очищенням даних
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingReceipt(null);
    setReceiptItems([]);
    form.reset();
  };

  const handleToggleExpand = (receiptId: string | number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(receiptId as number)) {
        newSet.delete(receiptId as number);
      } else {
        newSet.add(receiptId as number);
      }
      return newSet;
    });
  };

  // Component for displaying receipt items
  const ReceiptItemsView = ({ receiptId }: { receiptId: number }) => {
    const { data: items, isLoading: itemsLoading, error } = useQuery({
      queryKey: [`/api/supplier-receipts/${receiptId}/items`],
      enabled: receiptId > 0,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      retry: false, // Don't retry failed requests
    });

    if (itemsLoading) {
      return (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-blue-700 font-medium">Завантаження позицій приходу...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400">
          <p className="text-red-700 font-medium">
            Помилка завантаження позицій: {error.message || 'Невідома помилка'}
          </p>
        </div>
      );
    }

    if (!items || items.length === 0) {
      return (
        <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400">
          <p className="text-gray-600 font-medium">Немає позицій для цього приходу</p>
        </div>
      );
    }

    return (
      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400">
        <h4 className="text-green-800 font-bold mb-4 text-lg flex items-center gap-2">
          <Package className="w-5 h-5" />
          Позиції приходу ({items.length})
        </h4>
        <div className="grid gap-3">
          {items.map((item: any, index: number) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-green-700 block">Товар:</span>
                  <span className="text-gray-900 font-semibold">
                    {item.component_name || item.supplier_component_name || item.productName || 'Невідомий компонент'}
                  </span>
                  {item.component_sku && (
                    <span className="text-gray-500 text-xs block">SKU: {item.component_sku}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700 block">Кількість:</span>
                  <span className="text-gray-900 font-semibold">{item.quantity || 0}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700 block">Ціна за од.:</span>
                  <span className="text-gray-900 font-semibold">
                    {parseFloat(item.unit_price || item.unitPrice || 0).toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ₴
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-green-700 block">Загальна сума:</span>
                  <span className="text-gray-900 font-bold text-lg text-green-600">
                    {parseFloat(item.total_price || item.totalPrice || 0).toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ₴
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Ви впевнені, що хочете видалити цей прихід?')) {
      deleteMutation.mutate(id);
    }
  };

  // DataTable columns for modern table
  const columns: DataTableColumn[] = [
    { 
      key: 'id', 
      label: 'ID', 
      sortable: true, 
      width: 80,
      type: 'number'
    },
    { 
      key: 'receiptDate', 
      label: 'Дата приходу', 
      sortable: true,
      type: 'date',
      render: (value: any) => <UkrainianDate date={value} format="short" />
    },
    { 
      key: 'supplierName', 
      label: 'Постачальник', 
      sortable: true,
      type: 'text',
      minWidth: 150
    },
    { 
      key: 'documentTypeName', 
      label: 'Тип документу', 
      sortable: true,
      type: 'badge',
      width: 120
    },
    { 
      key: 'supplierDocumentNumber', 
      label: 'Номер документу', 
      sortable: true,
      type: 'text',
      width: 140
    },
    { 
      key: 'totalAmount', 
      label: 'Сума', 
      sortable: true,
      type: 'number',
      width: 120,
      render: (value: any) => `${parseFloat(value || 0).toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴`
    },
    { 
      key: 'purchaseOrderNumber', 
      label: 'Замовлення', 
      sortable: true,
      type: 'text',
      width: 120
    },
    {
      key: 'actions',
      label: 'Дії',
      width: 100,
      render: (value: any, receipt: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline" 
            size="sm"
            onClick={() => handleEdit(receipt)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <HandPlatter className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Приходи постачальників
                </h1>
                <p className="text-gray-600 mt-1">Керування документами надходжень товарів та матеріалів</p>
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
                  setReceiptItems([]);
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
                    <p className="text-sm text-orange-700 font-medium">За цей місяць</p>
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


        {/* Main DataTable with full functionality */}
        <div className="w-full">
          <Card>
            <CardContent className="p-0">
              <DataTable
                data={filteredReceipts}
                columns={columns}
                loading={isLoading}
                title="Список приходів постачальників"
                description="Оберіть прихід для перегляду та редагування деталей документу"
                storageKey="supplier-receipts-table"
                expandableContent={(receipt: any) => <ReceiptItemsView receiptId={receipt.id} />}
                expandedItems={expandedItems}
                onToggleExpand={handleToggleExpand}
              />
            </CardContent>
          </Card>
        </div>
        

      </div>

      {/* Dialog for Create/Edit Receipt */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog();
        } else {
          setIsDialogOpen(true);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingReceipt ? 'Редагувати прихід' : 'Створити новий прихід'}
            </DialogTitle>
            <DialogDescription>
              {editingReceipt ? 'Внесіть зміни до інформації про прихід від постачальника' : 'Заповніть форму для створення нового приходу від постачальника'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-1">
            <Form {...form}>
              <form id="receipt-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              {/* Позиції приходу */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Позиції приходу</Label>
                  <Button type="button" onClick={addReceiptItem} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Додати позицію
                  </Button>
                </div>

                {receiptItems.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <Package className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Додайте позиції до приходу</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto border bg-white rounded-lg p-2">
                    {receiptItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg bg-white">
                        <div className="flex-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {item.componentId > 0 && components ? 
                                  components.find((c: any) => c.id === item.componentId)?.name || item.componentName || "Оберіть компонент..." 
                                  : "Оберіть компонент..."
                                }
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Пошук компонентів..." />
                                <CommandEmpty>Компонентів не знайдено.</CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-y-auto">
                                  {components.map((component: any) => (
                                    <CommandItem
                                      key={component.id}
                                      onSelect={() => updateReceiptItem(index, "componentId", component.id)}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          item.componentId === component.id ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium">{component.name}</div>
                                        {component.sku && (
                                          <div className="text-xs text-gray-500">SKU: {component.sku}</div>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            placeholder="Кільк."
                            value={item.quantity}
                            onChange={(e) => updateReceiptItem(index, "quantity", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-28">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Ціна"
                            value={item.unitPrice}
                            onChange={(e) => updateReceiptItem(index, "unitPrice", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-32 text-right font-medium">
                          {(parseFloat(item.quantity || "0") * parseFloat(item.unitPrice || "0")).toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ₴
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeReceiptItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {receiptItems.length > 0 && (
                      <div className="flex justify-end pt-2 border-t">
                        <div className="text-lg font-bold text-green-600">
                          Всього: {receiptItems.reduce((sum, item) => 
                            sum + (parseFloat(item.quantity || "0") * parseFloat(item.unitPrice || "0")), 0
                          ).toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ₴
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </form>
            </Form>
          </div>
          <div className="flex-shrink-0 border-t pt-4">
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
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Скасувати
                </Button>
                <Button type="submit" form="receipt-form">
                  {editingReceipt ? 'Оновити' : 'Створити'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import XML Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Імпорт XML файлу</DialogTitle>
            <DialogDescription>
              Завантажте XML файл з приходами постачальників
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="xml-file" className="text-sm font-medium">
                Оберіть XML файл
              </label>
              <input
                id="xml-file"
                type="file"
                accept=".xml"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsImportDialogOpen(false)}
              >
                Скасувати
              </Button>
              <Button onClick={() => {
                // TODO: Implement XML import logic
                toast({ title: "Функція імпорту в розробці" });
                setIsImportDialogOpen(false);
              }}>
                Імпортувати
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}