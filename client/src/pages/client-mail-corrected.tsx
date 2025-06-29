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
import { Plus, Printer, Users, Mail, Calculator, Clock, Package, Component, Trash2, Download, Upload, FileText, Settings2, Move, Image as ImageIcon, ArrowUpDown, ArrowLeftRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SearchFilters } from "@/components/SearchFilters";

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
  addressMaxWidth?: number;
  advertisementMaxWidth?: number;
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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Фільтровані дані для пошуку

  const [isEnvelopePrintDialogOpen, setIsEnvelopePrintDialogOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  const [batchName, setBatchName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [envelopeBounds, setEnvelopeBounds] = useState<DOMRect | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizedElement, setResizedElement] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
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

  const { data: clientsData } = useQuery({
    queryKey: ["/api/clients/search"]
  });
  
  const clients = Array.isArray(clientsData?.clients) ? clientsData.clients : [];

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
    
    // Get current size based on element type
    let currentWidth = 100;
    if (element === 'advertisement') {
      currentWidth = envelopeSettings.advertisementMaxWidth || getAdvertisementMaxWidth(envelopeSettings.envelopeSize);
    } else if (element === 'image') {
      currentWidth = (envelopeSettings.imageSize / 100) * 130;
    } else if (element === 'sender' || element === 'recipient') {
      currentWidth = envelopeSettings.addressMaxWidth || 230;
    }
    
    setResizeStart({ 
      x: e.clientX, 
      y: e.clientY, 
      width: currentWidth, 
      height: 0 
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && draggedElement && envelopeBounds) {
        handleDragMove(e);
      } else if (isResizing && resizedElement) {
        handleResizeMove(e);
      }
    };

    const handleDragMove = (e: MouseEvent) => {
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

    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !resizedElement) return;
      
      const deltaX = e.clientX - resizeStart.x;
      
      if (resizedElement === 'image') {
        // Для зображення - змінюємо масштаб
        const diagonal = Math.sqrt(deltaX * deltaX + (e.clientY - resizeStart.y) * (e.clientY - resizeStart.y));
        const direction = deltaX > 0 ? 1 : -1;
        const newWidth = Math.max(20, Math.min(200, resizeStart.width + (diagonal * direction * 0.5)));
        const sizePercent = Math.max(10, Math.min(150, (newWidth / 130) * 100));
        setEnvelopeSettings(prev => ({ ...prev, imageSize: sizePercent }));
      } else if (resizedElement === 'advertisement') {
        // Для реклами - змінюємо ширину поля
        const newWidth = Math.max(100, Math.min(350, resizeStart.width + deltaX));
        const maxWidth = getAdvertisementMaxWidth(envelopeSettings.envelopeSize);
        const widthPercent = Math.max(50, Math.min(150, (newWidth / maxWidth) * 100));
        setEnvelopeSettings(prev => ({ 
          ...prev, 
          advertisementMaxWidth: Math.round(maxWidth * (widthPercent / 100))
        }));
      } else if (resizedElement === 'sender' || resizedElement === 'recipient') {
        // Для адрес - змінюємо ширину поля
        const newWidth = Math.max(150, Math.min(300, resizeStart.width + deltaX));
        setEnvelopeSettings(prev => ({ 
          ...prev, 
          addressMaxWidth: Math.round(newWidth)
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedElement(null);
      setEnvelopeBounds(null);
      setIsResizing(false);
      setResizedElement(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggedElement, dragStart, envelopeBounds, isResizing, resizedElement, resizeStart]);

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
  const ENVELOPE_SCALE = 700;
  const baseScale = ENVELOPE_SCALE / envelopeSizes[envelopeSettings.envelopeSize].width;
  const elementScale = baseScale * 0.35; // Ще менший масштаб для елементів

  return (
    <div className="flex-1 overflow-auto">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section  sticky top-0 z-40*/}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                    Кореспонденція клієнтів
                  </h1>
                  <p className="text-gray-500 mt-1">Реєстр відправлених листів Укрпоштою</p>
                </div>
              </div>
          
            <div className="flex items-center space-x-4">
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setIsEnvelopePrintDialogOpen(true)}
              disabled={selectedClients.size === 0}
              variant="outline"
            >
              <Printer className="h-4 w-4 mr-2" />
              Друкувати конверти ({selectedClients.size})
              </Button>
          </div>
        </div>
        </div>
      </header>

      {/* Статистичні картки - Statistics Cards */}
      <main className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього листів</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1"></p>
                  <p className="text-xs text-blue-600">Всього листів</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Package className="w-8 h-8 text-white" />
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
                    <Component className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">Відправлено</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900 mb-1"></p>
                  <p className="text-xs text-emerald-600">постачальникам</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Component className="w-8 h-8 text-white" />
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
                    <p className="text-sm text-purple-700 font-medium">Відправлено</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1"></p>
                  <p className="text-xs text-purple-600">клієнтам</p>
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
                    <Calculator className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Очікують відправлення</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1"></p>
                  <p className="text-xs text-orange-600">Ще не відправлені</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Пошук та фільтри */}
        <div className="w-full py-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
      <SearchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Пошук листів за назвою або описом..."
        filters={[
          {
            key: "status",
            label: "Статус",
            value: statusFilter,
            options: [
              { value: "all", label: "Всі листи" },
              { value: "active", label: "З вкладенням" },
              { value: "draft", label: "Чернетки" }
            ],
            onChange: setStatusFilter
          },
          {
            key: "type",
            label: "Тип",
            value: typeFilter,
            options: [
              { value: "all", label: "Всі типи" },
              { value: "with-include", label: "З вкладенням" },
              { value: "without-include", label: "Без вкладення" }
            ],
            onChange: setTypeFilter
          }
        ]}
      />
                      </div>
                    </CardContent>
                  </Card>
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
        <DialogContent className="envelope-dialog w-[1200px] max-w-none max-h-[95vh] overflow-hidden" aria-describedby="envelope-dialog-description" style={{ width: '1200px', maxWidth: 'none' }}>
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
                  width: `${ENVELOPE_SCALE}px`,
                  height: `${(envelopeSizes[envelopeSettings.envelopeSize].height / envelopeSizes[envelopeSettings.envelopeSize].width) * ENVELOPE_SCALE}px`,
                  transformOrigin: 'center',
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
                    maxWidth: `${(envelopeSettings.addressMaxWidth || 230) * elementScale}px`,
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
                  {/* Resize handle for sender */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-5px',
                      right: '-5px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#e5e7eb',
                      border: '1px solid #9ca3af',
                      borderRadius: '2px',
                      cursor: 'ew-resize',
                      zIndex: 1000,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeMouseDown('sender', e);
                    }}
                    title="Перетягніть для зміни ширини поля"
                  />
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
                    maxWidth: `${(envelopeSettings.addressMaxWidth || 230) * elementScale}px`,
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
                  {/* Resize handle for recipient */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-5px',
                      right: '-5px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#e5e7eb',
                      border: '1px solid #9ca3af',
                      borderRadius: '2px',
                      cursor: 'ew-resize',
                      zIndex: 1000,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeMouseDown('recipient', e);
                    }}
                    title="Перетягніть для зміни ширини поля"
                  />
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
                      maxWidth: `${(envelopeSettings.advertisementMaxWidth || getAdvertisementMaxWidth(envelopeSettings.envelopeSize)) * elementScale}px`,
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
                    {/* Resize handle for advertisement */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-5px',
                        right: '-5px',
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#e5e7eb',
                        border: '1px solid #9ca3af',
                        borderRadius: '2px',
                        cursor: 'ew-resize',
                        zIndex: 1000,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleResizeMouseDown('advertisement', e);
                      }}
                      title="Перетягніть для зміни ширини поля"
                    />
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
                    {/* Resize handle for image */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-5px',
                        right: '-5px',
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#e5e7eb',
                        border: '1px solid #9ca3af',
                        borderRadius: '2px',
                        cursor: 'se-resize',
                        zIndex: 1000,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleResizeMouseDown('image', e);
                      }}
                      title="Перетягніть для зміни масштабу зображення"
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
      </main>
      </div>
    </div>
  );
}