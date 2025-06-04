import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Mail, Printer, Send, Eye, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ClientMail, InsertClientMail, Client, MailRegistry, EnvelopePrintSettings } from "@shared/schema";

export default function ClientMailPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [batchName, setBatchName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mails = [], isLoading: isLoadingMails } = useQuery<ClientMail[]>({
    queryKey: ["/api/client-mail"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: registry = [] } = useQuery<MailRegistry[]>({
    queryKey: ["/api/mail-registry"],
  });

  const { data: printSettings = [] } = useQuery<EnvelopePrintSettings[]>({
    queryKey: ["/api/envelope-print-settings"],
  });

  const createMailMutation = useMutation({
    mutationFn: (data: InsertClientMail) => apiRequest("/api/client-mail", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-mail"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Лист створено" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити лист", variant: "destructive" });
    },
  });

  const batchPrintMutation = useMutation({
    mutationFn: (data: { mailIds: number[], batchName: string }) => 
      apiRequest("/api/client-mail/batch-print", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-mail"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mail-registry"] });
      setSelectedItems([]);
      setBatchName("");
      toast({ title: "Конверти надруковано" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося надрукувати конверти", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "queued": return "bg-blue-100 text-blue-800";
      case "sent": return "bg-green-100 text-green-800";
      case "delivered": return "bg-emerald-100 text-emerald-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getMailTypeLabel = (type: string) => {
    switch (type) {
      case "official": return "Офіційний";
      case "marketing": return "Маркетинговий";
      case "notification": return "Повідомлення";
      default: return type;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("uk-UA");
  };

  const handleCreateMail = (formData: FormData) => {
    const data = {
      clientId: formData.get("clientId") as string,
      subject: formData.get("subject") as string,
      content: formData.get("content") as string,
      mailType: formData.get("mailType") as string,
      senderName: formData.get("senderName") as string,
      senderAddress: formData.get("senderAddress") as string,
      recipientName: formData.get("recipientName") as string,
      recipientAddress: formData.get("recipientAddress") as string,
      advertisementText: formData.get("advertisementText") as string || null,
      notes: formData.get("notes") as string || null,
    };
    createMailMutation.mutate(data);
  };

  const handleBatchPrint = () => {
    if (selectedItems.length === 0) {
      toast({ title: "Помилка", description: "Оберіть листи для друку", variant: "destructive" });
      return;
    }
    if (!batchName.trim()) {
      toast({ title: "Помилка", description: "Введіть назву партії", variant: "destructive" });
      return;
    }
    batchPrintMutation.mutate({ mailIds: selectedItems, batchName: batchName.trim() });
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAllItems = () => {
    const draftMails = mails.filter(mail => mail.status === "draft");
    setSelectedItems(draftMails.map(mail => mail.id));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Листування з клієнтами</h1>
          <p className="text-gray-600">Управління паперовою поштою та друк конвертів</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Налаштування друку
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Налаштування друку конвертів</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Розмір конверта</Label>
                    <Select defaultValue="dl">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dl">DL (110×220 мм)</SelectItem>
                        <SelectItem value="c4">C4 (229×324 мм)</SelectItem>
                        <SelectItem value="c5">C5 (162×229 мм)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Розмір шрифту</Label>
                    <Input type="number" defaultValue="12" min="8" max="20" />
                  </div>
                </div>
                <div>
                  <Label>Позиція відправника (x, y, ширина, висота в мм)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <Input placeholder="X" defaultValue="20" />
                    <Input placeholder="Y" defaultValue="15" />
                    <Input placeholder="Ширина" defaultValue="80" />
                    <Input placeholder="Висота" defaultValue="30" />
                  </div>
                </div>
                <div>
                  <Label>Позиція отримувача (x, y, ширина, висота в мм)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <Input placeholder="X" defaultValue="120" />
                    <Input placeholder="Y" defaultValue="60" />
                    <Input placeholder="Ширина" defaultValue="80" />
                    <Input placeholder="Висота" defaultValue="40" />
                  </div>
                </div>
                <div>
                  <Label>Позиція реклами (x, y, ширина, висота в мм)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <Input placeholder="X" defaultValue="10" />
                    <Input placeholder="Y" defaultValue="100" />
                    <Input placeholder="Ширина" defaultValue="60" />
                    <Input placeholder="Висота" defaultValue="20" />
                  </div>
                </div>
                <Button className="w-full">Зберегти налаштування</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Створити лист
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Новий лист клієнту</DialogTitle>
              </DialogHeader>
              <form action={handleCreateMail} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientId">Клієнт</Label>
                    <Select name="clientId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть клієнта" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} ({client.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mailType">Тип листа</Label>
                    <Select name="mailType" defaultValue="official">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="official">Офіційний</SelectItem>
                        <SelectItem value="marketing">Маркетинговий</SelectItem>
                        <SelectItem value="notification">Повідомлення</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="subject">Тема листа</Label>
                  <Input name="subject" required />
                </div>
                
                <div>
                  <Label htmlFor="content">Зміст листа</Label>
                  <Textarea name="content" required rows={6} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="senderName">Відправник</Label>
                    <Input name="senderName" required placeholder="ПП 'Регмік'" />
                  </div>
                  <div>
                    <Label htmlFor="recipientName">Отримувач</Label>
                    <Input name="recipientName" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="senderAddress">Адреса відправника</Label>
                    <Textarea name="senderAddress" required rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="recipientAddress">Адреса отримувача</Label>
                    <Textarea name="recipientAddress" required rows={3} />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="advertisementText">Рекламний текст (нижній лівий кут)</Label>
                  <Input name="advertisementText" placeholder="www.regmik.com.ua | +380..." />
                </div>
                
                <div>
                  <Label htmlFor="notes">Примітки</Label>
                  <Textarea name="notes" rows={2} />
                </div>
                
                <Button type="submit" className="w-full" disabled={createMailMutation.isPending}>
                  {createMailMutation.isPending ? "Створення..." : "Створити лист"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="mails" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mails">Листи</TabsTrigger>
          <TabsTrigger value="registry">Реєстр відправлень</TabsTrigger>
        </TabsList>

        <TabsContent value="mails" className="space-y-4">
          {selectedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Груповий друк конвертів</CardTitle>
                <CardDescription>Обрано листів: {selectedItems.length}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="batchName">Назва партії</Label>
                    <Input 
                      id="batchName"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="Наприклад: Маркетингова розсилка листопад 2024"
                    />
                  </div>
                  <Button onClick={handleBatchPrint} disabled={batchPrintMutation.isPending}>
                    <Printer className="h-4 w-4 mr-2" />
                    {batchPrintMutation.isPending ? "Друк..." : "Друкувати конверти"}
                  </Button>
                  <Button variant="outline" onClick={selectAllItems}>
                    Обрати всі чернетки
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === mails.filter(m => m.status === "draft").length && mails.length > 0}
                    onCheckedChange={selectAllItems}
                  />
                </TableHead>
                <TableHead>Клієнт</TableHead>
                <TableHead>Тема</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Конверт</TableHead>
                <TableHead>Дата створення</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingMails ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Завантаження...
                  </TableCell>
                </TableRow>
              ) : mails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Листи не знайдено
                  </TableCell>
                </TableRow>
              ) : (
                mails.map((mail) => (
                  <TableRow key={mail.id}>
                    <TableCell>
                      {mail.status === "draft" && (
                        <Checkbox
                          checked={selectedItems.includes(mail.id)}
                          onCheckedChange={() => toggleSelectItem(mail.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{mail.recipientName}</div>
                        <div className="text-sm text-gray-500">{mail.clientId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{mail.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getMailTypeLabel(mail.mailType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(mail.status)}>
                        {mail.status === "draft" ? "Чернетка" :
                         mail.status === "queued" ? "В черзі" :
                         mail.status === "sent" ? "Відправлено" :
                         mail.status === "delivered" ? "Доставлено" :
                         mail.status === "failed" ? "Помилка" : mail.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {mail.envelopePrinted ? (
                        <Badge className="bg-green-100 text-green-800">Надруковано</Badge>
                      ) : (
                        <Badge variant="outline">Не надруковано</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(mail.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {mail.status === "draft" && (
                          <Button variant="ghost" size="sm">
                            <Printer className="h-4 w-4" />
                          </Button>
                        )}
                        {mail.status === "queued" && (
                          <Button variant="ghost" size="sm">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="registry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Реєстр відправлених листів</CardTitle>
              <CardDescription>Історія партій друку конвертів</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Назва партії</TableHead>
                    <TableHead>Загалом</TableHead>
                    <TableHead>Надруковано</TableHead>
                    <TableHead>Відправлено</TableHead>
                    <TableHead>Доставлено</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата друку</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registry.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Партії не знайдено
                      </TableCell>
                    </TableRow>
                  ) : (
                    registry.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.batchName}</TableCell>
                        <TableCell>{batch.totalCount}</TableCell>
                        <TableCell>{batch.printedCount}</TableCell>
                        <TableCell>{batch.sentCount}</TableCell>
                        <TableCell>{batch.deliveredCount}</TableCell>
                        <TableCell>
                          <Badge className={
                            batch.status === "preparing" ? "bg-gray-100 text-gray-800" :
                            batch.status === "printing" ? "bg-blue-100 text-blue-800" :
                            batch.status === "sending" ? "bg-yellow-100 text-yellow-800" :
                            batch.status === "completed" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }>
                            {batch.status === "preparing" ? "Підготовка" :
                             batch.status === "printing" ? "Друк" :
                             batch.status === "sending" ? "Відправка" :
                             batch.status === "completed" ? "Завершено" : batch.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(batch.printDate)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}