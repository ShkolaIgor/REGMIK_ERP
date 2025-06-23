import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit2, Trash2, Upload, FileText, Calendar, Package, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { SupplierReceiptsXmlImport } from "@/components/SupplierReceiptsXmlImport";
import { ComponentMappingDialog } from "@/components/ComponentMappingDialog";
import { SupplierReceiptsImport } from "@/components/SupplierReceiptsImport";
import { SupplierReceiptItemsImport } from "@/components/SupplierReceiptItemsImport";
import React from 'react';

// Component to show receipt items when expanded
function ReceiptItemsExpanded({ receiptId }: { receiptId: number }) {
  const { data: receiptItems = [], isLoading } = useQuery({
    queryKey: [`/api/supplier-receipt-items/${receiptId}`],
    enabled: !!receiptId,
  });

  const { data: componentsData = [] } = useQuery({
    queryKey: ["/api/components"],
  });
  const components = Array.isArray(componentsData) ? componentsData : [];

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Завантаження позицій...</p>
      </div>
    );
  }

  if (!receiptItems.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p>Позиції не знайдено</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Package className="h-4 w-4" />
        Позиції приходу ({receiptItems.length})
      </h4>
      
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium text-gray-700">Компонент</th>
                <th className="text-left p-3 font-medium text-gray-700">Назва постачальника</th>
                <th className="text-left p-3 font-medium text-gray-700">Кількість</th>
                <th className="text-left p-3 font-medium text-gray-700">Ціна за од.</th>
                <th className="text-left p-3 font-medium text-gray-700">Сума</th>
              </tr>
            </thead>
            <tbody>
              {receiptItems.map((item: SupplierReceiptItem) => {
                const component = components.find((c: Component) => c.id === item.component_id);
                
                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {component?.name || 'Компонент не знайдено'}
                        </span>
                        {component?.sku && (
                          <span className="text-xs text-gray-500">
                            Артикул: {component.sku}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {item.supplier_component_name ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{item.supplier_component_name}</span>
                          {component && (
                            <Badge variant="secondary" className="text-xs">
                              Співставлено
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Не вказано</span>
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {parseFloat(item.quantity).toLocaleString('uk-UA')}
                    </td>
                    <td className="p-3">
                      {parseFloat(item.unit_price).toLocaleString('uk-UA')} ₴
                    </td>
                    <td className="p-3 font-bold text-green-600">
                      {parseFloat(item.total_price).toLocaleString('uk-UA')} ₴
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="p-3 text-right font-medium text-gray-700">
                  Загальна сума:
                </td>
                <td className="p-3 font-bold text-lg text-green-600">
                  {receiptItems.reduce((sum, item) => 
                    sum + parseFloat(item.total_price), 0
                  ).toLocaleString('uk-UA')} ₴
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

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
  items?: SupplierReceiptItem[];
}

interface SupplierReceiptItem {
  id: number;
  receipt_id: number;
  component_id: number;
  quantity: string;
  unit_price: string;
  total_price: string;
  supplier_component_name?: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Component {
  id: number;
  name: string;
  sku: string;
  costPrice: string;
}

interface SupplierDocumentType {
  id: number;
  name: string;
}

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
}

export default function SupplierReceipts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<SupplierReceipt | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [expandedReceiptId, setExpandedReceiptId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>('receipt_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('');
  const [showReceiptsImportDialog, setShowReceiptsImportDialog] = useState(false);
  const [showReceiptItemsImportDialog, setShowReceiptItemsImportDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    receiptDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    documentTypeId: '',
    supplierDocumentDate: '',
    supplierDocumentNumber: '',
    totalAmount: '',
    comment: '',
    purchaseOrderId: '',
    items: [] as any[]
  });

  // Queries
  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["/api/supplier-receipts"],
  });

  const { data: suppliersData = { suppliers: [] } } = useQuery({
    queryKey: ["/api/suppliers"],
  });
  const suppliers = suppliersData.suppliers || [];

  const { data: componentsData = [] } = useQuery({
    queryKey: ["/api/components"],
  });
  const components = Array.isArray(componentsData) ? componentsData : [];

  const { data: documentTypes = [] } = useQuery({
    queryKey: ["/api/supplier-document-types"],
  });

  const { data: purchaseOrdersData = [] } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });
  const purchaseOrders = Array.isArray(purchaseOrdersData) ? purchaseOrdersData : [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/supplier-receipts', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Прихід створено успішно" });
    },
    onError: (error) => {
      toast({ 
        title: "Помилка створення приходу", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/supplier-receipts/${id}`, {
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      setIsDialogOpen(false);
      setEditingReceipt(null);
      resetForm();
      toast({ title: "Прихід оновлено успішно" });
    },
    onError: (error) => {
      toast({ 
        title: "Помилка оновлення приходу", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/supplier-receipts/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      setShowDeleteAlert(false);
      setEditingReceipt(null);
      toast({ title: "Прихід видалено успішно" });
    },
    onError: (error) => {
      toast({ 
        title: "Помилка видалення приходу", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      receiptDate: new Date().toISOString().split('T')[0],
      supplierId: '',
      documentTypeId: '',
      supplierDocumentDate: '',
      supplierDocumentNumber: '',
      totalAmount: '',
      comment: '',
      purchaseOrderId: '',
      items: []
    });
    setEditingReceipt(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      supplierId: parseInt(formData.supplierId),
      documentTypeId: parseInt(formData.documentTypeId),
      totalAmount: parseFloat(formData.totalAmount),
      purchaseOrderId: formData.purchaseOrderId ? parseInt(formData.purchaseOrderId) : null,
      supplierDocumentDate: formData.supplierDocumentDate || null,
    };

    if (editingReceipt) {
      updateMutation.mutate({ id: editingReceipt.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = async (receipt: any) => {
    setEditingReceipt(receipt);
    
    // Load receipt items
    try {
      const itemsResponse = await fetch(`/api/supplier-receipt-items/${receipt.id}`);
      const items = itemsResponse.ok ? await itemsResponse.json() : [];
      
      setFormData({
        receiptDate: receipt.receipt_date ? receipt.receipt_date.split('T')[0] : new Date().toISOString().split('T')[0],
        supplierId: receipt.supplier_id?.toString() || '',
        documentTypeId: receipt.document_type_id?.toString() || '1',
        supplierDocumentDate: receipt.supplier_document_date ? receipt.supplier_document_date.split('T')[0] : '',
        supplierDocumentNumber: receipt.supplier_document_number || '',
        totalAmount: receipt.total_amount?.toString() || '0',
        comment: receipt.comment || '',
        purchaseOrderId: receipt.purchase_order_id?.toString() || '',
        items: items.map((item: any) => ({
          componentId: item.component_id?.toString() || '',
          quantity: item.quantity?.toString() || '',
          unitPrice: item.unit_price?.toString() || '',
          totalPrice: item.total_price?.toString() || '',
          supplierComponentName: item.supplier_component_name || ''
        }))
      });
    } catch (error) {
      console.error('Error loading receipt items:', error);
      setFormData({
        receiptDate: receipt.receipt_date ? receipt.receipt_date.split('T')[0] : new Date().toISOString().split('T')[0],
        supplierId: receipt.supplier_id?.toString() || '',
        documentTypeId: receipt.document_type_id?.toString() || '1',
        supplierDocumentDate: receipt.supplier_document_date ? receipt.supplier_document_date.split('T')[0] : '',
        supplierDocumentNumber: receipt.supplier_document_number || '',
        totalAmount: receipt.total_amount?.toString() || '0',
        comment: receipt.comment || '',
        purchaseOrderId: receipt.purchase_order_id?.toString() || '',
        items: []
      });
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (editingReceipt) {
      deleteMutation.mutate(editingReceipt.id);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { componentId: '', quantity: '', unitPrice: '', totalPrice: '', supplierComponentName: '' }
      ]
    }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-calculate total price
          if (field === 'quantity' || field === 'unitPrice') {
            const quantity = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
            const unitPrice = parseFloat(field === 'unitPrice' ? value : item.unitPrice) || 0;
            updatedItem.totalPrice = (quantity * unitPrice).toFixed(2);
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Calculate total automatically
  const calculateTotal = () => {
    const total = formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.totalPrice) || 0);
    }, 0);
    setFormData(prev => ({ ...prev, totalAmount: total.toFixed(2) }));
  };

  // Sort and filter function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Filter and sort receipts
  const filteredReceipts = receipts.filter((receipt: any) => {
    // Use supplier_name from JOIN query instead of looking up
    const supplierName = receipt.supplier_name || '';
    const documentTypeName = receipt.document_type_name || '';
    
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        supplierName.toLowerCase().includes(searchLower) ||
        receipt.supplier_document_number?.toLowerCase().includes(searchLower) ||
        receipt.comment?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Supplier filter
    if (supplierFilter && supplierName !== supplierFilter) return false;
    
    // Document type filter
    if (documentTypeFilter && documentTypeName !== documentTypeFilter) return false;
    
    return true;
  }).sort((a: any, b: any) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    // Handle supplier name sorting - now using supplier_name from JOIN
    if (sortField === 'supplier_name') {
      aValue = a.supplier_name || '';
      bValue = b.supplier_name || '';
    }
    
    // Handle document type sorting - now using document_type_name from JOIN
    if (sortField === 'document_type_name') {
      aValue = a.document_type_name || '';
      bValue = b.document_type_name || '';
    }
    
    // Convert to appropriate types for comparison
    if (sortField === 'total_amount') {
      aValue = parseFloat(aValue || '0');
      bValue = parseFloat(bValue || '0');
    } else if (sortField === 'receipt_date' || sortField === 'supplier_document_date') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const total = filteredReceipts.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentReceipts = filteredReceipts.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-50/30">
        <div className="w-full px-6 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Завантаження приходів...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50/30">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Приходи від постачальників</h1>
            <p className="text-muted-foreground">
              Управління приходами товарів ({filteredReceipts.length} з {receipts.length})
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => setShowMappingDialog(true)} variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Співставлення компонентів
            </Button>
            <Button onClick={() => setShowReceiptsImportDialog(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Імпорт приходів
            </Button>
            <Button onClick={() => setShowReceiptItemsImportDialog(true)} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Імпорт позицій
            </Button>
            <Button onClick={() => setShowImportDialog(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Імпорт XML
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Новий прихід
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Пошук за постачальником, номером документу або коментарем..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Фільтр за постачальником" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Усі постачальники</SelectItem>
                {[...new Set(receipts.map((r: any) => r.supplier_name).filter(Boolean))].map((name) => (
                  <SelectItem key={name} value={name as string}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Фільтр за типом документу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Усі типи документів</SelectItem>
                {[...new Set(receipts.map((r: any) => r.document_type_name).filter(Boolean))].map((name) => (
                  <SelectItem key={name} value={name as string}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Знайдено записів: {filteredReceipts.length}</span>
            {(searchQuery || supplierFilter || documentTypeFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSupplierFilter('');
                  setDocumentTypeFilter('');
                  setCurrentPage(1);
                }}
              >
                Очистити фільтри
              </Button>
            )}
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th 
                    className="text-left p-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('receipt_date')}
                  >
                    <div className="flex items-center gap-2">
                      Дата отримання
                      {getSortIcon('receipt_date')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('supplier_name')}
                  >
                    <div className="flex items-center gap-2">
                      Постачальник
                      {getSortIcon('supplier_name')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('document_type_name')}
                  >
                    <div className="flex items-center gap-2">
                      Тип документу
                      {getSortIcon('document_type_name')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('supplier_document_number')}
                  >
                    <div className="flex items-center gap-2">
                      № документу
                      {getSortIcon('supplier_document_number')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total_amount')}
                  >
                    <div className="flex items-center gap-2">
                      Сума
                      {getSortIcon('total_amount')}
                    </div>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">Дії</th>
                </tr>
              </thead>
              <tbody>
                {currentReceipts.map((receipt: any) => {
                  const isExpanded = expandedReceiptId === receipt.id;
                  
                  return (
                    <React.Fragment key={receipt.id}>
                      <tr 
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedReceiptId(isExpanded ? null : receipt.id)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(receipt.receipt_date).toLocaleDateString('uk-UA')}
                          </div>
                        </td>
                        <td className="p-4 font-medium">{receipt.supplier_name || '—'}</td>
                        <td className="p-4">{receipt.document_type_name || '—'}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{receipt.supplier_document_number || '—'}</span>
                            {receipt.supplier_document_date && (
                              <span className="text-sm text-gray-500">
                                від {new Date(receipt.supplier_document_date).toLocaleDateString('uk-UA')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-green-600">{parseFloat(receipt.total_amount).toLocaleString('uk-UA')} ₴</td>
                        <td className="p-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(receipt);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      
                      {/* Expanded row with receipt items */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="p-0">
                            <ReceiptItemsExpanded receiptId={receipt.id} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Pagination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Показано {startIndex + 1}-{Math.min(endIndex, total)} з {total} результатів
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Рядків на сторінці:</label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Перша
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Попередня
              </Button>
              
              <div className="flex items-center gap-1">
                {currentPage > 3 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </Button>
                    {currentPage > 4 && <span className="text-gray-400">...</span>}
                  </>
                )}
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }).filter(Boolean)}
                
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Наступна
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Остання
              </Button>
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReceipt ? 'Редагувати прихід' : 'Новий прихід від постачальника'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Main fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="receiptDate">Дата отримання *</Label>
                  <Input
                    id="receiptDate"
                    type="date"
                    value={formData.receiptDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, receiptDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplierId">Постачальник *</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть постачальника" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier: Supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="documentTypeId">Тип документу *</Label>
                  <Select
                    value={formData.documentTypeId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, documentTypeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип документу" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type: SupplierDocumentType) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="purchaseOrderId">Замовлення постачальнику</Label>
                  <Select
                    value={formData.purchaseOrderId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, purchaseOrderId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть замовлення (необов'язково)" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrders.map((order: PurchaseOrder) => (
                        <SelectItem key={order.id} value={order.id.toString()}>
                          {order.orderNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="supplierDocumentDate">Дата документу постачальника</Label>
                  <Input
                    id="supplierDocumentDate"
                    type="date"
                    value={formData.supplierDocumentDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierDocumentDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="supplierDocumentNumber">Номер документу постачальника</Label>
                  <Input
                    id="supplierDocumentNumber"
                    value={formData.supplierDocumentNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierDocumentNumber: e.target.value }))}
                    placeholder="Номер накладної, рахунку тощо"
                  />
                </div>
              </div>

              {/* Comment */}
              <div>
                <Label htmlFor="comment">Коментар</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Додаткова інформація про прихід"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Позиції приходу</Label>
                  <Button type="button" onClick={addItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Додати позицію
                  </Button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Компонент *</Label>
                        <Select
                          value={item.componentId}
                          onValueChange={(value) => updateItem(index, 'componentId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть компонент" />
                          </SelectTrigger>
                          <SelectContent>
                            {components.map((component: Component) => (
                              <SelectItem key={component.id} value={component.id.toString()}>
                                {component.name} ({component.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <div>
                          <Label className="text-xs text-gray-600">Назва у постачальника</Label>
                          <Input
                            placeholder="Введіть назву компонента у постачальника"
                            value={item.supplierComponentName || ''}
                            onChange={(e) => updateItem(index, 'supplierComponentName', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Кількість *</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          onBlur={calculateTotal}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label>Ціна за одиницю *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          onBlur={calculateTotal}
                          required
                        />
                      </div>
                      
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label>Загальна ціна</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.totalPrice}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total amount */}
              <div>
                <Label htmlFor="totalAmount">Загальна сума *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                  required
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={calculateTotal}
                  className="mt-2"
                >
                  Розрахувати автоматично
                </Button>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <div>
                  {editingReceipt && (
                    <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Видалити
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Підтвердження видалення</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ви впевнені, що хочете видалити цей прихід? Цю дію неможливо скасувати.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>
                            Видалити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Скасувати
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingReceipt ? 'Зберегти' : 'Створити'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Component Mapping Dialog */}
        <ComponentMappingDialog
          open={showMappingDialog}
          onOpenChange={setShowMappingDialog}
          components={components}
          onMapComponent={(mapping) => {
            toast({
              title: "Співставлення збережено",
              description: `"${mapping.supplierName}" співставлено з ${mapping.internalComponent.name}`
            });
          }}
          supplierComponentNames={receipts.flatMap((r: any) => 
            r.items?.map((i: any) => i.supplier_component_name).filter(Boolean) || []
          )}
        />

        {/* Supplier Receipts Import Dialog */}
        <SupplierReceiptsImport
          open={showReceiptsImportDialog}
          onOpenChange={setShowReceiptsImportDialog}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
          }}
        />

        {/* Supplier Receipt Items Import Dialog */}
        <SupplierReceiptItemsImport
          open={showReceiptItemsImportDialog}
          onOpenChange={setShowReceiptItemsImportDialog}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
          }}
        />

        {/* Original XML Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Імпорт приходів з XML</DialogTitle>
            </DialogHeader>
            <SupplierReceiptsXmlImport onClose={() => setShowImportDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}