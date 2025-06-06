import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Printer, Users } from "lucide-react";
import type { Client, ClientMail, InsertClientMail } from "@shared/schema";

type EnvelopeSize = 'c6' | 'dl' | 'c5' | 'c4';

interface EnvelopeSettings {
  envelopeSize: EnvelopeSize;
  senderPosition: { x: number; y: number };
  recipientPosition: { x: number; y: number };
  advertisementPosition: { x: number; y: number };
  imagePosition: { x: number; y: number };
  advertisementText: string;
  advertisementImage: string | null;
  imageSize: number;
  fontSize: number;
  senderRecipientFontSize: number;
  postalIndexFontSize: number;
  advertisementFontSize: number;
  senderWidth?: number;
  recipientWidth?: number;
  advertisementWidth?: number;
}

const envelopeSizes = {
  c6: { name: 'C6 (114×162 мм)', width: 114, height: 162 },
  dl: { name: 'DL (110×220 мм)', width: 110, height: 220 },
  c5: { name: 'C5 (162×229 мм)', width: 162, height: 229 },
  c4: { name: 'C4 (229×324 мм)', width: 229, height: 324 }
};

const getDefaultSettings = (size: EnvelopeSize): EnvelopeSettings => {
  const positions = {
    c6: {
      senderPosition: { x: 8, y: 6 },
      recipientPosition: { x: 20, y: 45 },
      advertisementPosition: { x: 15, y: 70 },
      imagePosition: { x: 80, y: 6 }
    },
    dl: {
      senderPosition: { x: 10, y: 8 },
      recipientPosition: { x: 25, y: 55 },
      advertisementPosition: { x: 15, y: 75 },
      imagePosition: { x: 120, y: 8 }
    },
    c5: {
      senderPosition: { x: 12, y: 10 },
      recipientPosition: { x: 30, y: 100 },
      advertisementPosition: { x: 20, y: 140 },
      imagePosition: { x: 120, y: 10 }
    },
    c4: {
      senderPosition: { x: 15, y: 15 },
      recipientPosition: { x: 40, y: 120 },
      advertisementPosition: { x: 30, y: 180 },
      imagePosition: { x: 160, y: 15 }
    }
  };

  return {
    envelopeSize: size,
    advertisementText: '',
    advertisementImage: null,
    imageSize: 100,
    fontSize: 14,
    senderRecipientFontSize: 12,
    postalIndexFontSize: 24,
    advertisementFontSize: 12,
    senderWidth: 230,
    recipientWidth: 230,
    advertisementWidth: 180,
    ...positions[size]
  };
};

export default function ClientMailPage() {
  const [newClientMail, setNewClientMail] = useState<InsertClientMail>({
    clientId: "0",
    subject: '',
    content: '',
    status: 'draft'
  });

  const [envelopeSettings, setEnvelopeSettings] = useState<EnvelopeSettings>(() => {
    const saved = localStorage.getItem(`envelopeSettings_dl`);
    return saved ? JSON.parse(saved) : getDefaultSettings('dl');
  });

  const getAdvertisementMaxWidth = (size: EnvelopeSize): number => {
    switch (size) {
      case 'dl':
        return 120;
      case 'c6':
        return 100;
      case 'c5':
        return 180;
      case 'c4':
        return 220;
      default:
        return 200;
    }
  };

  const [isEnvelopePrintDialogOpen, setIsEnvelopePrintDialogOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  const [batchName, setBatchName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [resizedElement, setResizedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 });
  const [envelopeBounds, setEnvelopeBounds] = useState<DOMRect | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const { toast } = useToast();

  // Мутація для збереження налаштувань конвертів в базі даних
  const saveEnvelopeSettingsMutation = useMutation({
    mutationFn: async (settings: EnvelopeSettings) => {
      return await apiRequest('/api/envelope-settings', {
        method: 'PUT',
        body: {
          userId: 'default', // Можна буде пізніше підключити до системи користувачів
          envelopeSize: settings.envelopeSize,
          senderPositionX: settings.senderPosition.x,
          senderPositionY: settings.senderPosition.y,
          senderWidth: settings.senderWidth || 230,
          recipientPositionX: settings.recipientPosition.x,
          recipientPositionY: settings.recipientPosition.y,
          recipientWidth: settings.recipientWidth || 230,
          advertisementPositionX: settings.advertisementPosition.x,
          advertisementPositionY: settings.advertisementPosition.y,
          advertisementWidth: settings.advertisementWidth || 180,
          advertisementText: settings.advertisementText,
          advertisementImage: settings.advertisementImage,
          imagePositionX: settings.imagePosition.x,
          imagePositionY: settings.imagePosition.y,
          imageSize: settings.imageSize,
          fontSize: settings.fontSize,
          senderRecipientFontSize: settings.senderRecipientFontSize,
          postalIndexFontSize: settings.postalIndexFontSize,
          advertisementFontSize: settings.advertisementFontSize
        }
      });
    },
    onError: (error) => {
      console.error('Помилка збереження налаштувань конверта:', error);
    }
  });

  useEffect(() => {
    localStorage.setItem(`envelopeSettings_${envelopeSettings.envelopeSize}`, JSON.stringify(envelopeSettings));
    
    // Автоматично зберігаємо налаштування в базі даних при зміні
    const timeoutId = setTimeout(() => {
      saveEnvelopeSettingsMutation.mutate(envelopeSettings);
    }, 1000); // Затримка 1 секунда для уникнення частих запитів

    return () => clearTimeout(timeoutId);
  }, [envelopeSettings]);

  useEffect(() => {
    const saved = localStorage.getItem(`envelopeSettings_${envelopeSettings.envelopeSize}`);
    if (saved) {
      const savedSettings = JSON.parse(saved);
      if (savedSettings.envelopeSize === envelopeSettings.envelopeSize) {
        setEnvelopeSettings(savedSettings);
      }
    }
  }, [envelopeSettings.envelopeSize]);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"]
  });

  const { data: clientMails = [] } = useQuery<ClientMail[]>({
    queryKey: ["/api/client-mail"]
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertClientMail) => apiRequest("/api/client-mail", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-mail"] });
      setNewClientMail({ clientId: "0", subject: '', content: '', status: 'draft' });
      toast({ title: "Листування створено!" });
    }
  });

  const batchPrintMutation = useMutation({
    mutationFn: async (data: { batchName: string; clientIds: number[]; settings: EnvelopeSettings }) => {
      return apiRequest("/api/client-mail/batch-print", { method: "POST", body: data });
    },
    onSuccess: () => {
      toast({ title: "Партія конвертів готова до друку!" });
      setIsEnvelopePrintDialogOpen(false);
    }
  });

  const handleMouseDown = (element: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const envelopeEl = e.currentTarget.closest('.envelope-preview') as HTMLElement;
    if (envelopeEl) {
      setEnvelopeBounds(envelopeEl.getBoundingClientRect());
    }
    
    setIsDragging(true);
    setDraggedElement(element);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleResizeMouseDown = (element: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizedElement(element);
    
    const currentWidth = element === 'sender' ? (envelopeSettings.senderWidth || 230) : 
                        element === 'recipient' ? (envelopeSettings.recipientWidth || 230) : 
                        (envelopeSettings.advertisementWidth || 180);
    
    setResizeStart({
      x: e.clientX,
      width: currentWidth
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && draggedElement && envelopeBounds) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        const mmDeltaX = deltaX * 0.8;
        const mmDeltaY = deltaY * 0.8;

        const maxY = envelopeSizes[envelopeSettings.envelopeSize].height - 40;
        const maxX = envelopeSizes[envelopeSettings.envelopeSize].width - 50;

        setEnvelopeSettings(prev => {
          const currentPosition = prev[`${draggedElement}Position` as keyof EnvelopeSettings] as { x: number; y: number };
          
          const newX = Math.max(5, Math.min(maxX, currentPosition.x + mmDeltaX));
          const newY = Math.max(5, Math.min(maxY, currentPosition.y + mmDeltaY));

          return {
            ...prev,
            [`${draggedElement}Position`]: { x: newX, y: newY }
          };
        });

        setDragStart({ x: e.clientX, y: e.clientY });
      }

      if (isResizing && resizedElement) {
        const deltaX = e.clientX - resizeStart.x;
        const newWidth = Math.max(50, Math.min(300, resizeStart.width + deltaX * 0.5));

        setEnvelopeSettings(prev => ({
          ...prev,
          [`${resizedElement}Width`]: newWidth
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setDraggedElement(null);
      setResizedElement(null);
      setEnvelopeBounds(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, draggedElement, resizedElement, dragStart, resizeStart, envelopeBounds, envelopeSettings]);

  const filteredClients = clients.filter(client => {
    if (!clientSearchQuery) return true;
    
    const query = clientSearchQuery.toLowerCase();
    const name = client.name?.toLowerCase() || '';
    const fullName = client.fullName?.toLowerCase() || '';
    const id = client.id?.toLowerCase() || '';
    
    return name.includes(query) || 
           fullName.includes(query) || 
           id.includes(query);
  });

  const currentBatchMails = Array.from(selectedClients).map(clientId => 
    clients.find(c => c.id.toString() === clientId.toString())
  ).filter(Boolean) as Client[];

  const { senderRecipientFontSize, postalIndexFontSize, advertisementFontSize } = envelopeSettings;
  
  const ENVELOPE_SCALE = 550;
  const baseScale = ENVELOPE_SCALE / envelopeSizes[envelopeSettings.envelopeSize].width;
  const elementScale = baseScale * 0.35;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Кореспонденція клієнтів</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsEnvelopePrintDialogOpen(true)}
            disabled={selectedClients.size === 0}
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            Друкувати конверти ({selectedClients.size})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Створити нове повідомлення
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="client">Клієнт</Label>
                <Select 
                  value={newClientMail.clientId} 
                  onValueChange={(value) => setNewClientMail(prev => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Виберіть клієнта" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subject">Тема</Label>
                <Input
                  id="subject"
                  value={newClientMail.subject}
                  onChange={(e) => setNewClientMail(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Введіть тему повідомлення"
                />
              </div>
              
              <div>
                <Label htmlFor="content">Зміст повідомлення</Label>
                <Textarea
                  id="content"
                  value={newClientMail.content}
                  onChange={(e) => setNewClientMail(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Введіть текст повідомлення"
                  rows={6}
                />
              </div>
              
              <Button 
                onClick={() => createMutation.mutate(newClientMail)}
                disabled={!newClientMail.clientId || newClientMail.clientId === "0" || !newClientMail.subject}
              >
                Створити повідомлення
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Вибір клієнтів для друку
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Пошук клієнтів</Label>
                <Input
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  placeholder="Пошук за назвою, ЄДРПОУ або ІПН..."
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredClients.map(client => (
                <div key={client.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`client-${client.id}`}
                    checked={selectedClients.has(parseInt(client.id.toString()))}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedClients);
                      if (checked) {
                        newSelected.add(parseInt(client.id.toString()));
                      } else {
                        newSelected.delete(parseInt(client.id.toString()));
                      }
                      setSelectedClients(newSelected);
                    }}
                  />
                  <label htmlFor={`client-${client.id}`} className="text-sm font-medium">
                    {client.name}
                  </label>
                </div>
              ))}
            </div>

            {selectedClients.size > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Назва партії</Label>
                <Input
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Введіть назву партії"
                />
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEnvelopePrintDialogOpen} onOpenChange={setIsEnvelopePrintDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden" aria-describedby="envelope-dialog-description">
          <DialogHeader>
            <DialogTitle>Налаштування друку конвертів - {batchName}</DialogTitle>
            <div id="envelope-dialog-description" className="sr-only">
              Діалог для налаштування параметрів друку конвертів з попереднім переглядом
            </div>
          </DialogHeader>
          
          <div className="flex gap-4 h-[600px]">
            <div className="flex-[2] flex items-center justify-center bg-gray-50 rounded-lg p-4 overflow-hidden">
              <div 
                className="envelope-preview bg-white shadow-lg relative border select-none"
                style={{
                  width: 'calc(100vw - 450px)',
                  maxWidth: '800px',
                  minWidth: '500px',
                  height: `${(envelopeSizes[envelopeSettings.envelopeSize].height / envelopeSizes[envelopeSettings.envelopeSize].width) * Math.min(800, window.innerWidth - 450)}px`,
                  transformOrigin: 'center',
                  maxHeight: '100%',
                  overflow: 'visible',
                  fontFamily: 'sans-serif, Ubuntu, Arial'
                }}
              >
                <div 
                  style={{
                    position: 'absolute',
                    top: `${(envelopeSettings.senderPosition.y / envelopeSizes[envelopeSettings.envelopeSize].height) * ((envelopeSizes[envelopeSettings.envelopeSize].height / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE)}px`,
                    left: `${(envelopeSettings.senderPosition.x / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE}px`,
                    fontSize: `${senderRecipientFontSize * elementScale}px`,
                    fontFamily: 'sans-serif, Ubuntu, Arial',
                    lineHeight: '1.4',
                    maxWidth: `${(envelopeSettings.senderWidth || 230) * elementScale}px`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    padding: `${5 * elementScale}px`,
                    border: isDragging && draggedElement === 'sender' ? '2px dashed #3b82f6' : '2px dashed transparent',
                    backgroundColor: isDragging && draggedElement === 'sender' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => handleMouseDown('sender', e)}
                  title="Натисніть та перетягніть для переміщення"
                >
                  <div style={{ fontWeight: 'bold' }}>НВФ "РЕГМІК"</div>
                  <div>02000, м. Київ,</div>
                  <div>пр. Степана Бандери, 20, кв. 32</div>
                  <div>Україна</div>
                  <div style={{ fontSize: `${postalIndexFontSize * elementScale}px`, fontWeight: 'bold', marginTop: `${2 * elementScale}px`, letterSpacing: `${2 * elementScale}px` }}>
                    15582
                  </div>
                  <div 
                    className="resize-handle"
                    style={{
                      position: 'absolute',
                      right: '0',
                      bottom: '0',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#3b82f6',
                      cursor: 'ew-resize',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeMouseDown('sender', e)}
                  />
                </div>

                <div 
                  style={{
                    position: 'absolute',
                    top: `${(envelopeSettings.recipientPosition.y / envelopeSizes[envelopeSettings.envelopeSize].height) * ((envelopeSizes[envelopeSettings.envelopeSize].height / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE)}px`,
                    left: `${(envelopeSettings.recipientPosition.x / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE}px`,
                    fontSize: `${senderRecipientFontSize * elementScale}px`,
                    fontFamily: 'sans-serif, Ubuntu, Arial',
                    lineHeight: '1.4',
                    maxWidth: `${(envelopeSettings.recipientWidth || 230) * elementScale}px`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    padding: `${5 * elementScale}px`,
                    border: isDragging && draggedElement === 'recipient' ? '2px dashed #3b82f6' : '2px dashed transparent',
                    backgroundColor: isDragging && draggedElement === 'recipient' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => handleMouseDown('recipient', e)}
                  title="Натисніть та перетягніть для переміщення"
                >
                  <div style={{ fontWeight: 'bold' }}>ФОП Таранов Руслан Сергійович</div>
                  <div>вул. Промислова, буд. 18, кв. 33, м.</div>
                  <div>Павлоград</div>
                  <div style={{ fontSize: `${postalIndexFontSize * elementScale}px`, fontWeight: 'bold', marginTop: `${3 * elementScale}px`, letterSpacing: `${3 * elementScale}px` }}>
                    51400
                  </div>
                  <div 
                    className="resize-handle"
                    style={{
                      position: 'absolute',
                      right: '0',
                      bottom: '0',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#3b82f6',
                      cursor: 'ew-resize',
                      opacity: 0.7
                    }}
                    onMouseDown={(e) => handleResizeMouseDown('recipient', e)}
                  />
                </div>

                {envelopeSettings.advertisementText && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${envelopeSettings.advertisementPosition.y * baseScale}px`,
                      left: `${envelopeSettings.advertisementPosition.x * baseScale}px`,
                      fontSize: `${advertisementFontSize * elementScale}px`,
                      fontFamily: 'sans-serif, Ubuntu, Arial',
                      maxWidth: `${(envelopeSettings.advertisementWidth || getAdvertisementMaxWidth(envelopeSettings.envelopeSize)) * elementScale}px`,
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      padding: `${5 * elementScale}px`,
                      border: isDragging && draggedElement === 'advertisement' ? '2px dashed #3b82f6' : '2px dashed transparent',
                      backgroundColor: isDragging && draggedElement === 'advertisement' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      userSelect: 'none'
                    }}
                    onMouseDown={(e) => handleMouseDown('advertisement', e)}
                    title="Натисніть та перетягніть для переміщення"
                  >
                    {envelopeSettings.advertisementText}
                    <div 
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        right: '0',
                        bottom: '0',
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#3b82f6',
                        cursor: 'ew-resize',
                        opacity: 0.7
                      }}
                      onMouseDown={(e) => handleResizeMouseDown('advertisement', e)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="w-80 space-y-4 overflow-y-auto">
              <h3 className="text-lg font-semibold">Налаштування</h3>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Розмір конверта</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={envelopeSettings.envelopeSize} 
                    onValueChange={(value: EnvelopeSize) => 
                      setEnvelopeSettings(getDefaultSettings(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(envelopeSizes).map(([key, size]) => (
                        <SelectItem key={key} value={key}>
                          {size.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Текст реклами</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={envelopeSettings.advertisementText}
                    onChange={(e) => setEnvelopeSettings(prev => ({ ...prev, advertisementText: e.target.value }))}
                    placeholder="Введіть текст реклами"
                    rows={3}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (selectedClients.size > 0 && batchName) {
                      batchPrintMutation.mutate({
                        batchName,
                        clientIds: Array.from(selectedClients),
                        settings: envelopeSettings
                      });
                    }
                  }}
                  disabled={!batchName || selectedClients.size === 0}
                  className="flex-1"
                >
                  Друкувати ({selectedClients.size})
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {clientMails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Історія повідомлень</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientMails.map(mail => (
                <div key={mail.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{mail.subject}</h4>
                    <span className="text-sm text-gray-500">{mail.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{mail.content}</p>
                  <p className="text-xs text-gray-400">
                    Клієнт: {clients.find(c => c.id === mail.clientId)?.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}