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
import { Plus, Search, Edit2, Trash2, Upload, FileText, Calendar, Package } from "lucide-react";
import { SupplierReceiptsXmlImport } from "@/components/SupplierReceiptsXmlImport";
import { ComponentMappingDialog } from "@/components/ComponentMappingDialog";

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
  receiptId: number;
  componentId: number;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
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
  const [pageSize, setPageSize] = useState(20);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);

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

  const handleEdit = (receipt: SupplierReceipt) => {
    setEditingReceipt(receipt);
    setFormData({
      receiptDate: receipt.receipt_date.split('T')[0],
      supplierId: receipt.supplier_id.toString(),
      documentTypeId: receipt.document_type_id.toString(),
      supplierDocumentDate: receipt.supplier_document_date?.split('T')[0] || '',
      supplierDocumentNumber: receipt.supplier_document_number || '',
      totalAmount: receipt.total_amount,
      comment: receipt.comment || '',
      purchaseOrderId: receipt.purchase_order_id?.toString() || '',
      items: receipt.items || []
    });
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
        { componentId: '', quantity: '', unitPrice: '', totalPrice: '' }
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

  // Filter receipts
  const filteredReceipts = receipts.filter((receipt: SupplierReceipt) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const supplier = suppliers.find((s: Supplier) => s.id === receipt.supplier_id);
    
    return (
      supplier?.name.toLowerCase().includes(searchLower) ||
      receipt.supplier_document_number?.toLowerCase().includes(searchLower) ||
      receipt.comment?.toLowerCase().includes(searchLower)
    );
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
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowMappingDialog(true)} variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Співставлення компонентів
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

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Пошук за постачальником, номером документа..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-900">Дата отримання</th>
                  <th className="text-left p-4 font-medium text-gray-900">Постачальник</th>
                  <th className="text-left p-4 font-medium text-gray-900">Тип документу</th>
                  <th className="text-left p-4 font-medium text-gray-900">№ документу</th>
                  <th className="text-left p-4 font-medium text-gray-900">Сума</th>
                  <th className="text-left p-4 font-medium text-gray-900">Дії</th>
                </tr>
              </thead>
              <tbody>
                {currentReceipts.map((receipt: SupplierReceipt) => {
                  const supplier = suppliers.find((s: Supplier) => s.id === receipt.supplier_id);
                  const documentType = documentTypes.find((dt: SupplierDocumentType) => dt.id === receipt.document_type_id);
                  
                  return (
                    <tr key={receipt.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(receipt.receipt_date).toLocaleDateString('uk-UA')}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{supplier?.name || '—'}</td>
                      <td className="p-4">{documentType?.name || '—'}</td>
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
                          onClick={() => handleEdit(receipt)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Показано {startIndex + 1}-{Math.min(endIndex, total)} з {total} результатів
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Попередня
              </Button>
              <span className="text-sm">{currentPage} з {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Наступна
              </Button>
            </div>
          </div>
        )}

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
                      <div>
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
                      setEditingReceipt(null);
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

        {/* Import Dialog */}
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