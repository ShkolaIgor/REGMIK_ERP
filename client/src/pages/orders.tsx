import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResizableTable } from "@/components/ResizableTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatCurrency, getStatusColor, cn } from "@/lib/utils";
import { UkrainianDate } from "@/components/ui/ukrainian-date";
import { UkrainianDatePicker } from "@/components/ui/ukrainian-date-picker";
import { Plus, Eye, Edit, Trash2, ShoppingCart, Truck, Package, FileText, Check, ChevronsUpDown, GripVertical, ChevronUp, ChevronDown, Search, Filter, X, Settings, Palette, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { PartialShipmentDialog } from "@/components/PartialShipmentDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClientForm } from "@/components/ClientForm";
import { PaymentDialog } from "@/components/PaymentDialog";
import DueDateButton from "@/components/DueDateButton";
import { useSorting } from "@/hooks/useSorting";
import { InlineSerialNumbers } from "@/components/InlineSerialNumbers";
import { NovaPoshtaIntegration } from "@/components/NovaPoshtaIntegration";
import { OrdersXmlImport } from "@/components/OrdersXmlImport";
// Типи
type Order = {
  id: number;
  orderSequenceNumber: number;
  orderNumber: string;
  clientName?: string;
  clientTaxCode?: string;
  contactName?: string;

  clientId: number;
  clientContactsId: number | null;
  statusId: number | null;
  status: string;
  totalAmount: string;
  notes: string | null;
  paymentDate: Date | null;
  paymentType: string | null;
  paidAmount: string | null;
  contractNumber: string | null;
  productionApproved: boolean | null;
  productionApprovedBy: string | null;
  productionApprovedAt: Date | null;
  dueDate: Date | null;
  shippedDate: Date | null;
  createdAt: Date | null;
};

type OrderStatus = {
  id: number;
  name: string;
  textColor: string;
  backgroundColor: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: string;
  unitPrice: string;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  barcode: string | null;
  categoryId: number | null;
  costPrice: string;
  retailPrice: string;
  photo: string | null;
  productType: string;
  unit: string;
  minStock: number | null;
  maxStock: number | null;
  createdAt: Date | null;
};

type Company = {
  id: number;
  name: string;
  fullName: string | null;
  taxCode: string;
  isDefault: boolean | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
};

// Схеми валідації
const orderItemSchema = z.object({
  productId: z.number().min(1, "Оберіть товар"),
  quantity: z.string().min(1, "Введіть кількість"),
  unitPrice: z.string().min(1, "Введіть ціну"),
});

const orderSchema = z.object({
  clientId: z.string().min(1, "Оберіть клієнта"),
  clientContactsId: z.string().optional(),
  companyId: z.string().optional(),
  orderNumber: z.string().min(1, "Номер замовлення обов'язковий"),
  totalAmount: z.string().min(1, "Сума замовлення обов'язкова"),
  invoiceNumber: z.string().optional(),
  carrierId: z.number().optional().nullable(),
  status: z.string().default("pending"),
  statusId: z.number().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().optional(),
  paymentType: z.string().optional(),
  paidAmount: z.string().optional(),
  dueDate: z.string().optional(),
  shippedDate: z.string().optional(),
  trackingNumber: z.string().optional(),
  productionApproved: z.boolean().optional(),
  productionApprovedBy: z.string().optional(),
  productionApprovedAt: z.string().optional(),
});

const statusSchema = z.object({
  name: z.string().min(1, "Введіть назву статусу"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Введіть правильний HEX колір"),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Введіть правильний HEX колір"),
});

type OrderFormData = z.infer<typeof orderSchema>;
type OrderItemFormData = z.infer<typeof orderItemSchema>;
type StatusFormData = z.infer<typeof statusSchema>;

export default function Orders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");
  const [orderItems, setOrderItems] = useState<OrderItemFormData[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isPartialShipmentOpen, setIsPartialShipmentOpen] = useState(false);
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [isStatusSettingsOpen, setIsStatusSettingsOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [contactComboboxOpen, setContactComboboxOpen] = useState(false);
  const [contactSearchValue, setContactSearchValue] = useState("");
  const [companyComboboxOpen, setCompanyComboboxOpen] = useState(false);
  const [companySearchValue, setCompanySearchValue] = useState("");
  const [clientContactsForOrder, setClientContactsForOrder] = useState<any[]>([]);
  const [editingStatus, setEditingStatus] = useState<OrderStatus | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  
  // Пагінація
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showPaginationSettings, setShowPaginationSettings] = useState(false);
  
  // Стан для керування порядком стовпців
  const [columnOrder, setColumnOrder] = useState(() => {
    // Очищуємо старі налаштування щоб застосувати новий порядок стовпців
    localStorage.removeItem('orders-column-order');
    const saved = localStorage.getItem('orders-column-order');
    return saved ? JSON.parse(saved) : [
      'orderSequenceNumber',
      'orderNumber', 
      'clientName',
      'paymentDate',
      'dueDate',
      'totalAmount',
      'shippedDate',
      'status',
      'actions'
    ];
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Функція обробки перетягування стовпців
  const handleColumnDragEnd = (result: any) => {
    if (!result.destination) return;

    const newColumnOrder = Array.from(columnOrder);
    const [reorderedItem] = newColumnOrder.splice(result.source.index, 1);
    newColumnOrder.splice(result.destination.index, 0, reorderedItem);

    setColumnOrder(newColumnOrder);
    localStorage.setItem('orders-column-order', JSON.stringify(newColumnOrder));
  };

  // Мапа назв стовпців
  const columnLabels = {
    orderSequenceNumber: 'Замовлення',
    orderNumber: 'Рахунок',
    clientName: 'Клієнт',
    paymentDate: 'Дата оплати',
    dueDate: 'Термін виконання',
    totalAmount: 'Сума',
    shippedDate: 'Відвантаження',
    status: 'Статус',
    actions: 'Дії'
  };

  // Функція рендерингу контенту стовпця
  const renderColumnContent = (columnKey: string, order: any) => {
    
    switch (columnKey) {
      case 'orderSequenceNumber':
        const isOverdue = isOrderOverdue(order);
        return (
          <div className={`font-semibold text-center text-lg p-2 rounded ${getOrderNumberBgColor(order)}`}>
            {isOverdue && <div className="text-xs text-red-600 font-bold mb-1">ПРОСТРОЧЕНО</div>}
            {order.orderNumber || order.orderSequenceNumber}
          </div>
        );
      
      case 'orderNumber':
        return (
          <div>
            <div className="font-mono font-medium">{order.invoiceNumber || 'Не створено'}</div>
            <div className="text-sm text-gray-500"><UkrainianDate date={order.createdAt} format="short" /></div>
          </div>
        );
      
      case 'clientName':
        // Використовуємо дані клієнта та контакту, які вже завантажені з сервера
        const client = order.client || null;
        const contact = order.contact || null;
        
        return (
          <div className="space-y-1">
            {/* Назва клієнта */}
            <div className="font-medium text-sm">
              {client?.name || order.clientName || "Клієнт не вказаний"}
            </div>
            
            {/* ЄДРПОУ з таблиці clients */}
            {client?.taxCode && (
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
                {client.taxCode}
              </div>
            )}
            
            {/* Контактна особа з таблиці client_contacts */}
            {contact && (
              <div className="text-xs text-gray-600">
                👤 {contact.fullName}
              </div>
            )}
            
            {/* Якщо немає клієнта в таблиці, але є clientName */}
            {!client && order.clientName && (
              <div className="text-xs text-gray-500 italic">
                Клієнт відсутній
              </div>
            )}
          </div>
        );
      
      case 'paymentDate':
        const paymentType = order.paymentType || 'none';
        const paidAmount = parseFloat(order.paidAmount || '0');
        const totalAmount = parseFloat(order.totalAmount);
        
        const getPaymentDisplay = () => {
          // Якщо немає дати оплати, показуємо кнопку оплати незалежно від типу оплати
          if (!order.paymentDate) {
            return (
              <div onClick={(e) => e.stopPropagation()}>
                <PaymentDialog
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  totalAmount={order.totalAmount}
                  currentPaymentType={order.paymentType || "none"}
                  currentPaidAmount={order.paidAmount || "0"}
                  isProductionApproved={order.productionApproved || false}
                />
              </div>
            );
          }

          switch (paymentType) {
            case 'full':
              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <PaymentDialog
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    totalAmount={order.totalAmount}
                    currentPaymentType={order.paymentType || "none"}
                    currentPaidAmount={order.paidAmount || "0"}
                    isProductionApproved={order.productionApproved || false}
                    trigger={
                      <div className="space-y-1 cursor-pointer hover:opacity-80">
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          ✅ Повна оплата
                        </Badge>
                        <div className="text-xs text-green-700 font-medium flex items-center gap-1">
                          📅 <UkrainianDate date={order.paymentDate} format="short" />
                        </div>
                      </div>
                    }
                  />
                </div>
              );
            case 'partial':
              const percentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <PaymentDialog
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    totalAmount={order.totalAmount}
                    currentPaymentType={order.paymentType || "none"}
                    currentPaidAmount={order.paidAmount || "0"}
                    isProductionApproved={order.productionApproved || false}
                    trigger={
                      <div className="space-y-1 cursor-pointer hover:opacity-80">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          🔸 Часткова ({percentage}%)
                        </Badge>
                        <div className="text-xs text-gray-600">
                          {formatCurrency(paidAmount)} з {formatCurrency(totalAmount)}
                        </div>
                        <div className="text-xs text-yellow-700 font-medium flex items-center gap-1">
                          📅 <UkrainianDate date={order.paymentDate} format="short" />
                        </div>
                      </div>
                    }
                  />
                </div>
              );
            case 'contract':
              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <PaymentDialog
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    totalAmount={order.totalAmount}
                    currentPaymentType={order.paymentType || "none"}
                    currentPaidAmount={order.paidAmount || "0"}
                    isProductionApproved={order.productionApproved || false}
                    trigger={
                      <div className="space-y-1 cursor-pointer hover:opacity-80">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          📋 По договору
                        </Badge>
                        {order.contractNumber && (
                          <div className="text-xs text-blue-700 font-medium">
                            📝 №{order.contractNumber}
                          </div>
                        )}
                      </div>
                    }
                  />
                </div>
              );
            case 'none':
            default:
              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <PaymentDialog
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    totalAmount={order.totalAmount}
                    currentPaymentType={order.paymentType || "none"}
                    currentPaidAmount={order.paidAmount || "0"}
                    isProductionApproved={order.productionApproved || false}
                  />
                </div>
              );
          }
        };

        return (
          <div className="flex flex-col items-start">
            {getPaymentDisplay()}
            {order.productionApproved && (
              <div className="text-xs text-green-600 mt-1 flex items-center">
                ✅ Виробництво дозволено
              </div>
            )}
          </div>
        );
      
      case 'dueDate':
        const isOverdueForDueDate = isOrderOverdue(order);
        return (
          <div onClick={(e) => e.stopPropagation()}>
            {isOverdueForDueDate && (
              <div className="text-xs text-red-600 font-bold mb-1 bg-red-100 px-2 py-1 rounded">
                ⚠️ ПРОСТРОЧЕНО
              </div>
            )}
            <DueDateButton 
              order={order}
              onDueDateChange={(orderId, dueDate) => {
                updateDueDateMutation.mutate({ id: orderId, dueDate });
              }}
              isLoading={updateDueDateMutation.isPending}
            />
          </div>
        );
      
      case 'totalAmount':
        return <div className="font-medium">{formatCurrency(parseFloat(order.totalAmount))}</div>;
      
      case 'shippedDate':
        const carrier = order.carrierId 
          ? Array.isArray(allCarriers) && allCarriers.find((c: any) => c.id === order.carrierId)
          : null;
        
        return (
          <div className="space-y-1">
            {order.shippedDate && (
              <div className="text-sm font-medium">
                <UkrainianDate date={order.shippedDate} format="short" />
              </div>
            )}
            {carrier && (
              <div className="text-xs text-gray-600">
                🚚 {carrier.name}
              </div>
            )}
            {order.trackingNumber && (
              <div className="text-xs text-blue-600 font-mono">
                📦 {order.trackingNumber}
              </div>
            )}
            {!order.shippedDate && (
              <div className="text-xs text-gray-400">
                Не відвантажено
              </div>
            )}
          </div>
        );

      case 'status':
        const statusInfo = orderStatuses.find(s => s.id === order.statusId);
        const currentStatusName = statusInfo?.name || order.status || 'Невідомо';
        
        const handleStatusChange = (newStatusId: string) => {
          const statusId = parseInt(newStatusId);
          console.log("Status change handler called with:", { orderId: order.id, currentStatusId: order.statusId, newStatusId: statusId });
          updateStatusMutation.mutate({ id: order.id, statusId });
        };
        
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={order.statusId?.toString() || ''}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[140px] h-7 border-0 p-1">
                <Badge 
                  className="text-sm font-medium border-0 w-full justify-center"
                  style={{
                    color: statusInfo?.textColor || '#000000',
                    backgroundColor: statusInfo?.backgroundColor || '#f3f4f6'
                  }}
                >
                  {currentStatusName}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {orderStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: status.backgroundColor }}
                      />
                      {status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'actions':
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditOrder(order)}
              title="Редагувати замовлення"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePartialShipment(order)}
              title="Частково відвантажити"
            >
              <Package className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShipOrder(order)}
              title="Повністю відвантажити"
            >
              <Truck className="w-4 h-4" />
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Стан для серверної пагінації
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    limit: itemsPerPage
  });

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["/api/orders", serverPagination.page, serverPagination.limit, searchTerm, statusFilter, paymentFilter, dateRangeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: serverPagination.page.toString(),
        limit: serverPagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentFilter !== 'all' && { payment: paymentFilter }),
        ...(dateRangeFilter !== 'all' && { dateRange: dateRangeFilter })
      });
      
      const response = await fetch(`/api/orders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  const allOrders = ordersResponse?.orders || [];
  const totalServerRecords = ordersResponse?.total || 0;
  const totalServerPages = ordersResponse?.totalPages || 0;



  const { data: orderStatuses = [] } = useQuery<OrderStatus[]>({
    queryKey: ["/api/order-statuses"],
  });

  const { data: allClients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients/search"],
  });

  const { data: allClientContacts = [] } = useQuery<any[]>({
    queryKey: ["/api/client-contacts"],
  });

  const { data: carriers = [] } = useQuery<any[]>({
    queryKey: ["/api/carriers"],
  });

  // Оновлення серверної пагінації при зміні фільтрів
  React.useEffect(() => {
    setServerPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, statusFilter, paymentFilter, dateRangeFilter]);

  // Оновлення серверної пагінації при зміні itemsPerPage
  React.useEffect(() => {
    setServerPagination(prev => ({ 
      ...prev, 
      limit: itemsPerPage,
      page: 1 
    }));
  }, [itemsPerPage]);

  // Для локального сортування (сервер вже відправляє відсортовані дані)
  const { sortedData: filteredOrders, sortConfig, handleSort } = useSorting({
    data: allOrders || [],
    tableName: 'orders',
    defaultSort: { field: 'orderSequenceNumber', direction: 'desc' }
  });

  // Оскільки сервер обробляє пагінацію, використовуємо всі отримані замовлення
  const orders = filteredOrders;

  // Функції серверної пагінації
  const goToFirstPage = () => setServerPagination(prev => ({ ...prev, page: 1 }));
  const goToLastPage = () => setServerPagination(prev => ({ ...prev, page: totalServerPages }));
  const goToPreviousPage = () => setServerPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  const goToNextPage = () => setServerPagination(prev => ({ ...prev, page: Math.min(totalServerPages, prev.page + 1) }));
  const goToPage = (page: number) => setServerPagination(prev => ({ ...prev, page: Math.max(1, Math.min(totalServerPages, page)) }));
  const itemsPerPageOptions = [10, 25, 50, 100, 200];



  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });



  // Запит для пошуку клієнтів з debounce
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(clientSearchValue);
    }, 300); // 300мс затримка

    return () => clearTimeout(timer);
  }, [clientSearchValue]);

  const { data: clientSearchData, isLoading: isSearchingClients } = useQuery({
    queryKey: ["/api/clients/search", debouncedSearchValue],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchValue) {
        params.append('q', debouncedSearchValue);
      }
      params.append('limit', '50');
      
      const response = await fetch(`/api/clients/search?${params}`);
      if (!response.ok) throw new Error('Failed to search clients');
      return response.json();
    },
    enabled: true,
  });

  // Запит для завантаження контактів вибраного клієнта
  const { data: clientContactsData } = useQuery({
    queryKey: ["/api/client-contacts", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return { clientContacts: [] };
      
      const response = await fetch(`/api/client-contacts?clientId=${selectedClientId}`);
      if (!response.ok) throw new Error('Failed to fetch client contacts');
      return response.json();
    },
    enabled: !!selectedClientId,
  });

  // Форма для замовлення
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientId: "",
      customerEmail: "",
      customerPhone: "",
      status: "pending",
      notes: "",
    },
  });

  // Оновлюємо список контактів при зміні даних
  useEffect(() => {
    if (clientContactsData?.clientContacts) {
      setClientContactsForOrder(clientContactsData.clientContacts);
    } else {
      setClientContactsForOrder([]);
    }
  }, [clientContactsData]);

  // Відстежуємо зміни клієнта для оновлення контактів
  useEffect(() => {
    const clientId = form.watch("clientId");
    if (clientId) {
      setSelectedClientId(clientId);
      // Скидаємо обрану контактну особу при зміні клієнта
      form.setValue("clientContactsId", undefined);
    } else {
      setSelectedClientId("");
      setClientContactsForOrder([]);
      form.setValue("clientContactsId", undefined);
    }
  }, [form.watch("clientId")]);
  
  const clientsList = clientSearchData?.clients || [];

  const { data: orderStatusList = [] } = useQuery({
    queryKey: ["/api/order-statuses"],
  });

  const { data: clientContacts = [] } = useQuery({
    queryKey: ["/api/client-contacts"],
  });

  const { data: allCarriers = [] } = useQuery({
    queryKey: ["/api/carriers"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  }) as { data: Company[] };

  // Ініціалізуємо поле компанії з компанією за замовчуванням
  useEffect(() => {
    if (companies.length > 0 && !form.watch("companyId") && !isEditMode && isDialogOpen) {
      const defaultCompany = companies.find((c: Company) => c.isDefault);
      if (defaultCompany) {
        form.setValue("companyId", defaultCompany.id.toString());
        setCompanySearchValue(defaultCompany.name);
        setCompanyComboboxOpen(false); // Закриваємо список компаній
      }
    }
  }, [companies, form, isEditMode, isDialogOpen]);

  // Форма для управління статусами
  const statusForm = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      name: "",
      textColor: "#000000",
      backgroundColor: "#ffffff",
    },
  });

  // Мутація для створення замовлення
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      handleCloseDialog();
      toast({
        title: "Успіх",
        description: "Замовлення створено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити замовлення",
        variant: "destructive",
      });
    },
  });

  // Мутація для оновлення статусу
  const updateStatusMutation = useMutation({
    mutationFn: (params: { id: number; status: string }) => {
      console.log("Frontend: Updating order status - params:", params);
      console.log("Frontend: Updating order status - id:", params.id, "status:", params.status);
      const requestData = { status: params.status };
      console.log("Frontend: Request data being sent:", requestData);
      return apiRequest(`/api/orders/${params.id}/status`, { method: "PUT", body: requestData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Статус оновлено",
      });
    },
    onError: (error: any) => {
      console.error("Frontend: Error updating status:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити статус",
        variant: "destructive",
      });
    },
  });

  // Мутація для видалення замовлення
  const deleteOrderMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/orders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      handleCloseDialog(); // Закриваємо форму після видалення
      toast({
        title: "Успіх",
        description: "Замовлення видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити замовлення",
        variant: "destructive",
      });
    },
  });

  // Мутація для оновлення замовлення
  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending PUT request to:", `/api/orders/${data.id}`);
      console.log("Request data:", data);
      return await apiRequest(`/api/orders/${data.id}`, { method: "PUT", body: data });
    },
    onSuccess: (result) => {
      console.log("Order update success:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingOrder(null);
      setOrderItems([]);
      form.reset();
      toast({
        title: "Успіх",
        description: "Замовлення оновлено",
      });
    },
    onError: (error: any) => {
      console.error("Order update error:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити замовлення",
        variant: "destructive",
      });
    },
  });

  // Мутація для оновлення дати оплати
  const updatePaymentDateMutation = useMutation({
    mutationFn: async ({ id, paymentDate }: { id: number; paymentDate: string | null }) => {
      return await apiRequest(`/api/orders/${id}/payment-date`, { 
        method: "PATCH", 
        body: { paymentDate } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Дату оплати оновлено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити дату оплати",
        variant: "destructive",
      });
    },
  });

  // Мутація для оновлення терміну виконання
  const updateDueDateMutation = useMutation({
    mutationFn: async ({ id, dueDate }: { id: number; dueDate: string | null }) => {
      return await apiRequest(`/api/orders/${id}/due-date`, { 
        method: "PATCH", 
        body: { dueDate } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Термін виконання оновлено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити термін виконання",
        variant: "destructive",
      });
    },
  });

  // Мутація для відвантаження замовлення
  const shipOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const now = new Date().toISOString();
      return await apiRequest(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: { shippedDate: now }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Замовлення відвантажено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося відвантажити замовлення",
        variant: "destructive",
      });
    },
  });

  // Мутація для створення рахунку з замовлення
  const createInvoiceMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return await apiRequest(`/api/orders/${orderId}/create-invoice`, { method: "POST" });
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Рахунок створено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити рахунок",
        variant: "destructive",
      });
    },
  });

  // Мутація для створення нового клієнта
  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      return await apiRequest("/api/clients", {
        method: "POST",
        body: clientData
      });
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      // Автоматично вибираємо новоствореного клієнта
      form.setValue("clientId", newClient.id.toString());
      setIsCreateClientDialogOpen(false);
      setNewClientName("");
      setClientSearchValue("");
      toast({
        title: "Успіх",
        description: "Клієнта створено та обрано",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити клієнта",
        variant: "destructive",
      });
    },
  });

  // Мутації для управління статусами
  const createStatusMutation = useMutation({
    mutationFn: async (data: StatusFormData) => {
      return await apiRequest("/api/order-statuses", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-statuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsStatusDialogOpen(false);
      setEditingStatus(null);
      statusForm.reset();
      toast({
        title: "Успіх",
        description: "Статус створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити статус",
        variant: "destructive",
      });
    },
  });

  const updateStatusSettingsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: StatusFormData }) => {
      return await apiRequest(`/api/order-statuses/${id}`, { method: "PUT", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-statuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setEditingStatus(null);
      statusForm.reset();
      toast({
        title: "Успіх",
        description: "Статус оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити статус",
        variant: "destructive",
      });
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/order-statuses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-statuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Статус видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити статус",
        variant: "destructive",
      });
    },
  });

  // Функція для відвантаження замовлення
  const handleShipOrder = (order: any) => {
    if (confirm(`Підтвердити відвантаження замовлення ${order.orderNumber}?`)) {
      shipOrderMutation.mutate(order.id);
    }
  };

  // Функція для створення рахунку
  const handleCreateInvoice = (order: any) => {
    if (confirm(`Створити рахунок для замовлення ${order.orderNumber}?`)) {
      createInvoiceMutation.mutate(order.id);
    }
  };

  // Функції для управління статусами
  const handleCreateStatus = () => {
    setEditingStatus(null);
    statusForm.reset({
      name: "",
      textColor: "#000000",
      backgroundColor: "#ffffff",
    });
    setIsStatusDialogOpen(true);
  };

  const handleEditStatus = (status: OrderStatus) => {
    setEditingStatus(status);
    statusForm.reset({
      name: status.name,
      textColor: status.textColor,
      backgroundColor: status.backgroundColor,
    });
    setIsStatusDialogOpen(true);
  };

  const handleDeleteStatus = (id: number) => {
    if (confirm("Видалити цей статус?")) {
      deleteStatusMutation.mutate(id);
    }
  };

  const handleStatusSubmit = (data: StatusFormData) => {
    if (editingStatus) {
      updateStatusSettingsMutation.mutate({ id: editingStatus.id, data });
    } else {
      createStatusMutation.mutate(data);
    }
  };

  // Функція для закриття діалогу та очищення форми
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingOrder(null);
    setOrderItems([]);
    form.reset();
  };

  // Функція для закриття діалогу редагування
  const handleCloseEditDialog = () => {
    setIsEditMode(false);
    setEditingOrder(null);
    setOrderItems([]);
    form.reset();
  };

  // Функція для початку редагування замовлення
  const handleEditOrder = async (order: any) => {
    console.log('Starting to edit order:', order);
    
    // Отримуємо повні дані замовлення з сервера
    const fullOrder = await fetch(`/api/orders/${order.id}`)
      .then(res => res.json())
      .catch(err => {
        console.error('Failed to fetch full order:', err);
        return order; // fallback to original order data
      });
    
    console.log('Full order data received:', fullOrder);
    
    setEditingOrder(fullOrder);
    setIsEditMode(true);
    
    // Функція для конвертації дати в формат datetime-local
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    };
    
    // Заповнюємо форму даними замовлення
    form.reset({
      clientId: fullOrder.clientId ? fullOrder.clientId.toString() : "",
      clientContactsId: fullOrder.clientContactsId ? fullOrder.clientContactsId.toString() : "",
      companyId: fullOrder.companyId ? fullOrder.companyId.toString() : "",
      orderNumber: fullOrder.orderNumber || "",
      totalAmount: fullOrder.totalAmount || "",
      status: fullOrder.status,
      notes: fullOrder.notes || "",
      paymentDate: formatDateForInput(fullOrder.paymentDate),
      paymentType: fullOrder.paymentType || "full",
      paidAmount: fullOrder.paidAmount || "0",
      dueDate: formatDateForInput(fullOrder.dueDate),
      shippedDate: formatDateForInput(fullOrder.shippedDate),
      trackingNumber: fullOrder.trackingNumber || "",
      invoiceNumber: fullOrder.invoiceNumber || "",
      carrierId: fullOrder.carrierId || null,
      statusId: fullOrder.statusId || undefined,
      productionApproved: fullOrder.productionApproved || false,
      productionApprovedBy: fullOrder.productionApprovedBy || "",
      productionApprovedAt: formatDateForInput(fullOrder.productionApprovedAt),
    });

    // Встановлюємо вибраного клієнта для оновлення контактів
    if (fullOrder.clientId) {
      setSelectedClientId(fullOrder.clientId.toString());
      
      // Встановлюємо назву клієнта для відображення в полі пошуку
      if (fullOrder.clientName) {
        console.log(`Setting client name from fullOrder: ${fullOrder.clientName}`);
        // Додаємо затримку для синхронізації станів
        setTimeout(() => {
          setClientSearchValue(fullOrder.clientName);
        }, 50);
      } else {
        console.log('No clientName in fullOrder, searching in allClients');
        // Якщо немає clientName в замовленні, пробуємо знайти в списку клієнтів
        const client = Array.isArray(allClients) ? allClients.find((c: any) => c.id === fullOrder.clientId) : null;
        if (client) {
          console.log(`Found client in allClients: ${client.name}`);
          setTimeout(() => {
            setClientSearchValue(client.name);
          }, 50);
        } else {
          console.log('Client not found in allClients, will try with delay');
          setTimeout(() => {
            const delayedClient = Array.isArray(allClients) ? allClients.find((c: any) => c.id === fullOrder.clientId) : null;
            if (delayedClient) {
              setClientSearchValue(delayedClient.name);
            }
          }, 500);
        }
      }
    }

    // Встановлюємо компанію
    if (fullOrder.companyId) {
      setSelectedCompanyId(fullOrder.companyId.toString());
    }

    // Встановлюємо контактну особу після оновлення клієнта
    setTimeout(() => {
      if (fullOrder.clientContactsId) {
        setSelectedContactId(fullOrder.clientContactsId.toString());
        form.setValue("clientContactsId", fullOrder.clientContactsId.toString());
      }
    }, 100);

    // Заповнюємо товари замовлення
    if (fullOrder.items) {
      console.log("Order items:", fullOrder.items);
      setOrderItems(fullOrder.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
      })));
    } else {
      console.log("No items in order");
      setOrderItems([]);
    }
    
    setIsDialogOpen(true);
    
    // Встановлюємо фокус на поле клієнта тільки для нових замовлень
    if (!order) {
      setTimeout(() => {
        const clientInput = document.querySelector('input[placeholder*="Почніть вводити назву клієнта"]') as HTMLInputElement;
        if (clientInput) {
          clientInput.focus();
        }
      }, 300);
    }
  };

  // Функції для управління товарами в замовленні
  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: 0, quantity: "", unitPrice: "" }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof OrderItemFormData, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Якщо обирається товар, автоматично встановлюємо його ціну
    if (field === "productId" && value > 0 && products) {
      const selectedProduct = products.find((p: any) => p.id === value);
      if (selectedProduct) {
        updated[index].unitPrice = selectedProduct.retailPrice;
      }
    }
    
    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  };

  // Допоміжні функції для таблиці
  // Функція для перевірки чи замовлення прострочене
  const isOrderOverdue = (order: any) => {
    if (!order.dueDate || order.shippedDate) return false;
    
    const dueDate = new Date(order.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return today > dueDate;
  };

  const getOrderNumberBgColor = (order: any) => {
    // Якщо замовлення прострочене
    if (isOrderOverdue(order)) return "bg-red-100 border-red-300 border-2 text-red-800";
    // Якщо оплачено
    if (order.paymentDate) return "bg-green-50 border-green-200";
    // Якщо близько до дедлайну (менше 3 днів)
    if (order.dueDate && new Date(order.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) return "bg-yellow-50 border-yellow-200";
    return "bg-gray-50";
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "Нове",
      processing: "В обробці", 
      completed: "Завершено",
      cancelled: "Скасовано"
    };
    return statusMap[status] || status;
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handlePartialShipment = (order: Order) => {
    setSelectedOrderForShipment(order);
    setIsPartialShipmentOpen(true);
  };

  // Функції для роботи з клієнтами - серверний пошук замість клієнтського фільтрування
  const filteredClients = clientsList; // Дані вже відфільтровані на сервері

  const handleClientSelect = (clientId: string) => {
    console.log("handleClientSelect called with ID:", clientId);
    
    // Шукаємо клієнта у відфільтрованому списку
    const selectedClient = filteredClients.find((c: any) => c.id.toString() === clientId);
    console.log("Found client in filteredClients:", selectedClient);
    
    if (selectedClient) {
      console.log("Setting client:", selectedClient.name);
      form.setValue("clientId", clientId);
      setSelectedClientId(clientId);
      setClientSearchValue(selectedClient.name);
      setClientComboboxOpen(false);
      
      // Очищаємо контакт при зміні клієнта
      form.setValue("clientContactsId", "");
      setSelectedContactId("");
      
      console.log("Client selection completed");
    } else {
      console.log("Client not found!");
    }
  };

  const handleClientSearchChange = (value: string) => {
    setClientSearchValue(value);
    if (value.length > 0) {
      setClientComboboxOpen(true);
    } else {
      setClientComboboxOpen(false);
    }
  };

  const handleCreateNewClient = (formData: any) => {
    createClientMutation.mutate(formData);
  };

  const handleSubmit = (data: OrderFormData) => {
    console.log("=== FORM SUBMIT STARTED ===");
    console.log("Handle submit called with data:", data);
    console.log("Order items:", orderItems);
    console.log("Is edit mode:", isEditMode);
    
    // Перевіряємо, чи додані товари
    if (orderItems.length === 0) {
      toast({
        title: "Помилка",
        description: "Додайте хоча б один товар до замовлення",
        variant: "destructive",
      });
      return;
    }

    // Перевіряємо валідність товарів
    const invalidItems = orderItems.filter(item => 
      !item.productId || !item.quantity || !item.unitPrice
    );
    
    if (invalidItems.length > 0) {
      toast({
        title: "Помилка",
        description: "Заповніть всі поля для кожного товару",
        variant: "destructive",
      });
      return;
    }

    // Функція для конвертації дати з datetime-local у ISO формат
    const parseDateForServer = (dateString: string) => {
      if (!dateString) return null;
      return new Date(dateString).toISOString();
    };

    // Генеруємо номер замовлення якщо це новий рахунок
    const orderNumber = isEditMode && editingOrder 
      ? editingOrder.orderNumber 
      : `ORD-${Date.now()}`;

    // Знаходимо statusId для статусу
    const statusObj = orderStatuses?.find(status => status.name === data.status);
    const statusId = statusObj?.id || 1; // Fallback на перший статус

    // Розраховуємо загальну суму
    const totalAmount = orderItems.reduce((sum, item) => 
      sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice)), 0
    ).toString();

    const orderData = {
      order: {
        orderNumber,
        statusId,
        totalAmount,
        ...(data.clientId && { clientId: parseInt(data.clientId) }),
        ...(data.clientContactsId && { clientContactsId: data.clientContactsId }),
        ...(data.companyId && { companyId: parseInt(data.companyId) }),


        ...(data.invoiceNumber && { invoiceNumber: data.invoiceNumber }),
        ...(data.carrierId && { carrierId: data.carrierId }),
        status: data.status,
        ...(data.notes && { notes: data.notes }),
        ...(data.paymentDate && { paymentDate: parseDateForServer(data.paymentDate) }),
        ...(data.dueDate && { dueDate: parseDateForServer(data.dueDate) }),
        ...(data.shippedDate && { shippedDate: parseDateForServer(data.shippedDate) }),
      },
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice).toString(),
        totalPrice: (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toString(),
      })),
    };
    
    if (isEditMode && editingOrder) {
      // Редагування існуючого замовлення
      console.log("Updating order with data:", {
        id: editingOrder.id,
        ...orderData,
      });
      updateOrderMutation.mutate({
        id: editingOrder.id,
        ...orderData,
      });
    } else {
      // Створення нового замовлення
      createOrderMutation.mutate(orderData);
    }
  };





  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="w-full overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Замовлення / Рахунки</h2>
            <p className="text-gray-600">Управління замовленнями та рахунками</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsStatusSettingsOpen(!isStatusSettingsOpen)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Налаштування статусів
              </Button>
              <OrdersXmlImport />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                  setIsEditMode(false);
                  setEditingOrder(null);
                  setSelectedClientId("");
                  setClientSearchValue("");
                  setClientComboboxOpen(false);
                  setSelectedContactId("");
                  setSelectedCompanyId("");
                  setOrderItems([]);
                  
                  // Встановлюємо компанію за замовчуванням (is_default = TRUE)
                  const defaultCompany = companies && companies.length > 0 
                    ? companies.find((c: Company) => c.isDefault === true) || companies[0] 
                    : null;
                  if (defaultCompany) {
                    setSelectedCompanyId(defaultCompany.id.toString());
                  }
                  
                  form.reset({
                    companyId: defaultCompany ? defaultCompany.id.toString() : "",
                    clientId: "",
                    clientContactsId: "",
                    status: "pending",
                    notes: "",
                    paymentDate: "",
                    dueDate: "",
                    shippedDate: "",
                    trackingNumber: "",
                    invoiceNumber: "",
                    carrierId: null,
                    statusId: undefined,
                    totalAmount: "",
                    orderNumber: "",
                    paymentType: "full",
                    paidAmount: "0",
                    productionApproved: false,
                    productionApprovedBy: "",
                    productionApprovedAt: "",
                  });
                  
                  // Скидаємо стан компонентів
                  setSelectedClientId("");
                  setClientSearchValue("");
                  setClientComboboxOpen(false);
                  setIsDialogOpen(true);
                }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Новий рахунок/замовлення
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="order-dialog-description">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? `Редагувати рахунок ${editingOrder?.orderNumber}` : "Створити новий рахунок/замовлення"}
                </DialogTitle>
                <DialogDescription id="order-dialog-description">
                  {isEditMode ? "Внесіть зміни до існуючого замовлення та його товарів" : "Створіть новий рахунок для клієнта з товарами та датами"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Поле компанії */}
                <div>
                  <Label htmlFor="companyId">Компанія *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Почніть вводити назву компанії..."
                      value={form.watch("companyId") ? 
                        companies.find((c: Company) => c.id.toString() === form.watch("companyId"))?.name || companySearchValue 
                        : companySearchValue}
                      onChange={(e) => {
                        // Якщо є обрана компанія і користувач редагує, скидаємо вибір
                        if (form.watch("companyId")) {
                          form.setValue("companyId", "");
                        }
                        setCompanySearchValue(e.target.value);
                        // Відкриваємо список тільки якщо є текст для пошуку (мінімум 2 символи)
                        if (e.target.value.trim().length >= 2) {
                          setCompanyComboboxOpen(true);
                        } else {
                          setCompanyComboboxOpen(false);
                        }
                      }}
                      onFocus={() => {
                        // При фокусі, якщо є обрана компанія, очищаємо поле для редагування
                        if (form.watch("companyId")) {
                          const selectedCompany = companies.find((c: Company) => c.id.toString() === form.watch("companyId"));
                          setCompanySearchValue(selectedCompany?.name || "");
                          form.setValue("companyId", "");
                        }
                        // НЕ відкриваємо список автоматично при фокусі
                      }}
                      onBlur={() => setTimeout(() => setCompanyComboboxOpen(false), 200)}
                      className={form.formState.errors.companyId ? "border-red-500" : ""}
                    />
                    
                    {companyComboboxOpen && companySearchValue.trim().length >= 2 && companies && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {companies
                          .filter((company: Company) => 
                            company.name.toLowerCase().includes(companySearchValue.toLowerCase()) ||
                            (company.fullName && company.fullName.toLowerCase().includes(companySearchValue.toLowerCase()))
                          )
                          .map((company: Company) => (
                            <div
                              key={company.id}
                              className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setSelectedCompanyId(company.id.toString());
                                form.setValue("companyId", company.id.toString());
                                setCompanySearchValue(company.name);
                                setCompanyComboboxOpen(false);
                              }}
                            >
                              <div className="font-medium">{company.name}</div>
                              {company.fullName && company.fullName !== company.name && (
                                <div className="text-sm text-gray-500">{company.fullName}</div>
                              )}
                              {company.isDefault && (
                                <div className="text-xs text-blue-600">За замовчуванням</div>
                              )}
                            </div>
                          ))
                        }
                        {companies.filter((company: Company) => 
                          company.name.toLowerCase().includes(companySearchValue.toLowerCase()) ||
                          (company.fullName && company.fullName.toLowerCase().includes(companySearchValue.toLowerCase()))
                        ).length === 0 && (
                          <div className="px-3 py-2 text-gray-500">Компанію не знайдено</div>
                        )}
                      </div>
                    )}
                  </div>
                  {form.formState.errors.companyId && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.companyId.message}
                    </p>
                  )}
                </div>

                {/* Інформація про клієнта */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientId">Клієнт *</Label>
                    <div className="relative">
                      <Input
                        placeholder="Почніть вводити назву клієнта..."
                        value={clientSearchValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log('Client field onChange:', value);
                          setClientSearchValue(value);
                          
                          // Очищаємо обраний ID при зміні тексту пошуку
                          if (form.watch("clientId")) {
                            form.setValue("clientId", "");
                            setSelectedClientId("");
                          }
                          
                          // Відкриваємо список при введенні
                          if (value.trim().length >= 1) {
                            setClientComboboxOpen(true);
                          } else {
                            setClientComboboxOpen(false);
                          }
                        }}
                        onFocus={() => {
                          console.log('Client field focused, current value:', clientSearchValue);
                          // При фокусі на поле, відкриваємо список для пошуку
                          setClientComboboxOpen(true);
                        }}
                        onBlur={() => setTimeout(() => setClientComboboxOpen(false), 200)}
                        className={cn(
                          form.formState.errors.clientId ? "border-red-500" : ""
                        )}
                      />
                      {clientSearchValue && clientComboboxOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredClients.length > 0 ? (
                            <div className="py-1">
                              {filteredClients.map((client: any) => (
                                <div
                                  key={client.id}
                                  onClick={() => {
                                    console.log("Clicking client:", client.name, "ID:", client.id);
                                    handleClientSelect(client.id.toString());
                                  }}
                                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      form.watch("clientId") === client.id.toString()
                                        ? "opacity-100 text-blue-600"
                                        : "opacity-0"
                                    }`}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{client.name}</div>
                                    <div className="text-sm text-gray-500">{client.taxCode}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : clientSearchValue.length > 2 ? (
                            <div className="p-3">
                              <p className="text-sm text-gray-600 mb-3">
                                Клієнт "{clientSearchValue}" не знайдений
                              </p>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setNewClientName(clientSearchValue);
                                  setIsCreateClientDialogOpen(true);
                                  setClientComboboxOpen(false);
                                }}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Створити нового клієнта
                              </Button>
                            </div>
                          ) : (
                            <div className="p-3 text-sm text-gray-500">
                              Введіть мінімум 3 символи для пошуку
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {form.formState.errors.clientId && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.clientId.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="clientContactsId">Контактна особа</Label>
                    <div className="relative">
                      <Input
                        placeholder={!form.watch("clientId") ? "Спочатку оберіть клієнта" : "Почніть вводити ім'я контакта..."}
                        value={form.watch("clientContactsId") ? 
                          clientContactsForOrder?.find((c: any) => c.id.toString() === form.watch("clientContactsId"))?.fullName || contactSearchValue 
                          : contactSearchValue}
                        disabled={!form.watch("clientId")}
                        onChange={(e) => {
                          // Якщо є обраний контакт і користувач редагує, скидаємо вибір
                          if (form.watch("clientContactsId")) {
                            form.setValue("clientContactsId", "");
                          }
                          setContactSearchValue(e.target.value);
                          // Список залишається відкритим при введенні тексту
                          if (form.watch("clientId") && clientContactsForOrder && clientContactsForOrder.length > 0) {
                            setContactComboboxOpen(true);
                          }
                        }}
                        onFocus={() => {
                          // При фокусі відразу відкриваємо список контактів, якщо є клієнт
                          if (form.watch("clientId") && clientContactsForOrder && clientContactsForOrder.length > 0) {
                            setContactComboboxOpen(true);
                          }
                          
                          // Якщо є обраний контакт, підготовуємо його для редагування
                          if (form.watch("clientContactsId") && !contactSearchValue) {
                            const selectedContact = clientContactsForOrder?.find((c: any) => c.id.toString() === form.watch("clientContactsId"));
                            if (selectedContact) {
                              setContactSearchValue(selectedContact.fullName);
                            }
                          }
                        }}
                        onBlur={() => setTimeout(() => setContactComboboxOpen(false), 200)}
                        className={cn(
                          form.formState.errors.clientContactsId ? "border-red-500" : "",
                          // Червоний фон якщо контакт видалений (є clientContactsId але контакт не знайдений)
                          isEditMode && form.watch("clientContactsId") && !clientContactsForOrder?.find((c: any) => c.id.toString() === form.watch("clientContactsId")) ? "bg-red-50 border-red-300" : ""
                        )}
                      />
                      
                      {contactComboboxOpen && clientContactsForOrder && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {clientContactsForOrder
                            .filter((contact: any) => 
                              !contactSearchValue || contact.fullName.toLowerCase().includes(contactSearchValue.toLowerCase())
                            )
                            .map((contact: any) => (
                              <div
                                key={contact.id}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  form.setValue("clientContactsId", contact.id.toString());
                                  setContactSearchValue(contact.fullName);
                                  setContactComboboxOpen(false);
                                  
                                  // Автозаповнення email та телефону з контактної особи
                                  if (contact.email) {
                                    form.setValue("customerEmail", contact.email);
                                  }
                                  if (contact.phone) {
                                    form.setValue("customerPhone", contact.phone);
                                  }
                                }}
                              >
                                <div className="font-medium">{contact.fullName}</div>
                                {contact.email && (
                                  <div className="text-sm text-gray-500">{contact.email}</div>
                                )}
                              </div>
                            ))}
                          {clientContactsForOrder.filter((contact: any) => 
                            !contactSearchValue || contact.fullName.toLowerCase().includes(contactSearchValue.toLowerCase())
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500">
                              {contactSearchValue ? "Контактів не знайдено" : "Немає доступних контактів"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      {...form.register("customerEmail")}
                      className={form.formState.errors.customerEmail ? "border-red-500" : ""}
                    />
                    {form.formState.errors.customerEmail && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.customerEmail.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Телефон</Label>
                    <Input
                      id="customerPhone"
                      {...form.register("customerPhone")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceNumber">Рахунок</Label>
                    <Input
                      id="invoiceNumber"
                      {...form.register("invoiceNumber")}
                      placeholder="Номер рахунку"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carrierId">Перевізник</Label>
                    <Select
                      value={form.watch("carrierId") ? form.watch("carrierId").toString() : "none"}
                      onValueChange={(value) => form.setValue("carrierId", value === "none" ? null : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть перевізника" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без перевізника</SelectItem>
                        {carriers?.map((carrier: any) => (
                          <SelectItem key={carrier.id} value={carrier.id.toString()}>
                            {carrier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Nova Poshta Integration */}
                {form.watch("carrierId") && carriers?.find((c: any) => c.id === parseInt(form.watch("carrierId")))?.name === "Нова Пошта" && (
                  <div className="mt-6">
                    <NovaPoshtaIntegration
                      onAddressSelect={(address, cityRef, warehouseRef) => {
                        // Можна зберегти адресу в додаткових полях
                        console.log("Обрано адресу Nova Poshta:", address, cityRef, warehouseRef);
                      }}
                      onTrackingNumberCreated={(trackingNumber) => {
                        form.setValue("trackingNumber", trackingNumber);
                      }}
                      orderId={isEditMode ? editingOrder?.id?.toString() : undefined}
                      recipientName={clientSearchValue}
                      recipientPhone={""}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Статус</Label>
                    {!isEditMode ? (
                      <Input
                        value="Нове"
                        disabled
                        className="bg-gray-50"
                      />
                    ) : (
                      <Select
                        value={form.watch("status")}
                        onValueChange={(value) => form.setValue("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Нове</SelectItem>
                          <SelectItem value="processing">В обробці</SelectItem>
                          <SelectItem value="completed">Завершено</SelectItem>
                          <SelectItem value="cancelled">Скасовано</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Дати для рахунку */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="paymentDate">Дата оплати</Label>
                    <UkrainianDatePicker
                      date={form.watch("paymentDate") && form.watch("paymentDate") !== "" ? new Date(form.watch("paymentDate")!) : undefined}
                      onDateChange={(date) => form.setValue("paymentDate", date ? date.toISOString() : "")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Термін виконання</Label>
                    <UkrainianDatePicker
                      date={form.watch("dueDate") && form.watch("dueDate") !== "" ? new Date(form.watch("dueDate")!) : undefined}
                      onDateChange={(date) => form.setValue("dueDate", date ? date.toISOString() : "")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippedDate">Дата відвантаження</Label>
                    <UkrainianDatePicker
                      date={form.watch("shippedDate") && form.watch("shippedDate") !== "" ? new Date(form.watch("shippedDate")!) : undefined}
                      onDateChange={(date) => form.setValue("shippedDate", date ? date.toISOString() : "")}
                    />
                  </div>
                </div>

                {/* Трек номер (тільки для редагування) */}
                {isEditMode && (
                  <div>
                    <Label htmlFor="trackingNumber">Номер відстеження (трек)</Label>
                    <Input
                      id="trackingNumber"
                      {...form.register("trackingNumber")}
                      placeholder="Введіть номер відстеження"
                    />
                  </div>
                )}

                {/* Примітки */}
                <div>
                  <Label htmlFor="notes">Примітки до рахунку</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Додаткова інформація про замовлення/рахунок"
                    rows={3}
                  />
                </div>

                {/* Товари в замовленні */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Товари в замовленні</Label>
                    <Button type="button" onClick={addOrderItem} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Додати товар
                    </Button>
                  </div>

                  {orderItems.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Додайте товари до замовлення</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="flex-1">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {item.productId > 0 && products
                                    ? products.find((product: any) => product.id === item.productId)?.name || "Оберіть товар..."
                                    : "Оберіть товар..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Пошук товару..." />
                                  <CommandEmpty>Товар не знайдено</CommandEmpty>
                                  <CommandGroup>
                                    {products?.map((product: any) => (
                                      <CommandItem
                                        key={product.id}
                                        value={`${product.name} ${product.sku}`}
                                        onSelect={() => {
                                          updateOrderItem(index, "productId", product.id);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            item.productId === product.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div>
                                          <div className="font-medium">{product.name}</div>
                                          <div className="text-sm text-gray-500">
                                            {product.sku} • {formatCurrency(product.retailPrice)}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <Input
                            placeholder="Кількість"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, "quantity", e.target.value)}
                            className="w-24"
                          />
                          
                          <Input
                            placeholder="Ціна"
                            value={item.unitPrice}
                            onChange={(e) => {
                              console.log("Price change:", e.target.value);
                              updateOrderItem(index, "unitPrice", e.target.value);
                            }}
                            className="w-24"
                          />
                          
                          <div className="w-24 text-sm">
                            {(parseFloat(item.quantity) * parseFloat(item.unitPrice) || 0).toFixed(2)} ₴
                          </div>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOrderItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <div className="text-right text-lg font-semibold">
                        Загальна сума: {calculateTotal().toFixed(2)} ₴
                      </div>
                    </div>
                  )}
                </div>



                <div className="flex justify-between pt-4">
                  {/* Кнопка видалення (тільки в режимі редагування) */}
                  {isEditMode && editingOrder && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => {
                        if (window.confirm(`Ви впевнені, що хочете видалити замовлення ${editingOrder.orderNumber}? Цю дію неможливо скасувати.`)) {
                          deleteOrderMutation.mutate(editingOrder.id);
                        }
                      }}
                      disabled={deleteOrderMutation.isPending}
                    >
                      {deleteOrderMutation.isPending ? "Видалення..." : "Видалити замовлення"}
                    </Button>
                  )}
                  
                  {/* Кнопки скасування та збереження */}
                  <div className="flex space-x-2 ml-auto">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Скасувати
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isEditMode ? updateOrderMutation.isPending : createOrderMutation.isPending}
                    >
                      {isEditMode 
                        ? (updateOrderMutation.isPending ? "Оновлення..." : "Оновити замовлення")
                        : (createOrderMutation.isPending ? "Створення..." : "Створити рахунок")
                      }
                    </Button>
                  </div>
                </div>
              </form>
              </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Status Settings Panel */}
      {isStatusSettingsOpen && (
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Управління статусами замовлень</h3>
              <Button
                variant="outline"
                onClick={() => setIsStatusSettingsOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Закрити
              </Button>
            </div>

            {/* Create New Status Form */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Створити новий статус</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={statusForm.handleSubmit(handleStatusSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="statusName">Назва статусу</Label>
                    <Input
                      id="statusName"
                      {...statusForm.register("name")}
                      placeholder="Назва статусу"
                    />
                  </div>
                  <div>
                    <Label htmlFor="textColor">Колір тексту</Label>
                    <Input
                      id="textColor"
                      type="color"
                      {...statusForm.register("textColor")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="backgroundColor">Колір фону</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      {...statusForm.register("backgroundColor")}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      type="submit" 
                      disabled={createStatusMutation.isPending}
                      className="w-full"
                    >
                      {createStatusMutation.isPending ? "Створення..." : "Створити"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Existing Statuses */}
            <Card>
              <CardHeader>
                <CardTitle>Існуючі статуси</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orderStatuses?.map((status: OrderStatus) => (
                    <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            color: status.textColor,
                            backgroundColor: status.backgroundColor
                          }}
                        >
                          {status.name}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStatus(status)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteStatusMutation.mutate(status.id)}
                          disabled={deleteStatusMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Edit Status Dialog */}
            <Dialog open={!!editingStatus} onOpenChange={() => setEditingStatus(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Редагувати статус</DialogTitle>
                </DialogHeader>
                {editingStatus && (
                  <form onSubmit={statusForm.handleSubmit((data) => {
                    updateStatusSettingsMutation.mutate({
                      id: editingStatus.id,
                      data
                    });
                  })}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editStatusName">Назва статусу</Label>
                        <Input
                          id="editStatusName"
                          {...statusForm.register("name")}
                          defaultValue={editingStatus.name}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editTextColor">Колір тексту</Label>
                        <Input
                          id="editTextColor"
                          type="color"
                          {...statusForm.register("textColor")}
                          defaultValue={editingStatus.textColor}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editBackgroundColor">Колір фону</Label>
                        <Input
                          id="editBackgroundColor"
                          type="color"
                          {...statusForm.register("backgroundColor")}
                          defaultValue={editingStatus.backgroundColor}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setEditingStatus(null)}
                        >
                          Скасувати
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={updateStatusSettingsMutation.isPending}
                        >
                          {updateStatusSettingsMutation.isPending ? "Оновлення..." : "Оновити"}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      <main className="p-3 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{totalServerRecords}</p>
                <p className="text-sm text-gray-600">Всього замовлень</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-blue-600">
                  {orders.filter((o: any) => o.status === 'processing').length}
                </p>
                <p className="text-sm text-gray-600">В обробці</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">
                  {orders.filter((o: any) => o.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">Завершено</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0))}
                </p>
                <p className="text-sm text-gray-600">Загальна сума</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Пошук за номером замовлення, клієнтом, email або телефоном..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  {orderStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Payment Filter */}
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Оплата" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі</SelectItem>
                  <SelectItem value="paid">Оплачено</SelectItem>
                  <SelectItem value="unpaid">Не оплачено</SelectItem>
                  <SelectItem value="overdue">Прострочено</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Період" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Весь час</SelectItem>
                  <SelectItem value="today">Сьогодні</SelectItem>
                  <SelectItem value="week">Тиждень</SelectItem>
                  <SelectItem value="month">Місяць</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchTerm || statusFilter !== "all" || paymentFilter !== "all" || dateRangeFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPaymentFilter("all");
                    setDateRangeFilter("all");
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Очистити
                </Button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-3 text-sm text-gray-600">
              Знайдено: {totalServerRecords} замовлень (сторінка {serverPagination.page} з {totalServerPages})
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список замовлень</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Замовлення відсутні</p>
                <Button className="mt-4" onClick={() => {
                  setIsEditMode(false);
                  setEditingOrder(null);
                  setOrderItems([]);
                  form.reset();
                  setIsDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Створити перше замовлення
                </Button>
              </div>
            ) : (
              <>
              <DragDropContext onDragEnd={handleColumnDragEnd}>
                <Table>
                  <TableHeader>
                    <Droppable droppableId="table-headers" direction="horizontal">
                      {(provided) => (
                        <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                          {columnOrder.map((columnKey, index) => (
                            <Draggable key={columnKey} draggableId={columnKey} index={index}>
                              {(provided, snapshot) => (
                                <TableHead
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`relative ${snapshot.isDragging ? 'bg-blue-100 shadow-lg' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                      <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                    </div>
                                    {columnKey !== 'actions' ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSort(columnKey);
                                        }}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                      >
                                        <span>{columnLabels[columnKey as keyof typeof columnLabels]}</span>
                                        {sortConfig.field === columnKey && (
                                          sortConfig.direction === 'asc' ? 
                                            <ChevronUp className="w-4 h-4" /> : 
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                      </button>
                                    ) : (
                                      <span>{columnLabels[columnKey as keyof typeof columnLabels]}</span>
                                    )}
                                  </div>
                                </TableHead>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </TableRow>
                      )}
                    </Droppable>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => [
                      <TableRow 
                        key={order.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleOrderExpansion(order.id)}
                      >
                        {columnOrder.map((columnKey: any) => (
                          <TableCell key={columnKey}>
                            {renderColumnContent(columnKey, order)}
                          </TableCell>
                        ))}
                      </TableRow>,
                      
                      expandedOrderId === order.id && (
                        <TableRow key={`expanded-${order.id}`}>
                          <TableCell colSpan={columnOrder.length} className="bg-gray-50 p-0">
                            <div className="p-4">
                              <h4 className="font-medium mb-3">Склад замовлення:</h4>
                              {order.items && order.items.length > 0 ? (
                                <div className="space-y-4">
                                  {order.items.map((item: any, index: number) => (
                                    <div key={index} className="bg-white rounded border p-4 space-y-4">
                                      <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                          <span className="font-medium">{item.product?.name || 'Товар не знайдено'}</span>
                                          <span className="text-sm text-gray-500 ml-2">({item.product?.sku})</span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <span className="text-sm text-gray-600">
                                            Кількість: <span className="font-medium">{item.quantity}</span>
                                          </span>
                                          <span className="text-sm text-gray-600">
                                            Ціна: <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
                                          </span>
                                          <span className="text-sm font-medium">
                                            Всього: {formatCurrency(item.totalPrice)}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Компонент для прив'язки серійних номерів */}
                                      {item.product?.hasSerialNumbers && (
                                        <InlineSerialNumbers 
                                          orderItemId={item.id}
                                          productId={item.productId}
                                          productName={item.product?.name || 'Невідомий товар'}
                                          quantity={parseInt(item.quantity)}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">Замовлення не містить товарів</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    ]).flat()}
                  </TableBody>
                </Table>
              </DragDropContext>

              {orders.length > 0 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-muted-foreground">
                      Показано {((serverPagination.page - 1) * serverPagination.limit) + 1}-{Math.min(serverPagination.page * serverPagination.limit, totalServerRecords)} з {totalServerRecords} замовлень
                    </p>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPaginationSettings(!showPaginationSettings)}
                      className="h-8"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Налаштування
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {showPaginationSettings && (
                      <div className="flex items-center space-x-2 mr-4">
                        <Label className="text-sm">Рядків на сторінці:</Label>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => setItemsPerPage(Number(value))}
                        >
                          <SelectTrigger className="h-8 w-[80px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent side="top">
                            {itemsPerPageOptions.map((pageSize) => (
                              <SelectItem key={pageSize} value={pageSize.toString()}>
                                {pageSize}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToFirstPage}
                        disabled={serverPagination.page === 1}
                        className="h-8 w-8 p-0"
                        title="Перша сторінка"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={serverPagination.page === 1}
                        className="h-8 w-8 p-0"
                        title="Попередня сторінка"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center space-x-2 mx-2">
                        <Input
                          className="w-16 h-8 text-center"
                          type="number"
                          min={1}
                          max={totalServerPages}
                          value={serverPagination.page}
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (!isNaN(page)) {
                              goToPage(page);
                            }
                          }}
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          з {totalServerPages}
                        </span>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={serverPagination.page >= totalServerPages}
                        className="h-8 w-8 p-0"
                        title="Наступна сторінка"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToLastPage}
                        disabled={serverPagination.page >= totalServerPages}
                        className="h-8 w-8 p-0"
                        title="Остання сторінка"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Діалог часткового відвантаження */}
      {selectedOrderForShipment && (
        <PartialShipmentDialog
          open={isPartialShipmentOpen}
          onOpenChange={setIsPartialShipmentOpen}
          orderId={selectedOrderForShipment.id}
          orderNumber={selectedOrderForShipment.orderNumber}
        />
      )}

      {/* Діалог для створення нового клієнта */}
      <Dialog open={isCreateClientDialogOpen} onOpenChange={setIsCreateClientDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Створити нового клієнта</DialogTitle>
            <DialogDescription>
              Додайте повну інформацію про нового клієнта
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            prefillName={newClientName}
            onSubmit={handleCreateNewClient}
            onCancel={() => {
              setIsCreateClientDialogOpen(false);
              setNewClientName("");
            }}
            isLoading={createClientMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
