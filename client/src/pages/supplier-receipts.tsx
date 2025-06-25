import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";

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
      purchase_order_id: "",
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

  // Handlers
  const onSubmit = (data: SupplierReceiptFormData) => {
    const formattedData = {
      ...data,
      supplier_id: parseInt(data.supplier_id),
      document_type_id: parseInt(data.document_type_id),
      purchase_order_id: data.purchase_order_id ? parseInt(data.purchase_order_id) : null,
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
      purchase_order_id: receipt.purchase_order_id?.toString() || '',
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
      <div className="border-t bg-gray-50 p-4">
        <h4 className="font-medium mb-3">Позиції документу:</h4>
        <div className="space-y-2">
          {receiptItems.map((item: any) => {
            const component = components.find((c: any) => c.id === item.component_id);
            return (
              <div key={item.id} className="bg-white p-3 rounded border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {component?.name || 'Невідомий компонент'} ({component?.sku || 'N/A'})
                    </div>
                    {item.supplier_component_name && (
                      <div className="text-xs text-gray-600 mt-1">
                        Назва постачальника: {item.supplier_component_name}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm">
                      Кількість: <span className="font-medium">{item.quantity}</span>
                    </div>
                    <div className="text-sm">
                      Ціна: <span className="font-medium">{parseFloat(item.unit_price).toFixed(2)} грн</span>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      Всього: {parseFloat(item.total_price).toFixed(2)} грн
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t">
          <div className="text-right font-medium">
            Загальна сума позицій: {receiptItems.reduce((sum: number, item: any) => sum + parseFloat(item.total_price || '0'), 0).toFixed(2)} грн
          </div>
        </div>
      </div>
    );
  };

  // DataTable columns
  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'receipt_date', label: 'Дата приходу', sortable: true },
    { key: 'supplier_name', label: 'Постачальник', sortable: true },
    { key: 'document_type_name', label: 'Тип документу', sortable: true },
    { key: 'supplier_document_number', label: 'Номер документу', sortable: true },
    { key: 'total_amount', label: 'Сума', sortable: true },
    { key: 'purchase_order_number', label: 'Замовлення', sortable: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Приходи від постачальників</h1>
          <p className="text-gray-600">Управління документами постачальників</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Новий прихід
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingReceipt ? 'Редагувати прихід' : 'Створити новий прихід'}
              </DialogTitle>
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
                            <SelectItem value="">Без замовлення</SelectItem>
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
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? 'Збереження...' : 'Зберегти'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* DataTable */}
      <DataTable
        data={receiptsArray}
        columns={columns}
        searchable={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleExpand={toggleExpand}
        expandedItems={expandedItems}
        renderExpandedContent={(item: any) => <ReceiptItemsView receiptId={item.id} />}
        loading={isLoading}
      />
    </div>
  );
}