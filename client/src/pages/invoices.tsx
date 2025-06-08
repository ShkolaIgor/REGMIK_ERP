import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Eye, Edit, Trash2, FileText, Send, CreditCard, Copy } from "lucide-react";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const invoiceSchema = z.object({
  clientId: z.number().min(1, "Виберіть клієнта"),
  companyId: z.number().min(1, "Виберіть компанію"),
  invoiceNumber: z.string().min(1, "Введіть номер рахунку"),
  amount: z.string().min(1, "Введіть суму"),
  currency: z.string().default("UAH"),
  status: z.string().default("draft"),
  issueDate: z.string().min(1, "Оберіть дату створення"),
  dueDate: z.string().min(1, "Оберіть термін оплати"),
  description: z.string().optional(),
  
  // Додаткові поля для самостійних рахунків
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryRegion: z.string().optional(),
  deliveryPostalCode: z.string().optional(),
  deliveryCountry: z.string().default("Україна"),
  deliveryMethod: z.string().optional(),
  deliveryNotes: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800"
};

const statusLabels = {
  draft: "Чернетка",
  sent: "Відправлений",
  pending: "Очікує оплати",
  paid: "Оплачений",
  overdue: "Прострочений",
  cancelled: "Скасований"
};

export default function Invoices() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invoicesData = [], isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      currency: "UAH",
      status: "draft",
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      return apiRequest("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
          issueDate: new Date(data.issueDate).toISOString(),
          dueDate: new Date(data.dueDate).toISOString(),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Рахунок успішно створено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/invoices/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Успіх",
        description: "Рахунок видалено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    createMutation.mutate(data);
  };

  const viewInvoiceDetails = async (invoice: any) => {
    try {
      const response = await apiRequest(`/api/invoices/${invoice.id}`);
      setSelectedInvoice(response);
      setIsViewOpen(true);
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити деталі рахунку",
        variant: "destructive",
      });
    }
  };

  const handleEditInvoice = (invoice: any) => {
    form.reset({
      clientId: invoice.clientId,
      companyId: invoice.companyId,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      status: invoice.status,
      issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
      dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
      description: invoice.description || "",
      customerName: invoice.customerName || "",
      customerPhone: invoice.customerPhone || "",
      customerEmail: invoice.customerEmail || "",
      deliveryAddress: invoice.deliveryAddress || "",
      deliveryCity: invoice.deliveryCity || "",
      deliveryRegion: invoice.deliveryRegion || "",
      deliveryPostalCode: invoice.deliveryPostalCode || "",
      deliveryCountry: invoice.deliveryCountry || "Україна",
      deliveryMethod: invoice.deliveryMethod || "",
      deliveryNotes: invoice.deliveryNotes || "",
      paymentMethod: invoice.paymentMethod || "",
      paymentTerms: invoice.paymentTerms || "",
      notes: invoice.notes || "",
    });
    setSelectedInvoice(invoice);
    setIsCreateOpen(true);
  };

  const handlePrintInvoice = (invoice: any) => {
    const printWindow = window.open(`/invoices/${invoice.id}/print`, '_blank');
    if (printWindow) {
      printWindow.print();
    } else {
      toast({
        title: "Помилка",
        description: "Не вдалося відкрити вікно друку",
        variant: "destructive",
      });
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Успіх",
        description: "Статус рахунку оновлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendInvoice = (invoice: any) => {
    updateStatusMutation.mutate({ id: invoice.id, status: "sent" });
  };

  const handleMarkAsPaid = (invoice: any) => {
    updateStatusMutation.mutate({ id: invoice.id, status: "paid" });
  };

  const duplicateMutation = useMutation({
    mutationFn: async (originalInvoice: any) => {
      const duplicateData = {
        ...originalInvoice,
        invoiceNumber: `${originalInvoice.invoiceNumber}-COPY-${Date.now()}`,
        status: "draft",
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        paidDate: null,
      };
      delete duplicateData.id;
      delete duplicateData.createdAt;
      delete duplicateData.updatedAt;
      
      return apiRequest("/api/invoices", {
        method: "POST",
        body: JSON.stringify(duplicateData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Успіх",
        description: "Рахунок успішно дубльовано",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDuplicateInvoice = (invoice: any) => {
    duplicateMutation.mutate(invoice);
  };

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: currency || 'UAH',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Завантаження...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Рахунки</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Створити рахунок
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Створення нового рахунку</DialogTitle>
              <DialogDescription>
                Заповніть інформацію для створення рахунку
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Клієнт</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть клієнта" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
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
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Компанія</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть компанію" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies.map((company: any) => (
                              <SelectItem key={company.id} value={company.id.toString()}>
                                {company.name}
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
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Номер рахунку</FormLabel>
                        <FormControl>
                          <Input placeholder="INV-2025-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Сума</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата створення</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Термін оплати</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Опис</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Опис рахунку..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Секція інформації про клієнта */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Інформація про клієнта</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ім'я клієнта</FormLabel>
                          <FormControl>
                            <Input placeholder="Ім'я контактної особи" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон</FormLabel>
                          <FormControl>
                            <Input placeholder="+380501234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="client@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Секція доставки */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Інформація про доставку</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deliveryCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Місто</FormLabel>
                          <FormControl>
                            <Input placeholder="Київ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="deliveryRegion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Область</FormLabel>
                          <FormControl>
                            <Input placeholder="Київська область" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Адреса доставки</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Повна адреса доставки..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="deliveryMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Спосіб доставки</FormLabel>
                          <FormControl>
                            <Input placeholder="Нова Пошта, Самовивіз" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Спосіб оплати</FormLabel>
                          <FormControl>
                            <Input placeholder="Готівка, Картка, Банківський переказ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Додаткові примітки */}
                <div className="border-t pt-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Додаткові примітки</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Особливі вимоги, коментарі..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Створення..." : "Створити"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список рахунків</CardTitle>
          <CardDescription>
            Управління рахунками та їх статусами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Клієнт</TableHead>
                <TableHead>Сума</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата створення</TableHead>
                <TableHead>Термін оплати</TableHead>
                <TableHead>Джерело</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesData.map((invoiceData: any) => {
                const invoice = invoiceData.invoices;
                const client = invoiceData.clients;
                const company = invoiceData.companies;
                
                return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>{client?.name || 'Невідомий клієнт'}</TableCell>
                  <TableCell>
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                      {statusLabels[invoice.status as keyof typeof statusLabels] || invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.source === 'manual' ? 'outline' : 'secondary'}>
                      {invoice.source === 'manual' ? 'Ручний' : 
                       invoice.source === 'bitrix24' ? 'Bitrix24' :
                       invoice.source === '1c' ? '1C' : invoice.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewInvoiceDetails(invoice)}
                        title="Переглянути деталі"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditInvoice(invoice)}
                        title="Редагувати"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintInvoice(invoice)}
                        title="Друкувати"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendInvoice(invoice)}
                          title="Відправити"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsPaid(invoice)}
                          title="Позначити як оплачений"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateInvoice(invoice)}
                        title="Дублювати"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(invoice.id)}
                        disabled={deleteMutation.isPending}
                        title="Видалити"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Діалог перегляду деталей рахунку */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Деталі рахунку {selectedInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Клієнт</Label>
                  <p className="text-sm font-medium">{selectedInvoice.client?.name}</p>
                </div>
                <div>
                  <Label>Компанія</Label>
                  <p className="text-sm font-medium">{selectedInvoice.company?.name}</p>
                </div>
                <div>
                  <Label>Сума</Label>
                  <p className="text-sm font-medium">
                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                  </p>
                </div>
                <div>
                  <Label>Статус</Label>
                  <Badge className={statusColors[selectedInvoice.status as keyof typeof statusColors]}>
                    {statusLabels[selectedInvoice.status as keyof typeof statusLabels] || selectedInvoice.status}
                  </Badge>
                </div>
              </div>

              {selectedInvoice.description && (
                <div>
                  <Label>Опис</Label>
                  <p className="text-sm">{selectedInvoice.description}</p>
                </div>
              )}

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <Label>Позиції рахунку</Label>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Назва</TableHead>
                        <TableHead>Кількість</TableHead>
                        <TableHead>Ціна</TableHead>
                        <TableHead>Сума</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice, selectedInvoice.currency)}</TableCell>
                          <TableCell>{formatCurrency(item.totalPrice, selectedInvoice.currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}