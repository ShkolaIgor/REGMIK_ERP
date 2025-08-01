import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { DataTable } from "@/components/DataTable/DataTable";
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
import { Plus, Eye, Edit, Trash2, ShoppingCart, Truck, Package, FileText, Check, ChevronsUpDown, ChevronUp, ChevronDown, Search, Filter, X, HandPlatter, DollarSign, Clock, TrendingUp, Printer, Building2, Settings, MessageSquare, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { OrderItemsXmlImport } from "@/components/OrderItemsXmlImport";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";
import { DepartmentPrintModal } from "@/components/DepartmentPrintModal";

import ComponentDeductions from "@/components/ComponentDeductions";
import { ContactPersonAutocomplete } from "@/components/ContactPersonAutocomplete";
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
  printedAt: Date | null;
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
  productId: z.number().optional().default(0),
  itemName: z.string().optional().default(""),
  quantity: z.string().min(1, "Введіть кількість"),
  unitPrice: z.string().min(1, "Введіть ціну"),
  comment: z.string().optional().default(""), // Поле коментар для позиції
}).refine((data) => {
  // Товар валідний якщо є або productId, або itemName
  return data.productId > 0 || (data.itemName && data.itemName.trim().length > 0);
}, {
  message: "Оберіть товар зі списку або введіть назву товару",
  path: ["itemName"],
});

const orderSchema = z.object({
  clientId: z.string().min(1, "Оберіть клієнта"),
  clientContactsId: z.string().optional(),
  companyId: z.string().optional(),
  orderNumber: z.string().optional(), // Автоматично генерується
  totalAmount: z.string().optional(), // Автоматично розраховується
  invoiceNumber: z.string().optional(),
  carrierId: z.string().optional(), // Змінено з number на string для сумісності з React Hook Form
  status: z.string().default("pending"),
  statusId: z.string().optional(), // Змінено з number на string для сумісності
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
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  // Nova Poshta поля
  recipientCityRef: z.string().optional(),
  recipientCityName: z.string().optional(),
  recipientWarehouseRef: z.string().optional(),
  recipientWarehouseAddress: z.string().optional(),
  recipientWarehouseNumber: z.string().optional(),
  shippingCost: z.string().optional(),
  estimatedDelivery: z.string().optional(),
});

const statusSchema = z.object({
  name: z.string().min(1, "Введіть назву статусу"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Введіть правильний HEX колір"),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Введіть правильний HEX колір"),
});

type OrderFormData = z.infer<typeof orderSchema>;
type OrderItemFormData = z.infer<typeof orderItemSchema>;
type StatusFormData = z.infer<typeof statusSchema>;

// Простий компонент пошуку (скопійовано з робочої сторінки клієнтів)
function SearchInput({ value, onChange }: { 
  value: string; 
  onChange: (value: string) => void; 
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder="Пошук за номером замовлення, клієнтом, email або телефоном..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        autoComplete="off"
      />
    </div>
  );
}

export default function Orders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState(""); // Пошук відновлено
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");
  const [orderItems, setOrderItems] = useState<OrderItemFormData[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [clientDeliveryData, setClientDeliveryData] = useState<any>(null);
  const [loadingDeliveryData, setLoadingDeliveryData] = useState(false);
  const [isPartialShipmentOpen, setIsPartialShipmentOpen] = useState(false);
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [isStatusSettingsOpen, setIsStatusSettingsOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<number | undefined>(undefined);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [printOrderId, setPrintOrderId] = useState<number>(0);
  const [isDepartmentPrintOpen, setIsDepartmentPrintOpen] = useState(false);
  const [departmentPrintOrderId, setDepartmentPrintOrderId] = useState<number>(0);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companyComboboxOpen, setCompanyComboboxOpen] = useState(false);
  const [companySearchValue, setCompanySearchValue] = useState("");
  const [clientContactsForOrder, setClientContactsForOrder] = useState<any[]>([]);
  const [editingStatus, setEditingStatus] = useState<OrderStatus | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [novaPoshtaKey, setNovaPoshtaKey] = useState(0); // Для перерендерингу Nova Poshta компонента
  
  // Стан для збереження даних доставки в картку клієнта
  const [originalDeliveryData, setOriginalDeliveryData] = useState({
    carrierId: "",
    recipientCityRef: "",
    recipientCityName: "",
    recipientAreaName: "",
    recipientWarehouseRef: "",
    recipientWarehouseAddress: ""
  });
  const [showSaveDeliveryButton, setShowSaveDeliveryButton] = useState(false);
  const [isDataAutoFilled, setIsDataAutoFilled] = useState(false); // Флаг для відстеження автозаповнення
  
  // Пагінація
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Обробник зміни пошуку
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Обробники фільтрів
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handlePaymentFilterChange = (value: string) => {
    setPaymentFilter(value);
  };

  const handleDateRangeFilterChange = (value: string) => {
    setDateRangeFilter(value);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateRangeFilter("all");
  };



  // Функція рендерингу контенту стовпця
  const renderColumnContent = (columnKey: string, order: any) => {
    
    switch (columnKey) {
      case 'orderSequenceNumber':
        const isOverdue = isOrderOverdue(order);
        // Перевіряємо чи оновлювався запис протягом останніх 2 хвилин
        const isRecentlyUpdated = order.updatedAt && 
          (new Date().getTime() - new Date(order.updatedAt).getTime()) < 2 * 60 * 1000;
        
        // Перевіряємо чи був новий платіж протягом останніх 2 хвилин
        // Перевіряємо за updatedAt замість paymentDate для зелених крапок
        const hasRecentPayment = order.updatedAt && 
          (new Date().getTime() - new Date(order.updatedAt).getTime()) < 2 * 60 * 1000;
        
        const showGreenDot = isRecentlyUpdated || hasRecentPayment;
        
        // Check for overdue orders (logging removed for production)
        if (isOverdue) {
          // Order is overdue - visual indicators will show this
        }
        
        return (
          <div className={`font-semibold text-center text-lg p-2 rounded ${getOrderNumberBgColor(order)}`}>
            {isOverdue && <div className="text-xs text-red-600 font-bold mb-1">⚠️ ПРОСТРОЧЕНО</div>}
            <div className="flex items-center justify-center gap-2">
              {showGreenDot && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" 
                     title={hasRecentPayment ? "Новий платіж" : "Щойно оновлено"}></div>
              )}
              <span>{order.orderNumber || order.orderSequenceNumber}</span>
            </div>
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
          // Якщо немає оплати (paidAmount = 0) І немає дати платежу, показуємо кнопку оплати
          if (paidAmount === 0 && !order.paymentDate) {
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
          
          // Якщо є дата платежу, але paidAmount = 0, показуємо як оплачене з дати orders.payment_date
          if (paidAmount === 0 && order.paymentDate) {
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
                        💳 Оплачено
                      </Badge>
                      <div className="text-xs text-blue-700 font-medium flex items-center gap-1">
                        📅 <UkrainianDate date={order.paymentDate} format="short" />
                      </div>
                    </div>
                  }
                />
              </div>
            );
          }

          // Визначаємо актуальний статус оплати на основі paidAmount та totalAmount
          const actualPaymentStatus = (() => {
            if (paidAmount === 0) return 'none';
            if (paidAmount >= totalAmount) return 'full';
            if (paymentType === 'contract') return 'contract'; // Зберігаємо тип "по договору"
            return 'partial';
          })();

          switch (actualPaymentStatus) {
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
                          📅 <UkrainianDate date={order.paymentDate || order.lastPaymentDate} format="short" />
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
                        <div className="text-xs text-red-600 font-medium">
                          Борг: {formatCurrency(totalAmount - paidAmount)}
                        </div>
                        <div className="text-xs text-yellow-700 font-medium flex items-center gap-1">
                          📅 <UkrainianDate date={order.paymentDate || order.lastPaymentDate} format="short" />
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
                    trigger={
                      <div className="space-y-1 cursor-pointer hover:opacity-80">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300">
                          💰 Не оплачено
                        </Badge>
                      </div>
                    }
                  />
                </div>
              );
          }
        };

        return (
          <div className="flex flex-col items-start">
            {getPaymentDisplay()}
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
          ? Array.isArray(carriers) && carriers.find((c: any) => c.id === order.carrierId)
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
                🚚 {carrier.name || 'Назва не завантажена'}
              </div>
            )}
            {!carrier && order.carrierId && (
              <div className="text-xs text-orange-500">
                Перевізник ID: {order.carrierId} (не знайдено)
              </div>
            )}
            {order.trackingNumber && (
              <div className="text-xs text-blue-600 font-mono">
                📦 {order.trackingNumber}
              </div>
            )}
            {!order.shippedDate && !carrier && !order.carrierId && (
              <div className="text-xs text-gray-400">
                Не відвантажено
              </div>
            )}
            {!order.shippedDate && carrier && (
              <div className="text-xs text-gray-500">
                Готово до відвантаження
              </div>
            )}
          </div>
        );

      case 'status':
        try {
          // Debugging видалено після виправлення проблеми завантаження статусів
          
          if (!orderStatuses || orderStatuses.length === 0) {
            return (
              <div className="text-red-500 text-sm">
                Статуси не завантажені
              </div>
            );
          }
          
          const statusInfo = orderStatuses.find(s => s.id === order.statusId);
          const currentStatusName = statusInfo?.name || order.status || 'Невідомо';
          
          // Статуси тепер завантажуються та відображаються правильно
          
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={order.statusId?.toString() || ''}
                onValueChange={(newStatusId) => handleStatusChange(order.id, newStatusId)}
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

              {order.productionApproved && (
                <div className="text-xs text-green-600 mt-1 flex items-center">
                  ✅ Виробництво дозволено
                </div>
              )}
            </div>
          );
        } catch (error) {
          return (
            <div className="text-red-500 text-sm">
              Помилка відображення статусу
            </div>
          );
        }
      
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
              <FileText className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShipOrder(order)}
              title="Повністю відвантажити"
            >
              <Truck className="w-4 h-4" />
            </Button>
            {/*<Button
              variant={order.printedAt ? "default" : "outline"}
              size="sm"
              onClick={() => handlePrintOrder(order)}
              title={order.printedAt ? `Друкувати замовлення (останній друк: ${new Date(order.printedAt).toLocaleString('uk-UA')})` : "Друкувати замовлення"}
              className={order.printedAt ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            >
              <Printer className="w-4 h-4" />
            </Button>*/}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDepartmentPrint(order)}
              title="Виробничий та пакувальний лист по відділах"
              className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
            >
              <Building2 className="w-4 h-4" />
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

  // Стабільний queryKey з мемоізацією
  const ordersQueryKey = useMemo(() => [
    "/api/orders", 
    serverPagination.page, 
    serverPagination.limit, 
    searchTerm, 
    statusFilter, 
    paymentFilter, 
    dateRangeFilter
  ], [serverPagination.page, serverPagination.limit, searchTerm, statusFilter, paymentFilter, dateRangeFilter]);

  // Стабільна queryFn з useCallback
  const fetchOrders = useCallback(async () => {
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
  }, [serverPagination.page, serverPagination.limit, searchTerm, statusFilter, paymentFilter, dateRangeFilter]);

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: fetchOrders,
    refetchInterval: 30000, // Автоматичне оновлення кожні 30 секунд для синхронізації з банківськими платежами
    refetchIntervalInBackground: true, // Оновлюється навіть коли вкладка неактивна
  });

  const allOrders = ordersResponse?.orders || [];
  const totalServerRecords = ordersResponse?.total || 0;
  const totalServerPages = ordersResponse?.totalPages || 0;

  // Завантажуємо статуси для відображення в таблиці замовлень
  const { data: orderStatuses = [], isLoading: isLoadingStatuses } = useQuery<OrderStatus[]>({
    queryKey: ["/api/order-statuses"],
    queryFn: async () => {
      const response = await fetch('/api/order-statuses');
      if (!response.ok) throw new Error('Failed to fetch order statuses');
      const data = await response.json();
      return data;
    },
    // Статуси потрібні для відображення колонки статусу в таблиці замовлень
  });

  const { data: carriers = [], isLoading: carriersLoading } = useQuery<any[]>({
    queryKey: ["/api/carriers"],
    // Завантажуємо всіх перевізників для відображення в таблиці замовлень (включаючи неактивних для історичних записів)
  });

  const { data: activeCarriers = [], isLoading: activeCarriersLoading } = useQuery<any[]>({
    queryKey: ["/api/carriers/active"],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    // Завантажуємо тільки активних перевізників для селекторів у формах
  });

  const { data: defaultCarrier } = useQuery<any>({
    queryKey: ["/api/carriers/default"],
    // Завантажуємо перевізника за замовчуванням для автозаповнення форми
  });



  // Стабільне оновлення серверної пагінації при зміні фільтрів
  useEffect(() => {
    setServerPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, statusFilter, paymentFilter, dateRangeFilter]);

  // Стабільне оновлення серверної пагінації при зміні itemsPerPage
  useEffect(() => {
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
  const orders = filteredOrders || [];

  // Функції серверної пагінації
  const goToFirstPage = () => setServerPagination(prev => ({ ...prev, page: 1 }));
  const goToLastPage = () => setServerPagination(prev => ({ ...prev, page: totalServerPages }));
  const goToPreviousPage = () => setServerPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  const goToNextPage = () => setServerPagination(prev => ({ ...prev, page: Math.min(totalServerPages, prev.page + 1) }));
  const goToPage = (page: number) => setServerPagination(prev => ({ ...prev, page: Math.max(1, Math.min(totalServerPages, page)) }));
  const itemsPerPageOptions = [10, 25, 50, 100, 200];



  // ОПТИМІЗАЦІЯ: Динамічний пошук товарів з debounce
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [debouncedProductSearchTerm, setDebouncedProductSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearchTerm(productSearchTerm);
    }, 300); // 300мс затримка для оптимізації пошуку

    return () => clearTimeout(timer);
  }, [productSearchTerm]);

  // Завантажуємо товари тільки при наявності пошукового запиту
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/search", debouncedProductSearchTerm],
    queryFn: async () => {
      if (!debouncedProductSearchTerm) return [];
      
      const params = new URLSearchParams();
      params.append('q', debouncedProductSearchTerm);
      params.append('limit', '50'); // Обмежуємо до 50 результатів
      
      const response = await fetch(`/api/products/search?${params}`);
      if (!response.ok) throw new Error('Failed to search products');
      return response.json();
    },
    enabled: debouncedProductSearchTerm.length >= 2, // Пошук тільки якщо введено мінімум 2 символи
  });



  // Запит для пошуку клієнтів з debounce
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");

  // Завантаження даних доставки клієнта для показування стану кнопки
  const loadClientDeliveryData = async (clientId: string) => {
    if (!clientId) {
      setClientDeliveryData(null);
      return;
    }

    setLoadingDeliveryData(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/delivery-settings`);
      if (response.ok) {
        const deliverySettings = await response.json();

        setClientDeliveryData(deliverySettings);
      } else {
        setClientDeliveryData(null);
      }
    } catch (error) {
      console.error("Помилка завантаження даних доставки:", error);
      setClientDeliveryData(null);
    } finally {
      setLoadingDeliveryData(false);
    }
  };

  // Ручне автозаповнення даних доставки
  const handleManualDeliveryFill = () => {
    if (!clientDeliveryData?.client) return;

    let filledCount = 0;
    const client = clientDeliveryData.client;

    // Автозаповнення перевізника
    if (clientDeliveryData.carrier) {
      form.setValue("carrierId", clientDeliveryData.carrier.id.toString());
      filledCount++;
    } else if (client.carrierId) {
      form.setValue("carrierId", client.carrierId.toString());
      filledCount++;
    }

    // Автозаповнення міста Nova Poshta
    if (clientDeliveryData.city) {
      form.setValue("recipientCityRef", clientDeliveryData.city.ref);
      form.setValue("recipientCityName", clientDeliveryData.city.name || clientDeliveryData.city.description || "");
      filledCount++;
    } else if (client.cityRef) {
      form.setValue("recipientCityRef", client.cityRef);
      form.setValue("recipientCityName", "Місто (з профілю клієнта)");
      filledCount++;
    }

    // Автозаповнення відділення Nova Poshta
    if (clientDeliveryData.warehouse) {
      form.setValue("recipientWarehouseRef", clientDeliveryData.warehouse.ref);
      form.setValue("recipientWarehouseAddress", clientDeliveryData.warehouse.description || clientDeliveryData.warehouse.address || "");
      filledCount++;
    } else if (client.warehouseRef) {
      form.setValue("recipientWarehouseRef", client.warehouseRef);
      filledCount++;
    }



    // Оновлюємо базові дані після автозаповнення щоб кнопка не показувалась
    setOriginalDeliveryData({
      carrierId: form.getValues("carrierId") || "",
      recipientCityRef: form.getValues("recipientCityRef") || "",
      recipientCityName: form.getValues("recipientCityName") || "",
      recipientAreaName: "",
      recipientWarehouseRef: form.getValues("recipientWarehouseRef") || "",
      recipientWarehouseAddress: form.getValues("recipientWarehouseAddress") || ""
    });

    // Встановлюємо флаг автозаповнення та приховуємо кнопку
    setIsDataAutoFilled(true);
    setShowSaveDeliveryButton(false);

    // Форсуємо перерендеринг компонента Nova Poshta після заповнення
    setTimeout(() => {
      setNovaPoshtaKey(prev => prev + 1);
      form.trigger(["recipientCityRef", "recipientWarehouseRef"]);
    }, 100);

    if (filledCount > 0) {
      toast({
        title: "Дані доставки заповнені",
        description: `Заповнено ${filledCount} поле(ів) з профілю клієнта`,
      });
    } else {
      toast({
        title: "Немає даних для заповнення",
        description: "У клієнта не налаштовані дані доставки",
        variant: "destructive",
      });
    }
  };



  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(clientSearchValue);
    }, 150); // 150мс затримка для швидшого пошуку

    return () => clearTimeout(timer);
  }, [clientSearchValue]);

  // ОПТИМІЗАЦІЯ: Пошук клієнтів тільки при відкритті форми і наявності пошукового запиту
  const { data: clientSearchData, isLoading: isSearchingClients } = useQuery({
    queryKey: ["/api/clients/search", debouncedSearchValue],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchValue) {
        params.append('q', debouncedSearchValue);
      }
      params.append('limit', '100');
      
      const response = await fetch(`/api/clients/search?${params}`);
      if (!response.ok) throw new Error('Failed to search clients');
      return response.json();
    },
    enabled: isDialogOpen, // Завантажуємо тільки при відкритті форми
  });

  // ОПТИМІЗАЦІЯ: Компанії завантажуються тільки при відкритті форми
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ["/api/companies"],
    enabled: isDialogOpen, // Завантажуємо тільки при відкритті форми
  }) as { data: Company[]; isLoading: boolean };

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
      companyId: "",
      customerEmail: "",
      customerPhone: "",
      status: "Нове",
      notes: "",
    },
  });

  // Завантаження даних доставки при зміні клієнта
  useEffect(() => {
    const selectedClientId = form.watch("clientId");
    if (selectedClientId && selectedClientId !== '') {
      loadClientDeliveryData(selectedClientId);
    } else {
      setClientDeliveryData(null);
    }
  }, [form.watch("clientId")]);

  // Оновлюємо список контактів при зміні даних
  useEffect(() => {
    if (clientContactsData?.clientContacts) {
      setClientContactsForOrder(clientContactsData.clientContacts);
    } else {
      setClientContactsForOrder([]);
    }
  }, [clientContactsData]);

  // Відстежуємо зміни клієнта для оновлення контактів (тільки для нових замовлень)
  useEffect(() => {
    const clientId = form.watch("clientId");
    
    // ВАЖЛИВО: не очищуємо поля при редагуванні існуючого замовлення
    if (isEditMode && editingOrder) {
      return;
    }
    
    if (clientId) {
      setSelectedClientId(clientId);
      // Скидаємо обрану контактну особу при зміні клієнта
      form.setValue("clientContactsId", undefined);
      form.setValue("customerEmail", "");
      form.setValue("customerPhone", "");
    } else {
      setSelectedClientId("");
      setClientContactsForOrder([]);
      form.setValue("clientContactsId", undefined);
      form.setValue("customerEmail", "");
      form.setValue("customerPhone", "");
    }
  }, [form.watch("clientId"), isEditMode, editingOrder]);

  // Автозаповнення контактних даних при виборі контактної особи (тільки для нових замовлень)
  useEffect(() => {
    const contactId = form.watch("clientContactsId");
    
    // ВАЖЛИВО: автозаповнення тільки для нових замовлень або якщо поля пусті
    if (contactId && clientContactsForOrder.length > 0) {
      // Перетворюємо contactId на число для порівняння
      const contactIdNum = typeof contactId === 'string' ? parseInt(contactId) : contactId;
      const selectedContact = clientContactsForOrder.find(contact => contact.id === contactIdNum);
      if (selectedContact) {
        // При редагуванні заповнюємо тільки якщо поля пусті
        const currentEmail = form.getValues("customerEmail");
        const currentPhone = form.getValues("customerPhone");
        
        if (!isEditMode || !currentEmail) {
          form.setValue("customerEmail", selectedContact.email || "");
        }
        if (!isEditMode || !currentPhone) {
          form.setValue("customerPhone", selectedContact.phone || "");
        }
      }
    }
  }, [form.watch("clientContactsId"), clientContactsForOrder, isEditMode]);

  // Автозаповнення компанії при відкритті нової форми
  useEffect(() => {
    if (companies.length > 0 && isDialogOpen && !isEditMode && !form.watch("companyId")) {
      const defaultCompany = companies.find(company => company.isDefault);
      if (defaultCompany) {
        form.setValue("companyId", defaultCompany.id.toString());
        setSelectedCompanyId(defaultCompany.id.toString());
      }
    }
  }, [companies, isDialogOpen, isEditMode, form]);

  // Відстеження змін у полях доставки для показу кнопки збереження
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && ['carrierId', 'recipientCityRef', 'recipientCityName', 'recipientWarehouseRef', 'recipientWarehouseAddress'].includes(name)) {
        setTimeout(() => checkDeliveryDataChanges(), 100); // Невелика затримка для стабільності
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, isEditMode, originalDeliveryData]);
  
  const clientsList = clientSearchData?.clients || [];

  // ВИДАЛЕНО ДУБЛІКАТИ: orderStatusList вже є в orderStatuses

  // ВИДАЛЕНО ПРОБЛЕМНИЙ useEffect - встановлюємо компанію при створенні нового замовлення

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
      queryClient.invalidateQueries({ queryKey: ["/api/products/ordered"] });
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
    mutationFn: async (params: { id: number; statusId: number }) => {
      const requestData = { statusId: params.statusId };
      const result = await apiRequest(`/api/orders/${params.id}/status`, { method: "PUT", body: requestData });
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/ordered"] });
      toast({
        title: "Успіх",
        description: "Статус оновлено",
      });
    },
    onError: (error: any, variables) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити статус",
        variant: "destructive",
      });
    },
  });

  // Функція для зміни статусу
  const handleStatusChange = (orderId: number, newStatusId: string) => {
    const statusId = parseInt(newStatusId);
    if (isNaN(statusId)) {
      toast({
        title: "Помилка",
        description: "Невірний статус",
        variant: "destructive",
      });
      return;
    }
    updateStatusMutation.mutate({ id: orderId, statusId });
  };

  // Мутація для видалення замовлення
  const deleteOrderMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/orders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/ordered"] });
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
      return await apiRequest(`/api/orders/${data.id}`, { method: "PUT", body: data });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/ordered"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/products/ordered"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/products/ordered"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/products/ordered"] });
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
  }

  const handlePrintOrder = async (order: any) => {
    try {
      // Отримуємо дані для попереднього перегляду
      const response = await fetch(`/api/orders/${order.id}/print-preview`);
      if (response.ok) {
        const data = await response.json();
        setPrintData(data);
        setPrintOrderId(order.id);
        setIsPrintPreviewOpen(true);
      } else {
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити дані для друку",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити дані для друку",
        variant: "destructive",
      });
    }
  };

  // Функція для друку по відділах
  const handleDepartmentPrint = (order: any) => {
    setDepartmentPrintOrderId(order.id);
    setIsDepartmentPrintOpen(true);
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

  // Функція для відкриття діалогу створення нового замовлення
  const handleOpenNewOrderDialog = () => {
    setIsDialogOpen(true);
    setIsEditMode(false);
    setEditingOrder(null);
    setOrderItems([]);
    setClientSearchValue("");
    setClientComboboxOpen(false);
    setSelectedClientId("");
    setSelectedContactId(undefined);
    setClientContactsForOrder([]);
    setProductSearchTerm("");
    
    // Встановлюємо компанію за замовчуванням
    const defaultCompany = companies && companies.length > 0 
      ? companies.find((c: Company) => c.isDefault === true) || companies[0] 
      : null;
    
    if (defaultCompany) {
      setSelectedCompanyId(defaultCompany.id.toString());
    } else {
      setSelectedCompanyId("");
    }
    
    // Очищуємо форму і встановлюємо базові значення
    form.reset({
      clientId: "",
      clientContactsId: "",
      companyId: defaultCompany ? defaultCompany.id.toString() : "",
      customerEmail: "",
      customerPhone: "",
      status: "Нове",
      notes: "",
      orderNumber: "",
      totalAmount: "",
      paymentDate: "",
      dueDate: "",
      shippedDate: "",
      trackingNumber: "",
      invoiceNumber: "",
      carrierId: defaultCarrier?.id || null,
      statusId: undefined,
      paymentType: "full",
      paidAmount: "0",
      productionApproved: false,
      productionApprovedBy: "",
      productionApprovedAt: "",
    });
  };

  // Функція для закриття діалогу та очищення форми
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingOrder(null);
    setOrderItems([]);
    setClientSearchValue("");
    setClientComboboxOpen(false);
    setSelectedClientId("");
    setSelectedCompanyId("");
    setSelectedContactId(undefined);
    setClientContactsForOrder([]);
    setProductSearchTerm(""); // Очищаємо пошук товарів
    form.reset({
      clientId: "",
      clientContactsId: "",
      companyId: "",
      customerEmail: "",
      customerPhone: "",
      status: "Нове",
      notes: "",
      orderNumber: "",
      totalAmount: "",
    });
  };

  // Функція для закриття діалогу редагування
  const handleCloseEditDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingOrder(null);
    setOrderItems([]);
    setClientSearchValue("");
    setClientComboboxOpen(false);
    setSelectedClientId("");
    setSelectedCompanyId("");
    setSelectedContactId(undefined);
    setClientContactsForOrder([]);
    setProductSearchTerm("");
    form.reset();
  };

  // Функція для початку редагування замовлення - ЗАВАНТАЖУЄ ПОВНІ ДАНІ
  const handleEditOrder = async (order: any) => {
    console.log('🔧 DEBUG: handleEditOrder received order object:', order);
    
    // ПОВНЕ очищення попереднього стану для запобігання змішуванню даних  
    setEditingOrder(null);
    setOrderItems([]);
    setClientSearchValue("");
    setCompanySearchValue("");
    setSelectedClientId("");
    setSelectedCompanyId("");
    setSelectedContactId(undefined);
    setClientContactsForOrder([]);
    setProductSearchTerm("");
    
    // Повне скидання форми перед заповненням новими даними
    form.reset({
      clientId: "",
      clientContactsId: "",
      companyId: "",
      orderNumber: "",
      totalAmount: "",
      status: "Нове",
      notes: "",
      paymentDate: "",
      paymentType: "full",
      paidAmount: "0",
      dueDate: "",
      shippedDate: "",
      trackingNumber: "",
      invoiceNumber: "",
      carrierId: undefined,
      statusId: undefined,
      productionApproved: false,
      productionApprovedBy: "",
      productionApprovedAt: "",
      customerEmail: "",
      customerPhone: "",
    });
    
    // Завантажуємо повні дані замовлення з сервера
    try {
      const response = await fetch(`/api/orders/${order.id}`);
      if (!response.ok) throw new Error('Failed to fetch order details');
      const fullOrder = await response.json();
      
      console.log('🔧 DEBUG: Full order data from API:', fullOrder);
      console.log('🔧 DEBUG: Nova Poshta data from full order:', {
        recipientCityRef: fullOrder.recipientCityRef,
        recipientCityName: fullOrder.recipientCityName,
        recipientWarehouseRef: fullOrder.recipientWarehouseRef,
        recipientWarehouseAddress: fullOrder.recipientWarehouseAddress,
      });
      
      // Встановлення нового стану з повними даними
      setEditingOrder(fullOrder);
      setIsEditMode(true);
      setIsDialogOpen(true);
      
      // Невелика затримка для обробки React state updates
      setTimeout(() => {
        // Оптимізована функція для дат
        const formatDate = (dateString: string | null) => 
          dateString ? new Date(dateString).toISOString().slice(0, 16) : "";
        
        // Зберігаємо оригінальні дані доставки для порівняння
        const currentDeliveryData = {
          carrierId: fullOrder.carrierId?.toString() || "",
          recipientCityRef: fullOrder.recipientCityRef || "",
          recipientCityName: fullOrder.recipientCityName || "",
          recipientWarehouseRef: fullOrder.recipientWarehouseRef || "",
          recipientWarehouseAddress: fullOrder.recipientWarehouseAddress || ""
        };
        setOriginalDeliveryData(currentDeliveryData);
        setShowSaveDeliveryButton(false);
        
        // Заповнення форми повними даними
        form.reset({
          clientId: fullOrder.clientId?.toString() || "",
          clientContactsId: fullOrder.clientContactsId?.toString() || "",
          companyId: fullOrder.companyId?.toString() || "",
          orderNumber: fullOrder.orderNumber || "",
          totalAmount: fullOrder.totalAmount || "",
          status: fullOrder.status || "Нове",
          notes: fullOrder.notes || "",
          paymentDate: formatDate(fullOrder.paymentDate),
          paymentType: fullOrder.paymentType || "full",
          paidAmount: fullOrder.paidAmount || "0",
          dueDate: formatDate(fullOrder.dueDate),
          shippedDate: formatDate(fullOrder.shippedDate),
          trackingNumber: fullOrder.trackingNumber || "",
          invoiceNumber: fullOrder.invoiceNumber || "",
          carrierId: fullOrder.carrierId?.toString() || "",
          statusId: fullOrder.statusId?.toString() || "",
          productionApproved: fullOrder.productionApproved || false,
          productionApprovedBy: fullOrder.productionApprovedBy || "",
          productionApprovedAt: formatDate(fullOrder.productionApprovedAt),
          // ПРІОРИТЕТ: спочатку поля замовлення, потім контактна особа
          customerEmail: fullOrder.contactEmail || fullOrder.contact?.email || "",
          customerPhone: fullOrder.contactPhone || fullOrder.contact?.primaryPhone || fullOrder.contact?.phone || "",
          // Nova Poshta дані доставки
          recipientCityRef: fullOrder.recipientCityRef || "",
          recipientCityName: fullOrder.recipientCityName || "",
          recipientWarehouseRef: fullOrder.recipientWarehouseRef || "",
          recipientWarehouseAddress: fullOrder.recipientWarehouseAddress || "",
          recipientWarehouseNumber: fullOrder.recipientWarehouseNumber || "",
          shippingCost: fullOrder.shippingCost || "",
          estimatedDelivery: fullOrder.estimatedDelivery || "",
      });
      


        // Швидке встановлення клієнта з мінімальною логікою
        if (fullOrder.clientId) {
          setSelectedClientId(fullOrder.clientId.toString());
          // Використовуємо дані з замовлення якщо доступні
          const clientName = fullOrder.clientName || fullOrder.client?.name || `Client ${fullOrder.clientId}`;
          setClientSearchValue(clientName);
        } else {
          setSelectedClientId("");
          setClientSearchValue("");
        }

        // Швидке встановлення компанії
        if (fullOrder.companyId) {
          setSelectedCompanyId(fullOrder.companyId.toString());
          const company = companies?.find((c: any) => c.id === fullOrder.companyId);
          setCompanySearchValue(company?.name || `Company ${fullOrder.companyId}`);
        } else {
          setSelectedCompanyId("");
          setCompanySearchValue("");
        }

        // Завантажуємо контакти для правильного відображення значення
        if (fullOrder.clientId && fullOrder.clientContactsId) {
          // Встановлюємо selectedContactId для правильного відображення
          setSelectedContactId(parseInt(fullOrder.clientContactsId));
        }

        // Оптимізоване встановлення товарів
        const items = fullOrder.items?.map((item: any) => ({
          productId: item.productId || 0,
          itemName: item.itemName || item.product?.name || "",
          quantity: String(item.quantity || 1),
          unitPrice: String(item.unitPrice || 0),
          comment: item.comment || "",
        })) || [];
          setOrderItems(items);
        
        // Debug: перевірка form values після reset  
        setTimeout(() => {
          console.log('🔧 DEBUG: Form values after reset:', {
            recipientCityRef: form.getValues("recipientCityRef"),
            recipientCityName: form.getValues("recipientCityName"),
            recipientWarehouseRef: form.getValues("recipientWarehouseRef"),
            recipientWarehouseAddress: form.getValues("recipientWarehouseAddress"),
          });
        }, 200);
      }, 100);
    } catch (error) {
      console.error('🔧 ERROR: Failed to load order details:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити дані замовлення",
        variant: "destructive",
      });
    }
    
    // Встановлюємо фокус тільки для нових замовлень
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
    setOrderItems([...orderItems, { productId: 0, itemName: "", quantity: "", unitPrice: "", comment: "" }]);
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

  // Функція для відстеження змін у даних доставки
  const checkDeliveryDataChanges = () => {
    if (!isEditMode || !form.watch("clientId") || isDataAutoFilled) {
      setShowSaveDeliveryButton(false);
      return;
    }

    const currentDeliveryData = {
      carrierId: form.watch("carrierId") || "",
      recipientCityRef: form.watch("recipientCityRef") || "",
      recipientCityName: form.watch("recipientCityName") || "",
      recipientWarehouseRef: form.watch("recipientWarehouseRef") || "",
      recipientWarehouseAddress: form.watch("recipientWarehouseAddress") || ""
    };

    const hasChanges = JSON.stringify(currentDeliveryData) !== JSON.stringify(originalDeliveryData);
    setShowSaveDeliveryButton(hasChanges);
  };

  // Функція для збереження даних доставки в картку клієнта
  const saveDeliveryDataToClient = async () => {
    const clientId = form.watch("clientId");
    if (!clientId) return;

    const deliveryData = {
      carrierId: form.watch("carrierId") || null,
      recipientCityRef: form.watch("recipientCityRef") || null,
      recipientWarehouseRef: form.watch("recipientWarehouseRef") || null
    };

    try {
      const response = await fetch(`/api/clients/${clientId}/delivery-data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deliveryData),
      });

      if (!response.ok) throw new Error('Failed to save delivery data');

      // Оновлюємо оригінальні дані та приховуємо кнопку
      setOriginalDeliveryData({
        carrierId: deliveryData.carrierId?.toString() || "",
        recipientCityRef: deliveryData.recipientCityRef || "",
        recipientCityName: deliveryData.recipientCityName || "",
        recipientWarehouseRef: deliveryData.recipientWarehouseRef || "",
        recipientWarehouseAddress: deliveryData.recipientWarehouseAddress || ""
      });
      setShowSaveDeliveryButton(false);

      toast({
        title: "Успіх",
        description: "Дані доставки збережено в картку клієнта",
      });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти дані доставки",
        variant: "destructive",
      });
    }
  };

  // Допоміжні функції для таблиці
  // Функція для перевірки чи замовлення прострочене
  const isOrderOverdue = (order: any) => {
    if (!order.dueDate || order.shippedDate) return false;
    
    // Перевіряємо чи замовлення оплачене
    const paidAmount = parseFloat(order.paidAmount || '0');
    const totalAmount = parseFloat(order.totalAmount || '0');
    
    // Замовлення прострочене тільки якщо не повністю оплачене
    if (paidAmount < totalAmount) {
      const dueDate = new Date(order.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      const isOverdue = today > dueDate;
      

      
      return isOverdue;
    }
    
    return false; // Повністю оплачені замовлення не можуть бути простроченими
  };

  const getOrderNumberBgColor = (order: any) => {
    // Якщо замовлення прострочене
    if (isOrderOverdue(order)) return "bg-red-100 border-red-300 border-2 text-red-800";
    // Якщо оплачено
    const paidAmount = parseFloat(order.paidAmount || '0');
    if (paidAmount > 0) return "bg-green-50 border-green-200";
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

  const handleClientSelect = async (clientId: string) => {
    
    // Шукаємо клієнта у відфільтрованому списку
    const selectedClient = filteredClients.find((c: any) => c.id.toString() === clientId);
    
    if (selectedClient) {
      form.setValue("clientId", clientId);
      setSelectedClientId(clientId);
      setClientSearchValue(selectedClient.name);
      setClientComboboxOpen(false);
      
      // Очищаємо контакт при зміні клієнта
      form.setValue("clientContactsId", "");
      setSelectedContactId(undefined);
      
      // Автоматично вибираємо primary контакт якщо є
      try {
        const contactsResponse = await fetch(`/api/client-contacts?clientId=${clientId}`);
        if (contactsResponse.ok) {
          const contacts = await contactsResponse.json();
          const primaryContact = contacts.find((contact: any) => contact.isPrimary);
          
          if (primaryContact && !isEditMode) {
            // Автоматично вибираємо primary контакт для нових замовлень
            form.setValue("clientContactsId", primaryContact.id.toString());
            setSelectedContactId(primaryContact.id);
            
            // Автозаповнення email та телефону
            if (primaryContact.email) {
              form.setValue("customerEmail", primaryContact.email);
            }
            if (primaryContact.primaryPhone) {
              form.setValue("customerPhone", primaryContact.primaryPhone);
            }
          }
        }
      } catch (error) {
        console.error("Помилка завантаження primary контакту:", error);
      }

      // Автозаповнення даних доставки з клієнтського профілю
      try {
        const deliveryResponse = await fetch(`/api/clients/${clientId}/delivery-settings`);
        if (deliveryResponse.ok) {
          const deliverySettings = await deliveryResponse.json();
          
          if (!isEditMode) {
            // Автозаповнення перевізника
            if (deliverySettings.carrier) {
              form.setValue("carrierId", deliverySettings.carrier.id.toString());
            }

            // Автозаповнення міста Nova Poshta - завантажуємо назви з API за ref
            if (deliverySettings.city && deliverySettings.city.ref) {
              form.setValue("recipientCityRef", deliverySettings.city.ref);
              
              // Завантажуємо реальні назви з Nova Poshta API, як у ClientForm
              try {
                const cityResponse = await fetch(`/api/nova-poshta/city/${deliverySettings.city.ref}`);
                if (cityResponse.ok) {
                  const cityData = await cityResponse.json();
                  if (cityData) {
                    form.setValue("recipientCityName", cityData.Description || "");
                  }
                }
              } catch (error) {
                console.error('Помилка завантаження назви міста:', error);
                // Використовуємо збережену назву як fallback
                form.setValue("recipientCityName", deliverySettings.city.name || "");
              }
            }

            // Автозаповнення відділення Nova Poshta
            if (deliverySettings.warehouse) {
              form.setValue("recipientWarehouseRef", deliverySettings.warehouse.ref);
              form.setValue("recipientWarehouseAddress", deliverySettings.warehouse.address || "");
            }
          }
        }
      } catch (error) {
        console.error("Помилка завантаження даних доставки:", error);
      }
      
    } else {
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
    console.log("🔧 DEBUG: Form data received:", data);
    console.log("🔧 DEBUG: Nova Poshta fields from form:", {
      recipientCityRef: data.recipientCityRef,
      recipientCityName: data.recipientCityName,
      recipientWarehouseRef: data.recipientWarehouseRef,
      recipientWarehouseAddress: data.recipientWarehouseAddress,
      shippingCost: data.shippingCost,
      estimatedDelivery: data.estimatedDelivery,
    });
    
    // Якщо діалог закритий, не продовжуємо валідацію
    if (!isDialogOpen) {
      return;
    }
    
    // Перевіряємо, чи додані товари
    if (orderItems.length === 0) {
      toast({
        title: "Помилка",
        description: "Додайте хоча б один товар до замовлення",
        variant: "destructive",
      });
      return;
    }

    // Перевіряємо валідність товарів - має бути або productId, або itemName
    const invalidItems = orderItems.filter(item => {
      const hasProduct = item.productId > 0;
      const hasItemName = item.itemName && item.itemName.trim().length > 0;
      const hasQuantity = item.quantity && item.quantity.trim().length > 0;
      const hasPrice = item.unitPrice && item.unitPrice.trim().length > 0;
      
      return !(hasProduct || hasItemName) || !hasQuantity || !hasPrice;
    });
    
    if (invalidItems.length > 0) {
      toast({
        title: "Помилка", 
        description: "Для кожного товару заповніть назву (або оберіть зі списку), кількість та ціну",
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
        ...(data.clientId && data.clientId !== '' && { clientId: parseInt(data.clientId) }),
        ...(data.clientContactsId && String(data.clientContactsId) !== '' && { clientContactsId: typeof data.clientContactsId === 'string' ? parseInt(data.clientContactsId) : data.clientContactsId }),
        ...(data.companyId && data.companyId !== '' && { companyId: parseInt(data.companyId) }),
        ...(data.invoiceNumber && data.invoiceNumber !== '' && { invoiceNumber: data.invoiceNumber }),
        ...(data.carrierId && data.carrierId !== "" && { carrierId: parseInt(data.carrierId) }),
        ...(data.notes && data.notes !== '' && { notes: data.notes }),
        ...(data.paymentDate && data.paymentDate !== '' && { paymentDate: parseDateForServer(data.paymentDate) }),
        ...(data.dueDate && data.dueDate !== '' && { dueDate: parseDateForServer(data.dueDate) }),
        ...(data.shippedDate && data.shippedDate !== '' && { shippedDate: parseDateForServer(data.shippedDate) }),
        // Додаємо email та телефон
        ...(data.customerEmail && data.customerEmail !== '' && { contactEmail: data.customerEmail }),
        ...(data.customerPhone && data.customerPhone !== '' && { contactPhone: data.customerPhone }),
        // Додаємо Nova Poshta поля
        ...(data.recipientCityRef && data.recipientCityRef !== '' && { recipientCityRef: data.recipientCityRef }),
        ...(data.recipientCityName && data.recipientCityName !== '' && { recipientCityName: data.recipientCityName }),
        ...(data.recipientWarehouseRef && data.recipientWarehouseRef !== '' && { recipientWarehouseRef: data.recipientWarehouseRef }),
        ...(data.recipientWarehouseAddress && data.recipientWarehouseAddress !== '' && { recipientWarehouseAddress: data.recipientWarehouseAddress }),
        ...(data.shippingCost && data.shippingCost !== '' && { shippingCost: data.shippingCost }),
        ...(data.estimatedDelivery && data.estimatedDelivery !== '' && { estimatedDelivery: data.estimatedDelivery }),
      },
      items: orderItems.map(item => ({
        productId: item.productId > 0 ? item.productId : null,
        itemName: item.itemName || "",
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice).toString(),
        totalPrice: (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toString(),
        comment: item.comment || "",
      })),
    };
    
    if (isEditMode && editingOrder) {
      // Редагування існуючого замовлення
      updateOrderMutation.mutate({
        id: editingOrder.id,
        ...orderData,
      });
    } else {
      // Створення нового замовлення
      createOrderMutation.mutate(orderData);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <HandPlatter className="w-6 h-6 text-white" />
              </div>
              <div >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Замовлення клієнтів
                </h1>
                <p className="text-gray-600 mt-1">Управління замовленнями та їх статусами</p>
              </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">

              <Button
                variant="outline"
                onClick={() => setIsStatusSettingsOpen(!isStatusSettingsOpen)}
              >
                <Settings className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-3002" />
                Налаштування статусів
              </Button>
              <div className="flex gap-2">
                <OrdersXmlImport />
                <OrderItemsXmlImport onImportComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                  toast({
                    title: "Імпорт завершено",
                    description: "Позиції замовлень успішно імпортовані",
                  });
                }} />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  // Використовуємо правильний handler в залежності від режиму
                  if (isEditMode) {
                    handleCloseEditDialog();
                  } else {
                    handleCloseDialog();
                  }
                } else {
                  setIsDialogOpen(open);
                }
              }}>
                <DialogTrigger asChild>
                  <Button 
                     className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={handleOpenNewOrderDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Нове замовлення
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="order-dialog-description">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? `Редагувати рахунок ${editingOrder?.orderNumber}` : "Створити нове замовлення"}
                </DialogTitle>
                <DialogDescription id="order-dialog-description">
                  {isEditMode ? "Внесіть зміни до існуючого замовлення та його товарів" : "Створіть нове замовлення від клієнта з товарами та датами"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
                toast({
                  title: "Помилка валідації",
                  description: "Перевірте правильність заповнення всіх полів",
                  variant: "destructive",
                });
              })} className="space-y-6">
                {/* Поле компанії */}
                <div className="grid grid-cols-3 gap-4">
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
                  
                  <div>
                    <Label htmlFor="invoiceNumber">Рахунок</Label>
                    <Input
                      id="invoiceNumber"
                      {...form.register("invoiceNumber")}
                      placeholder="Номер рахунку"
                    />
                  </div>

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
                          setClientSearchValue(value);
                          
                          // Очищаємо обраний ID тільки якщо користувач щось міняв
                          if (value !== clientSearchValue && form.watch("clientId")) {
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
                          // Відкриваємо список для пошуку
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
                    <ContactPersonAutocomplete
                      clientId={form.watch("clientId") ? parseInt(form.watch("clientId")) : undefined}
                      value={isEditMode ? (editingOrder?.contact?.fullName || editingOrder?.contactName || "") : ""}
                      onChange={(contactId, contactName, contactData) => {
                        form.setValue("clientContactsId", contactId ? contactId.toString() : "");
                        
                        // Миттєве автозаповнення або очищення email та телефону
                        if (contactData) {
                          form.setValue("customerEmail", contactData.email || "");
                          form.setValue("customerPhone", contactData.phone || "");
                        }
                      }}
                      disabled={!form.watch("clientId")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={form.watch("customerEmail") || ""}
                      onChange={(e) => form.setValue("customerEmail", e.target.value)}
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
                      value={form.watch("customerPhone") || ""}
                      onChange={(e) => form.setValue("customerPhone", e.target.value)}
                    />
                  </div>
                  

                  <div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="carrierId" className="flex-1">Перевізник</Label>
                      {form.watch("clientId") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleManualDeliveryFill}
                                disabled={!clientDeliveryData?.client || loadingDeliveryData || (!clientDeliveryData.client.carrierId && !clientDeliveryData.client.cityRef && !clientDeliveryData.client.warehouseRef && !clientDeliveryData.carrier && !clientDeliveryData.city && !clientDeliveryData.warehouse)}
                                className="h-8 w-8 p-0"
                              >
                                {loadingDeliveryData ? (
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Заповнити дані доставки з профілю клієнта</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {carriersLoading || activeCarriersLoading ? (
                      <div className="flex items-center space-x-2 h-10 px-3 border rounded-md bg-muted">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">Завантаження перевізників...</span>
                      </div>
                    ) : (
                      <Select
                        value={(() => {
                          const currentCarrierId = form.watch("carrierId");
                          if (!currentCarrierId || currentCarrierId === "") return "none";
                          return currentCarrierId;
                        })()}
                        onValueChange={(value) => {
                          form.setValue("carrierId", value === "none" ? "" : value);
                          // Коли користувач вручну змінює перевізника, скидаємо флаг автозаповнення
                          setIsDataAutoFilled(false);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть перевізника" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Без перевізника</SelectItem>
                          {(() => {
                            const currentCarrierId = form.watch("carrierId");
                            
                            // Завжди показуємо активних перевізників
                            let carriersToShow = [...(activeCarriers || [])];
                            
                            // При редагуванні додаємо поточний вибраний перевізник якщо він неактивний
                            if (isEditMode && currentCarrierId && currentCarrierId !== "" && carriers && carriers.length > 0) {
                              const currentCarrier = carriers.find((c: any) => c.id.toString() === currentCarrierId);
                              if (currentCarrier && !currentCarrier.isActive && !carriersToShow.find((c: any) => c.id.toString() === currentCarrierId)) {
                                carriersToShow.push(currentCarrier);
                              }
                            }
                            
                            return carriersToShow.map((carrier: any) => (
                              <SelectItem key={carrier.id} value={carrier.id.toString()}>
                                {carrier.name || `Перевізник ${carrier.id}`}{!carrier.isActive ? ' (неактivний)' : ''}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    )}
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
                    </div>


                {/* Nova Poshta Integration */}
                {form.watch("carrierId") && carriers?.find((c: any) => c.id.toString() === form.watch("carrierId"))?.name === "Нова Пошта" && (
                  <div className="mt-6">

                    <NovaPoshtaIntegration
                      key={`nova-poshta-${isEditMode ? editingOrder?.id : 'new'}-${novaPoshtaKey}`}
                      onAddressSelect={(address, cityRef, warehouseRef, cityName, warehouseNumber) => {
                        // Коли користувач вручну вибирає адресу, скидаємо флаг автозаповнення
                        setIsDataAutoFilled(false);
                        
                        // Зберігаємо адресу в примітках замовлення та в окремих полях
                        const currentNotes = form.watch("notes") || "";
                        const addressInfo = `Адреса доставки Nova Poshta: ${address}`;
                        if (!currentNotes.includes("Адреса доставки Nova Poshta:")) {
                          form.setValue("notes", currentNotes ? `${currentNotes}\n${addressInfo}` : addressInfo);
                        }
                        
                        // Зберігаємо дані для API запитів (будуть передані на сервер при збереженні)
                        form.setValue("recipientCityRef", cityRef);
                        form.setValue("recipientWarehouseRef", warehouseRef);
                        form.setValue("recipientWarehouseAddress", address);
                        
                        // Зберігаємо назву міста отриману з Nova Poshta API
                        if (cityName) {
                          form.setValue("recipientCityName", cityName);
                        }
                        
                        // Зберігаємо номер відділення Nova Poshta
                        if (warehouseNumber) {
                          form.setValue("recipientWarehouseNumber", warehouseNumber);
                        }
                      }}
                      onCostCalculated={(cost) => {
                        // Зберігаємо розраховану вартість доставки в примітках та окремих полях
                        const currentNotes = form.watch("notes") || "";
                        const costInfo = `Вартість доставки: ${cost.Cost} грн, очікувана дата: ${cost.estimatedDeliveryDate || 'не вказано'}`;
                        
                        // Видаляємо попередню інформацію про вартість якщо є
                        const updatedNotes = currentNotes.replace(/Вартість доставки:.*?\n?/g, '');
                        form.setValue("notes", updatedNotes ? `${updatedNotes}\n${costInfo}` : costInfo);
                        
                        // Зберігаємо дані для API (будуть передані на сервер при збереженні)
                        form.setValue("shippingCost", cost.Cost);
                        if (cost.estimatedDeliveryDate) {
                          form.setValue("estimatedDelivery", cost.estimatedDeliveryDate);
                        }
                      }}
                      onTrackingNumberCreated={(trackingNumber) => {
                        form.setValue("trackingNumber", trackingNumber);
                      }}
                      orderId={isEditMode ? editingOrder?.id?.toString() : undefined}
                      recipientName={(() => {
                        // Спочатку перевіряємо обраного клієнта
                        const selectedClient = clientsList?.find((c: any) => c.id.toString() === form.watch("clientId"));
                        if (selectedClient) {
                          return selectedClient.name;
                        }
                        // Якщо клієнт не знайдений, використовуємо пошуковий рядок
                        return clientSearchValue || "";
                      })()}
                      recipientPhone={(() => {
                        // Спочатку перевіряємо обраний контакт
                        const selectedContact = clientContactsForOrder?.find((c: any) => c.id.toString() === form.watch("clientContactsId"));
                        if (selectedContact && selectedContact.primaryPhone) {
                          return selectedContact.primaryPhone;
                        }
                        // Якщо контакт не має телефону, перевіряємо клієнта
                        const selectedClient = clientsList?.find((c: any) => c.id.toString() === form.watch("clientId"));
                        if (selectedClient && selectedClient.phone) {
                          return selectedClient.phone;
                        }
                        return "";
                      })()}
                      weight={(() => {
                        // Використовуємо стандартну вагу 1 кг як базову, 
                        // можна розрахувати з позицій замовлення в майбутньому
                        return "1.0";
                      })()}
                      declaredValue={form.watch("totalAmount")}
                      initialCityRef={form.watch("recipientCityRef")}
                      initialWarehouseRef={form.watch("recipientWarehouseRef")}
                      initialCityName={form.watch("recipientCityName")}

                      initialWarehouseAddress={form.watch("recipientWarehouseAddress")}
                    />
                    
                    {/* Кнопка збереження даних доставки в картку клієнта */}
                    {showSaveDeliveryButton && form.watch("clientId") && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">
                            Дані доставки змінено
                          </p>
                          <p className="text-xs text-blue-600">
                            Зберегти ці налаштування доставки як типові для цього клієнта?
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={saveDeliveryDataToClient}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Зберегти в картку клієнта
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Приховані поля для Nova Poshta даних */}
                <input type="hidden" {...form.register("recipientCityRef")} />
                <input type="hidden" {...form.register("recipientCityName")} />

                <input type="hidden" {...form.register("recipientWarehouseRef")} />
                <input type="hidden" {...form.register("recipientWarehouseAddress")} />
                <input type="hidden" {...form.register("recipientWarehouseNumber")} />

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
                        <div key={index} className="space-y-3 p-3 border rounded-lg">
                          {/* Перший рядок: товар, кількість, ціна, сума, видалення */}
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 relative">
                              <Input
                                placeholder="Назва товару..."
                                value={(() => {
                                  // Спочатку перевіряємо чи є прив'язаний товар з products
                                  if (item.productId > 0 && products) {
                                    const product = products.find((p: any) => p.id === item.productId);
                                    if (product) return product.name;
                                  }
                                  
                                  // Якщо прив'язаного товару немає, показуємо itemName з 1С
                                  if (item.itemName) {
                                    return item.itemName;
                                  }
                                  
                                  // Якщо редагуємо існуюче замовлення, показуємо дані з нього
                                  if (editingOrder?.items && editingOrder.items[index]) {
                                    const orderItem = editingOrder.items[index];
                                    if (orderItem.itemName) {
                                      return orderItem.itemName;
                                    }
                                    if (orderItem.product?.name) {
                                      return orderItem.product.name;
                                    }
                                  }
                                  
                                  return "";
                                })()}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Оновлюємо itemName при введенні тексту
                                  updateOrderItem(index, "itemName", value);
                                  // Скидаємо productId якщо користувач почав вводити власну назву
                                  if (item.productId > 0) {
                                    updateOrderItem(index, "productId", 0);
                                  }
                                  // Оновлюємо пошуковий термін для динамічного завантаження товарів
                                  setProductSearchTerm(value);
                                }}
                                onFocus={() => {
                                  // Показуємо випадаючий список при фокусі
                                  const dropdown = document.getElementById(`product-dropdown-${index}`);
                                  if (dropdown) dropdown.style.display = 'block';
                                  // Встановлюємо поточне значення як пошуковий термін
                                  const currentValue = item.itemName || (editingOrder?.items?.[index]?.itemName) || "";
                                  if (currentValue) {
                                    setProductSearchTerm(currentValue);
                                  }
                                }}
                                onBlur={(e) => {
                                  // Приховуємо випадаючий список через короткий час (щоб дати час на клік)
                                  setTimeout(() => {
                                    const dropdown = document.getElementById(`product-dropdown-${index}`);
                                    if (dropdown) dropdown.style.display = 'none';
                                  }, 200);
                                }}
                              />
                              
                              {/* Випадаючий список товарів */}
                              <div
                                id={`product-dropdown-${index}`}
                                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
                                style={{ display: 'none' }}
                              >
                                {products?.map((product: any) => (
                                  <div
                                    key={product.id}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      updateOrderItem(index, "productId", product.id);
                                      updateOrderItem(index, "itemName", product.name);
                                      // Автозаповнення ціни з товару
                                      if (product.retailPrice && (!item.unitPrice || item.unitPrice === "0")) {
                                        updateOrderItem(index, "unitPrice", product.retailPrice.toString());
                                      }
                                      // Очищаємо пошук після вибору товару
                                      setProductSearchTerm("");
                                      const dropdown = document.getElementById(`product-dropdown-${index}`);
                                      if (dropdown) dropdown.style.display = 'none';
                                    }}
                                  >
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-gray-500">
                                      {product.sku} • {formatCurrency(product.retailPrice)}
                                    </div>
                                  </div>
                                ))}
                                {products?.length === 0 && debouncedProductSearchTerm.length >= 2 && (
                                  <div className="px-3 py-2 text-gray-500">
                                    Товарів не знайдено
                                  </div>
                                )}
                                {debouncedProductSearchTerm.length > 0 && debouncedProductSearchTerm.length < 2 && (
                                  <div className="px-3 py-2 text-gray-500">
                                    Введіть мінімум 2 символи для пошуку
                                  </div>
                                )}
                              </div>
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
                            
                            {/* Кнопка коментаря */}
                            {!item.comment ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  updateOrderItem(index, "comment", " ");
                                }}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            ) : null}
                          </div>
                          
                          {/* Другий рядок: коментар (тільки якщо є) */}
                          {item.comment && (
                            <div className="flex items-center space-x-2">
                              <Input
                                placeholder="Коментар до товару"
                                value={item.comment || ""}
                                onChange={(e) => updateOrderItem(index, "comment", e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  updateOrderItem(index, "comment", "");
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
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
        {/*</header>*/}

      {/* Status Settings Panel */}
      {isStatusSettingsOpen && (
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
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

          {/* <main className="p-3 space-y-3"> */}
      {/* Statistics Cards */}
      <div className="w-full px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього замовлень</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalServerRecords}</p>
                  <p className="text-xs text-blue-600">Загальна кількість</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <ShoppingCart className="w-8 h-8 text-white" />
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
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">Загальний дохід</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900 mb-1">{formatCurrency(orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0))}</p>
                  <p className="text-xs text-emerald-600">Загальна сума, грн.</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <DollarSign className="w-8 h-8 text-white" />
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
                    <Clock className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">В обробці</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{orders.filter((o: any) => o.status === 'processing').length}</p>
                  <p className="text-xs text-purple-600">Очікують обробки</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
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
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Завершено</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{orders.filter((o: any) => o.status === 'completed').length}</p>
                  <p className="text-xs text-orange-600">Завершено</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search - Відновлено з робочої сторінки клієнтів */}
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
              />

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
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
              <Select value={paymentFilter} onValueChange={handlePaymentFilterChange}>
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
              <Select value={dateRangeFilter} onValueChange={handleDateRangeFilterChange}>
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
                  onClick={handleClearFilters}
                >
                  <X className="w-4 h-4 mr-1" />
                  Очистити
                </Button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <span>Знайдено: {totalServerRecords} замовлень (сторінка {serverPagination.page} з {totalServerPages})</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Автооновлення кожні 30с
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <div className="w-full pt-3">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Завантаження замовлень...</p>
            </div>
          ) : (
            <DataTable
            data={orders}
            serverPagination={{
              enabled: true,
              currentPage: serverPagination.page,
              totalPages: totalServerPages,
              totalItems: totalServerRecords,
              pageSize: serverPagination.limit,
              onPageChange: (page) => setServerPagination(prev => ({ ...prev, page }))
            }}
            columns={[
              {
                key: 'orderSequenceNumber',
                label: 'Замовлення',
                sortable: true,
                render: (value, order) => renderColumnContent('orderSequenceNumber', order)
              },
              {
                key: 'orderNumber',
                label: 'Рахунок',
                sortable: true,
                render: (value, order) => renderColumnContent('orderNumber', order)
              },
              {
                key: 'clientName',
                label: 'Клієнт',
                sortable: true,
                render: (value, order) => renderColumnContent('clientName', order)
              },
              {
                key: 'paymentDate',
                label: 'Дата оплати',
                sortable: true,
                render: (value, order) => renderColumnContent('paymentDate', order)
              },
              {
                key: 'dueDate',
                label: 'Термін виконання',
                sortable: true,
                render: (value, order) => renderColumnContent('dueDate', order)
              },
              {
                key: 'totalAmount',
                label: 'Сума',
                sortable: true,
                type: 'number',
                render: (value, order) => renderColumnContent('totalAmount', order)
              },
              {
                key: 'shippedDate',
                label: 'Відвантаження',
                sortable: true,
                render: (value, order) => renderColumnContent('shippedDate', order)
              },
              {
                key: 'status',
                label: 'Статус',
                sortable: true,
                render: (value, order) => renderColumnContent('status', order)
              }
            ]}
            loading={isLoading}
            onSort={(field, direction) => handleSort(field)}
            onRowClick={(order) => toggleOrderExpansion(order.id)}
            actions={(order) => renderColumnContent('actions', order)}
            title="Список замовлень"
            storageKey="orders-datatable"
            expandableContent={(order) => (
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
                
                {/* Списання компонентів */}
                <div className="mt-6 border-t pt-4">
                  <ComponentDeductions orderId={order.id} />
                </div>
              </div>
            )}
            expandedItems={new Set(expandedOrderId ? [expandedOrderId] : [])}
            onToggleExpand={(itemId) => toggleOrderExpansion(Number(itemId))}
            />
          )}
          
          {/* Empty state - показується якщо немає даних */}
          {orders.length === 0 && !isLoading && (
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
          )}
        </div>
      </div>

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

        {/* Попередній перегляд друку */}
        <PrintPreviewModal
          isOpen={isPrintPreviewOpen}
          onClose={() => setIsPrintPreviewOpen(false)}
          printData={printData}
          orderId={printOrderId}
        />

        {/* Друк по відділах */}
        <DepartmentPrintModal
          isOpen={isDepartmentPrintOpen}
          onClose={() => setIsDepartmentPrintOpen(false)}
          orderId={departmentPrintOrderId}
        />


      </div>
    </div>
  );
}