import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Mail, Printer, Send, Eye, FileText, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import EnvelopePrintDialog from "@/components/EnvelopePrintDialog";
import type { ClientMail, InsertClientMail, Client, MailRegistry, EnvelopePrintSettings } from "@shared/schema";

export default function ClientMailPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isGroupPrintDialogOpen, setIsGroupPrintDialogOpen] = useState(false);
  const [isEnvelopePrintDialogOpen, setIsEnvelopePrintDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [batchName, setBatchName] = useState("");
  const [currentBatchMails, setCurrentBatchMails] = useState<ClientMail[]>([]);
  const [groupMailData, setGroupMailData] = useState({
    subject: "",
    content: "",
    mailType: "invoice",
    priority: "normal"
  });
  const [advertisementText, setAdvertisementText] = useState("REGMIK ERP - Ваш надійний партнер у бізнесі! Телефон: +380 XX XXX-XX-XX");
  const [advertisementImage, setAdvertisementImage] = useState<string | null>(null);
  const [adPositions, setAdPositions] = useState<string[]>(["bottom-left"]); // зліва знизу, справа зверху або і там і там
  const [imageRelativePosition, setImageRelativePosition] = useState("left"); // над, під, зліва, зправа від тексту
  const [imageSize, setImageSize] = useState("small");
  const [fontSize, setFontSize] = useState("12");
  const [envelopeSize, setEnvelopeSize] = useState("dl");
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAdvertisementImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getImageSizeValue = () => {
    switch (imageSize) {
      case "small": return "15mm";
      case "medium": return "25mm";
      case "large": return "35mm";
      default: return "15mm";
    }
  };
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

  const groupCreateMutation = useMutation({
    mutationFn: (data: { clientIds: string[], mailData: any, batchName: string }) => 
      apiRequest("/api/client-mail/group-create", "POST", data),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-mail"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mail-registry"] });
      
      // Отримуємо створені листи для друку конвертів
      if (result.mails && result.mails.length > 0) {
        setCurrentBatchMails(result.mails);
        setIsGroupPrintDialogOpen(false);
        setIsEnvelopePrintDialogOpen(true);
      }
      
      setSelectedClients([]);
      setBatchName("");
      setGroupMailData({ subject: "", content: "", mailType: "invoice", priority: "normal" });
      
      toast({ 
        title: "Пакет підготовлено", 
        description: `Створено ${result.count} записів для друку конвертів` 
      });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити пакет", variant: "destructive" });
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
      case "letter": return "Лист";
      case "business": return "Діловий";
      default: return type;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "invoice": return "Рахунки";
      case "waybill": return "Видаткові накладні";
      case "contract": return "Договори";
      case "notice": return "Повідомлення";
      case "statement": return "Звіти/Довідки";
      case "other": return "Інші документи";
      default: return type;
    }
  };

  const formatDate = (date: string | Date | null) => {
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
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Налаштування друку конвертів</DialogTitle>
                <DialogDescription>
                  Налаштуйте параметри друку конвертів згідно українських поштових стандартів
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold mb-4">Основні налаштування</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Розмір конверта</Label>
                        <Select value={envelopeSize} onValueChange={setEnvelopeSize}>
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
                        <Input 
                          type="number" 
                          value={fontSize} 
                          onChange={(e) => setFontSize(e.target.value)}
                          min="8" 
                          max="20" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h3 className="text-lg font-semibold mb-4">Налаштування реклами</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="advertisement-text">Рекламний текст</Label>
                        <Textarea
                          id="advertisement-text"
                          placeholder="Введіть рекламний текст який буде відображатися на конвертах"
                          rows={3}
                          value={advertisementText}
                          onChange={(e) => setAdvertisementText(e.target.value)}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="image-upload">Рекламне зображення</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="flex-1"
                          />
                          {advertisementImage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAdvertisementImage(null)}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {advertisementImage && (
                          <div className="mt-3 p-3 border rounded-lg bg-white">
                            <img 
                              src={advertisementImage} 
                              alt="Попередній перегляд" 
                              className="max-w-32 max-h-32 object-contain border rounded mx-auto block"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label>Позиція реклами на конверті</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="pos-bottom-left"
                              checked={adPositions.includes("bottom-left")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAdPositions([...adPositions, "bottom-left"]);
                                } else {
                                  setAdPositions(adPositions.filter(pos => pos !== "bottom-left"));
                                }
                              }}
                            />
                            <label htmlFor="pos-bottom-left" className="text-sm font-medium">
                              Знизу зліва (під адресою отримувача)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="pos-top-right"
                              checked={adPositions.includes("top-right")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAdPositions([...adPositions, "top-right"]);
                                } else {
                                  setAdPositions(adPositions.filter(pos => pos !== "top-right"));
                                }
                              }}
                            />
                            <label htmlFor="pos-top-right" className="text-sm font-medium">
                              Зверху зправа (біля зони для марки)
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Розташування зображення відносно тексту</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="img-above"
                              name="imageRelative"
                              value="above"
                              checked={imageRelativePosition === "above"}
                              onChange={(e) => setImageRelativePosition(e.target.value)}
                            />
                            <label htmlFor="img-above" className="text-sm font-medium">
                              Над текстом
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="img-below"
                              name="imageRelative"
                              value="below"
                              checked={imageRelativePosition === "below"}
                              onChange={(e) => setImageRelativePosition(e.target.value)}
                            />
                            <label htmlFor="img-below" className="text-sm font-medium">
                              Під текстом
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="img-left"
                              name="imageRelative"
                              value="left"
                              checked={imageRelativePosition === "left"}
                              onChange={(e) => setImageRelativePosition(e.target.value)}
                            />
                            <label htmlFor="img-left" className="text-sm font-medium">
                              Зліва від тексту
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="img-right"
                              name="imageRelative"
                              value="right"
                              checked={imageRelativePosition === "right"}
                              onChange={(e) => setImageRelativePosition(e.target.value)}
                            />
                            <label htmlFor="img-right" className="text-sm font-medium">
                              Зправа від тексту
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="image-size">Розмір зображення</Label>
                        <Select value={imageSize} onValueChange={setImageSize}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Оберіть розмір" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Малий (15мм)</SelectItem>
                            <SelectItem value="medium">Середній (25мм)</SelectItem>
                            <SelectItem value="large">Великий (35мм)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h3 className="text-lg font-semibold mb-4">Позиції на конверті</h3>
                    <div className="space-y-4">
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
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-yellow-50">
                    <h3 className="text-lg font-semibold mb-4">Попередній перегляд конверта</h3>
                    <div className="mt-2 border rounded-lg p-4 bg-gray-50 overflow-hidden">
                      <div className="bg-white border-2 border-black mx-auto" style={{
                        width: envelopeSize === 'dl' ? '220mm' : envelopeSize === 'c4' ? '324mm' : '229mm',
                        height: envelopeSize === 'dl' ? '110mm' : envelopeSize === 'c4' ? '229mm' : '162mm',
                        position: 'relative',
                        fontFamily: 'Times New Roman, serif',
                        transform: 'scale(0.4)',
                        transformOrigin: 'top left',
                        marginBottom: envelopeSize === 'dl' ? '-50mm' : envelopeSize === 'c4' ? '-150mm' : '-100mm'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '8mm',
                          right: '8mm',
                          width: '30mm',
                          height: '25mm',
                          border: '1px dashed #999',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          color: '#999',
                          textAlign: 'center',
                          lineHeight: '1.2'
                        }}>
                          МІСЦЕ<br/>ДЛЯ<br/>МАРКИ
                        </div>
                        <div style={{
                          position: 'absolute',
                          top: '8mm',
                          left: '8mm',
                          fontSize: `${Math.round(parseInt(fontSize) * 0.7)}px`,
                          lineHeight: '1.3',
                          maxWidth: '70mm'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>Від кого:</div>
                          <div>ТОВ "REGMIK"</div>
                          <div>04112, м. Київ</div>
                          <div>вул. Дегтярівська, 27-Т</div>
                        </div>
                        <div style={{
                          position: 'absolute',
                          top: '45mm',
                          left: '60mm',
                          fontSize: `${fontSize}px`,
                          lineHeight: '1.4',
                          maxWidth: '120mm'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '3mm' }}>Кому:</div>
                          <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>Приклад клієнта</div>
                          <div>01001, м. Київ, вул. Прикладна, 1</div>
                        </div>
                        {(advertisementText || advertisementImage) && adPositions.map(position => (
                          <div key={position} style={{
                            position: 'absolute',
                            ...(position === 'top-right' && { top: '8mm', right: '5mm' }),
                            ...(position === 'bottom-left' && { bottom: '5mm', left: '5mm' }),
                            fontSize: '8px',
                            color: '#333',
                            maxWidth: '50mm',
                            display: 'flex',
                            flexDirection: imageRelativePosition === 'above' || imageRelativePosition === 'below' ? 'column' : 'row',
                            alignItems: position.includes('right') ? 'flex-end' : 'flex-start',
                            gap: '3px'
                          }}>
                            {imageRelativePosition === 'above' && advertisementImage && (
                              <img 
                                src={advertisementImage} 
                                alt="Реклама" 
                                style={{
                                  width: getImageSizeValue(),
                                  height: 'auto',
                                  maxHeight: getImageSizeValue()
                                }}
                              />
                            )}
                            {imageRelativePosition === 'left' && advertisementImage && (
                              <img 
                                src={advertisementImage} 
                                alt="Реклама" 
                                style={{
                                  width: getImageSizeValue(),
                                  height: 'auto',
                                  maxHeight: getImageSizeValue(),
                                  marginRight: '3px'
                                }}
                              />
                            )}
                            {advertisementText && (
                              <div style={{
                                textAlign: position.includes('right') ? 'right' : 'left',
                                lineHeight: '1.2'
                              }}>
                                {advertisementText}
                              </div>
                            )}
                            {imageRelativePosition === 'right' && advertisementImage && (
                              <img 
                                src={advertisementImage} 
                                alt="Реклама" 
                                style={{
                                  width: getImageSizeValue(),
                                  height: 'auto',
                                  maxHeight: getImageSizeValue(),
                                  marginLeft: '3px'
                                }}
                              />
                            )}
                            {imageRelativePosition === 'below' && advertisementImage && (
                              <img 
                                src={advertisementImage} 
                                alt="Реклама" 
                                style={{
                                  width: getImageSizeValue(),
                                  height: 'auto',
                                  maxHeight: getImageSizeValue()
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button className="w-full">Зберегти налаштування</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isGroupPrintDialogOpen} onOpenChange={setIsGroupPrintDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Груповий друк конвертів
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Груповий друк конвертів для клієнтів</DialogTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Система надрукує адреси на конвертах та збереже інформацію про вміст для подальшого вкладення документів
                </p>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="batchName">Назва пакета розсилки</Label>
                  <Input 
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Наприклад: Рахунки за лютий 2024, Видаткові накладні №1001-1050"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Тип документів у листах</Label>
                    <Select 
                      value={groupMailData.mailType} 
                      onValueChange={(value) => setGroupMailData(prev => ({ ...prev, mailType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Рахунки</SelectItem>
                        <SelectItem value="waybill">Видаткові накладні</SelectItem>
                        <SelectItem value="contract">Договори</SelectItem>
                        <SelectItem value="notice">Повідомлення</SelectItem>
                        <SelectItem value="statement">Звіти/Довідки</SelectItem>
                        <SelectItem value="other">Інші документи</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Пріоритет доставки</Label>
                    <Select 
                      value={groupMailData.priority} 
                      onValueChange={(value) => setGroupMailData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Звичайна</SelectItem>
                        <SelectItem value="urgent">Термінова</SelectItem>
                        <SelectItem value="registered">Рекомендована</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Опис вмісту листів</Label>
                  <Textarea 
                    value={groupMailData.content}
                    onChange={(e) => setGroupMailData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Детальний опис документів які будуть вкладені в конверти після друку адрес"
                    rows={3}
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Цей опис буде збережений для контролю вмісту, але не друкуватиметься на конвертах
                  </p>
                </div>

                <div>
                  <Label>Вибір клієнтів для розсилки</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {clients.map((client) => (
                        <div key={client.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`client-${client.id}`}
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClients(prev => [...prev, client.id]);
                              } else {
                                setSelectedClients(prev => prev.filter(id => id !== client.id));
                              }
                            }}
                          />
                          <Label htmlFor={`client-${client.id}`} className="flex-1 cursor-pointer">
                            <div>
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-gray-500">
                                {client.fullName} • {client.id}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Вибрано клієнтів: {selectedClients.length}
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsGroupPrintDialogOpen(false)}
                  >
                    Скасувати
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedClients.length > 0 && batchName && groupMailData.mailType && groupMailData.content) {
                        groupCreateMutation.mutate({
                          clientIds: selectedClients,
                          mailData: {
                            subject: `${getDocumentTypeLabel(groupMailData.mailType)} для відправки`,
                            content: groupMailData.content,
                            mailType: groupMailData.mailType,
                            priority: groupMailData.priority
                          },
                          batchName
                        });
                      }
                    }}
                    disabled={groupCreateMutation.isPending || selectedClients.length === 0 || !batchName || !groupMailData.mailType || !groupMailData.content}
                  >
                    {groupCreateMutation.isPending ? "Підготовка..." : `Підготувати ${selectedClients.length} конвертів`}
                  </Button>
                </div>
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
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleCreateMail(formData);
              }} className="space-y-4">
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

      {/* Діалог друку конвертів */}
      <EnvelopePrintDialog
        isOpen={isEnvelopePrintDialogOpen}
        onClose={() => setIsEnvelopePrintDialogOpen(false)}
        mails={currentBatchMails}
        clients={clients}
        batchName={batchName}
      />
    </div>
  );
}