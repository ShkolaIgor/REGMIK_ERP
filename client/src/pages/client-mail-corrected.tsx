import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Client, InsertClientMail, ClientMail } from "@shared/schema";
import { Plus, Printer, Users, Trash2, Download, Upload, FileText, Settings2, Move, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type EnvelopeSize = 'c5' | 'c4' | 'dl' | 'c6';

interface EnvelopeSettings {
  id?: number;
  settingName?: string;
  envelopeSize: EnvelopeSize;
  advertisementText: string;
  advertisementImage: string | null;
  imageSize: number;
  fontSize: number;
  senderRecipientFontSize: number;
  postalIndexFontSize: number;
  advertisementFontSize: number;
  senderPosition: { x: number; y: number };
  recipientPosition: { x: number; y: number };
  advertisementPosition: { x: number; y: number };
  imagePosition: { x: number; y: number };
}

const envelopeSizes = {
  c5: { name: 'C5 (229×162мм)', width: 229, height: 162 },
  c4: { name: 'C4 (324×229мм)', width: 324, height: 229 },
  dl: { name: 'DL (220×110мм)', width: 220, height: 110 },
  c6: { name: 'C6 (162×114мм)', width: 162, height: 114 }
};



const getDefaultSettings = (size: EnvelopeSize): EnvelopeSettings => {
  // Різні позиції для різних розмірів конвертів
  const positions = {
    c5: {
      senderPosition: { x: 10, y: 10 },
      recipientPosition: { x: 30, y: 100 },
      advertisementPosition: { x: 20, y: 140 },
      imagePosition: { x: 120, y: 10 }
    },
    c4: {
      senderPosition: { x: 10, y: 10 },
      recipientPosition: { x: 40, y: 120 },
      advertisementPosition: { x: 30, y: 180 },
      imagePosition: { x: 160, y: 10 }
    },
    dl: {
      senderPosition: { x: 10, y: 8 },
      recipientPosition: { x: 25, y: 55 },
      advertisementPosition: { x: 15, y: 75 },
      imagePosition: { x: 120, y: 8 }
    },
    c6: {
      senderPosition: { x: 8, y: 8 },
      recipientPosition: { x: 20, y: 45 },
      advertisementPosition: { x: 12, y: 65 },
      imagePosition: { x: 90, y: 8 }
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
    try {
      const saved = localStorage.getItem(`envelopeSettings_dl`);
      return saved ? JSON.parse(saved) : getDefaultSettings('dl');
    } catch (error) {
      console.warn('localStorage помилка, використовуємо стандартні налаштування');
      return getDefaultSettings('dl');
    }
  });

  // Функція для визначення максимальної ширини реклами залежно від розміру конверта
  const getAdvertisementMaxWidth = (size: EnvelopeSize): number => {
    switch (size) {
      case 'dl':
        return 120; // Менша ширина для DL
      case 'c6':
        return 100; // Найменша ширина для C6
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
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [envelopeBounds, setEnvelopeBounds] = useState<DOMRect | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Auto-save settings to localStorage for each envelope type separately
  useEffect(() => {
    localStorage.setItem(`envelopeSettings_${envelopeSettings.envelopeSize}`, JSON.stringify(envelopeSettings));
  }, [envelopeSettings]);

  // Load settings when envelope type changes
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggedElement || !envelopeBounds) return;
      
      if (e.clientX < envelopeBounds.left || e.clientX > envelopeBounds.right ||
          e.clientY < envelopeBounds.top || e.clientY > envelopeBounds.bottom) {
        return;
      }
      
      e.preventDefault();
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const mmDeltaX = deltaX * 1.2;
      const mmDeltaY = deltaY * 1.2;

      setEnvelopeSettings(prev => {
        const currentPosition = prev[`${draggedElement}Position` as keyof EnvelopeSettings] as { x: number; y: number };
        const envelope = envelopeSizes[prev.envelopeSize];
        
        // Різні обмеження для різних елементів та розмірів конвертів
        let maxX, maxY;
        
        if (draggedElement === 'advertisement') {
          // Для реклами - дозволяємо більше руху по всій площі
          if (prev.envelopeSize === 'dl') {
            maxX = envelope.width - 40; // Менше обмеження для DL
            maxY = envelope.height - 10;
          } else if (prev.envelopeSize === 'c6') {
            maxX = envelope.width - 35; // Менше обмеження для C6
            maxY = envelope.height - 15;
          } else {
            maxX = envelope.width - 30;
            maxY = envelope.height - 20;
          }
        } else if (draggedElement === 'image') {
          // Для зображень - більша свобода руху
          if (prev.envelopeSize === 'dl') {
            maxX = envelope.width - 25;
            maxY = envelope.height - 15;
          } else if (prev.envelopeSize === 'c6') {
            maxX = envelope.width - 20;
            maxY = envelope.height - 20;
          } else {
            maxX = envelope.width - 20;
            maxY = envelope.height - 25;
          }
        } else {
          // Для відправника та одержувача - більша свобода
          maxX = envelope.width - 30;
          maxY = envelope.height - 25;
        }
        
        return {
          ...prev,
          [`${draggedElement}Position`]: {
            x: Math.max(5, Math.min(maxX, currentPosition.x + mmDeltaX)),
            y: Math.max(5, Math.min(maxY, currentPosition.y + mmDeltaY))
          }
        };
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedElement(null);
      setEnvelopeBounds(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggedElement, dragStart, envelopeBounds]);

  // Фільтрація клієнтів за пошуковим запитом
  const filteredClients = clients.filter(client => {
    if (!clientSearchQuery) return true;
    
    const query = clientSearchQuery.toLowerCase();
    const name = client.name?.toLowerCase() || '';
    const fullName = client.fullName?.toLowerCase() || '';
    const id = client.id?.toLowerCase() || ''; // ЄДРПОУ або ІПН
    
    return name.includes(query) || 
           fullName.includes(query) || 
           id.includes(query);
  });

  const currentBatchMails = Array.from(selectedClients).map(clientId => 
    clients.find(c => c.id.toString() === clientId.toString())
  ).filter(Boolean) as Client[];

  const { senderRecipientFontSize, postalIndexFontSize, advertisementFontSize } = envelopeSettings;
  
  // Фіксований масштаб для 550px ширини
  const ENVELOPE_SCALE = 550;
  const baseScale = ENVELOPE_SCALE / envelopeSizes[envelopeSettings.envelopeSize].width;
  const elementScale = baseScale * 0.35; // Ще менший масштаб для елементів

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
              <Plus className="h-5 w-5" />
              Створити листування
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Клієнт</Label>
              <Select
                value={newClientMail.clientId.toString()}
                onValueChange={(value) => setNewClientMail(prev => ({ ...prev, clientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть клієнта" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Тема</Label>
              <Input
                value={newClientMail.subject}
                onChange={(e) => setNewClientMail(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Введіть тему листування"
              />
            </div>

            <div>
              <Label>Зміст</Label>
              <Textarea
                value={newClientMail.content}
                onChange={(e) => setNewClientMail(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Введіть зміст листування"
                rows={4}
              />
            </div>

            <Button
              onClick={() => createMutation.mutate(newClientMail)}
              disabled={createMutation.isPending || newClientMail.clientId === "0"}
              className="w-full"
            >
              {createMutation.isPending ? 'Створення...' : 'Створити листування'}
            </Button>
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

      {/* Envelope Print Dialog */}
      <Dialog open={isEnvelopePrintDialogOpen} onOpenChange={setIsEnvelopePrintDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden" aria-describedby="envelope-dialog-description">
          <DialogHeader>
            <DialogTitle>Налаштування друку конвертів {batchName}</DialogTitle>
            <div id="envelope-dialog-description" className="sr-only">
              Діалог для налаштування параметрів друку конвертів з попереднім переглядом
            </div>
          </DialogHeader>
          
          <div className="flex gap-4 h-[600px]">
            {/* Preview Section - Left */}
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


                {/* Sender */}
                <div 
                  style={{
                    position: 'absolute',
                    top: `${(envelopeSettings.senderPosition.y / envelopeSizes[envelopeSettings.envelopeSize].height) * ((envelopeSizes[envelopeSettings.envelopeSize].height / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE)}px`,
                    left: `${(envelopeSettings.senderPosition.x / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE}px`,
                    fontSize: `${senderRecipientFontSize * elementScale}px`,
                    fontFamily: 'sans-serif, Ubuntu, Arial',
                    lineHeight: '1.4',
                    maxWidth: `${230 * elementScale}px`,
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
                  <div>вул.Гагаріна, 25</div>
                  <div>с.Рівнопілля, Чернігівський район</div>
                  <div>Чернігівська обл.</div>
                  <div>Україна</div>
                  <div style={{ fontSize: `${postalIndexFontSize * elementScale}px`, fontWeight: 'bold', marginTop: `${2 * elementScale}px`, letterSpacing: `${2 * elementScale}px` }}>
                    15582
                  </div>
                </div>

                {/* Recipient */}
                <div 
                  style={{
                    position: 'absolute',
                    top: `${(envelopeSettings.recipientPosition.y / envelopeSizes[envelopeSettings.envelopeSize].height) * ((envelopeSizes[envelopeSettings.envelopeSize].height / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE)}px`,
                    left: `${(envelopeSettings.recipientPosition.x / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE}px`,
                    fontSize: `${senderRecipientFontSize * elementScale}px`,
                    fontFamily: 'sans-serif, Ubuntu, Arial',
                    lineHeight: '1.4',
                    maxWidth: `${230 * elementScale}px`,
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
                </div>

                {/* Advertisement text */}
                {envelopeSettings.advertisementText && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${(envelopeSettings.advertisementPosition.y / envelopeSizes[envelopeSettings.envelopeSize].height) * ((envelopeSizes[envelopeSettings.envelopeSize].height / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE)}px`,
                      left: `${(envelopeSettings.advertisementPosition.x / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE}px`,
                      fontSize: `${advertisementFontSize * elementScale}px`,
                      fontFamily: 'sans-serif, Ubuntu, Arial',
                      maxWidth: `${getAdvertisementMaxWidth(envelopeSettings.envelopeSize) * elementScale}px`,
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
                  </div>
                )}

                {/* Advertisement image */}
                {envelopeSettings.advertisementImage && (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${(envelopeSettings.imagePosition.y / envelopeSizes[envelopeSettings.envelopeSize].height) * ((envelopeSizes[envelopeSettings.envelopeSize].height / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE)}px`,
                      left: `${(envelopeSettings.imagePosition.x / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE}px`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      padding: `${5 * elementScale}px`,
                      border: isDragging && draggedElement === 'image' ? '2px dashed #3b82f6' : '2px dashed transparent',
                      backgroundColor: isDragging && draggedElement === 'image' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                    }}
                    onMouseDown={(e) => handleMouseDown('image', e)}
                    title="Натисніть та перетягніть для переміщення"
                  >
                    <img 
                      src={envelopeSettings.advertisementImage} 
                      alt="Реклама"
                      style={{
                        width: `${(envelopeSettings.imageSize / 100) * 130 * elementScale}px`,
                        height: 'auto',
                        maxWidth: `${130 * elementScale}px`,
                        maxHeight: `${130 * elementScale}px`,
                        objectFit: 'contain',
                        userSelect: 'none',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Settings Section - Right */}
            <div className="w-64 flex flex-col flex-shrink-0">
              <h3 className="text-base font-semibold mb-2">Налаштування</h3>
              <div className="flex-1 overflow-auto space-y-3">
                <Tabs defaultValue="envelope" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="envelope">Конверт</TabsTrigger>
                    <TabsTrigger value="advertisement">Реклама</TabsTrigger>
                    <TabsTrigger value="fonts">Шрифти</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="envelope" className="space-y-3 mt-3">
                    <div>
                      <Label>Розмір конверта</Label>
                      <Select
                        value={envelopeSettings.envelopeSize}
                        onValueChange={(value: EnvelopeSize) => {
                          const saved = localStorage.getItem(`envelopeSettings_${value}`);
                          if (saved) {
                            const savedSettings = JSON.parse(saved);
                            setEnvelopeSettings(savedSettings);
                          } else {
                            setEnvelopeSettings(getDefaultSettings(value));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(envelopeSizes).map(([key, { name }]) => (
                            <SelectItem key={key} value={key}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="advertisement" className="space-y-3 mt-3">
                    <div>
                      <Label>Рекламний текст</Label>
                      <Textarea
                        value={envelopeSettings.advertisementText}
                        onChange={(e) => setEnvelopeSettings(prev => ({ ...prev, advertisementText: e.target.value }))}
                        placeholder="Введіть рекламний текст"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Рекламне зображення</Label>
                      <div className="space-y-2">
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setEnvelopeSettings(prev => ({ 
                                  ...prev, 
                                  advertisementImage: e.target?.result as string 
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        
                        {envelopeSettings.advertisementImage ? (
                          <div className="relative inline-block">
                            <img 
                              src={envelopeSettings.advertisementImage} 
                              alt="Реклама" 
                              className="w-20 h-20 object-contain border rounded cursor-pointer"
                              onClick={() => document.getElementById('image-upload')?.click()}
                              title="Клікніть для зміни зображення"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setEnvelopeSettings(prev => ({ ...prev, advertisementImage: null }))}
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                            onClick={() => document.getElementById('image-upload')?.click()}
                            title="Клікніть для вибору зображення"
                          >
                            <div className="text-center text-xs text-gray-500">
                              <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                              <div>Виберіть зображення</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Розмір зображення (%): {envelopeSettings.imageSize}%</Label>
                      <Slider
                        value={[envelopeSettings.imageSize]}
                        onValueChange={([value]) => setEnvelopeSettings(prev => ({ ...prev, imageSize: value }))}
                        min={25}
                        max={200}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="fonts" className="space-y-3 mt-3">
                    <div>
                      <Label>Розмір шрифту відправника/одержувача: {senderRecipientFontSize}px</Label>
                      <Slider
                        value={[senderRecipientFontSize]}
                        onValueChange={([value]) => setEnvelopeSettings(prev => ({ ...prev, senderRecipientFontSize: value }))}
                        min={10}
                        max={18}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Розмір шрифту поштового індексу: {postalIndexFontSize}px</Label>
                      <Slider
                        value={[postalIndexFontSize]}
                        onValueChange={([value]) => setEnvelopeSettings(prev => ({ ...prev, postalIndexFontSize: value }))}
                        min={16}
                        max={36}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Розмір шрифту реклами: {advertisementFontSize}px</Label>
                      <Slider
                        value={[advertisementFontSize]}
                        onValueChange={([value]) => setEnvelopeSettings(prev => ({ ...prev, advertisementFontSize: value }))}
                        min={8}
                        max={18}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  onClick={() => batchPrintMutation.mutate({ 
                    batchName, 
                    clientIds: currentBatchMails.map(c => parseInt(c.id.toString())), 
                    settings: envelopeSettings 
                  })}
                  disabled={batchPrintMutation.isPending}
                  className="w-full"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Друкувати
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}