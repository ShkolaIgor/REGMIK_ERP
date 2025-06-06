import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Client, InsertClientMail, ClientMail } from "@shared/schema";
import { Plus, Printer, Users, Trash2, Download, Upload, FileText, Settings2, Move, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type EnvelopeSize = 'c5' | 'c4' | 'dl' | 'c6';
type ImageRelativePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

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

const envelopeSizes: Record<EnvelopeSize, { width: number; height: number; name: string }> = {
  'c5': { width: 229, height: 162, name: 'C5 (229×162мм)' },
  'c4': { width: 324, height: 229, name: 'C4 (324×229мм)' },
  'dl': { width: 220, height: 110, name: 'DL (220×110мм)' },
  'c6': { width: 162, height: 114, name: 'C6 (162×114мм)' }
};

const getDefaultSettings = (size: EnvelopeSize): EnvelopeSettings => ({
  envelopeSize: size,
  settingName: `Налаштування ${envelopeSizes[size].name}`,
  advertisementText: '',
  advertisementImage: null,
  imageSize: 100, // у відсотках
  fontSize: 12,
  senderRecipientFontSize: 10,
  postalIndexFontSize: 12,
  advertisementFontSize: 8,
  senderPosition: { x: 15, y: 10 },
  recipientPosition: { x: 120, y: 50 },
  advertisementPosition: { x: 15, y: 80 },
  imagePosition: { x: 30, y: 25 }
});

export default function ClientMailPage() {
  // State management
  const [selectedMails, setSelectedMails] = useState<number[]>([]);
  const [batchName, setBatchName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEnvelopePrintDialogOpen, setIsEnvelopePrintDialogOpen] = useState(false);
  const [currentBatchMails, setCurrentBatchMails] = useState<Client[]>([]);
  
  // Envelope settings state with localStorage initialization
  const [envelopeSettings, setEnvelopeSettings] = useState<EnvelopeSettings>(() => {
    const saved = localStorage.getItem('envelopeSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved envelope settings:', e);
      }
    }
    return getDefaultSettings('dl');
  });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: envelopeSettingsData } = useQuery({
    queryKey: ['/api/envelope-print-settings'],
  });

  const mailsQuery = useQuery({
    queryKey: ['/api/client-mail'],
  });

  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: mailRegistry } = useQuery({
    queryKey: ['/api/mail-registry'],
  });

  // Load settings from server only once, prioritize localStorage
  useEffect(() => {
    // Check if we have saved settings in localStorage first
    const savedSettings = localStorage.getItem('envelopeSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setEnvelopeSettings(parsed);
        return; // Don't override with server settings if we have local ones
      } catch (e) {
        console.error('Error parsing saved envelope settings:', e);
      }
    }

    // Only use server settings if no localStorage data exists
    if (envelopeSettingsData && Array.isArray(envelopeSettingsData) && envelopeSettingsData.length > 0) {
      const serverSettings = envelopeSettingsData[0];
      const parsedSettings = {
        ...serverSettings,
        senderPosition: typeof serverSettings.senderPosition === 'string' 
          ? JSON.parse(serverSettings.senderPosition) 
          : serverSettings.senderPosition || { x: 15, y: 10 },
        recipientPosition: typeof serverSettings.recipientPosition === 'string' 
          ? JSON.parse(serverSettings.recipientPosition) 
          : serverSettings.recipientPosition || { x: 120, y: 50 },
        advertisementPosition: typeof serverSettings.advertisementPosition === 'string' 
          ? JSON.parse(serverSettings.advertisementPosition) 
          : serverSettings.advertisementPosition || { x: 15, y: 80 },
        imagePosition: typeof serverSettings.imagePosition === 'string' 
          ? JSON.parse(serverSettings.imagePosition) 
          : serverSettings.imagePosition || { x: 30, y: 25 },
        senderRecipientFontSize: Number(serverSettings.senderRecipientFontSize) || 14,
        postalIndexFontSize: Number(serverSettings.postalIndexFontSize) || 18,
        advertisementFontSize: Number(serverSettings.advertisementFontSize) || 11,
        imageSize: Number(serverSettings.imageSize) || 100
      };
      setEnvelopeSettings(parsedSettings);
    }
  }, [envelopeSettingsData]);

  // Auto-save to localStorage when settings change
  useEffect(() => {
    localStorage.setItem('envelopeSettings', JSON.stringify(envelopeSettings));
  }, [envelopeSettings]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: InsertClientMail) => apiRequest("/api/client-mail", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-mail"] });
      toast({ title: "Кореспонденція додана" });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: EnvelopeSettings) => {
      const { id, ...settingsData } = settings;
      // Convert position objects to JSON strings for database storage
      const dataToSend = {
        ...settingsData,
        settingName: settingsData.settingName || `Налаштування ${envelopeSizes[settings.envelopeSize].name}`,
        senderPosition: JSON.stringify(settingsData.senderPosition),
        recipientPosition: JSON.stringify(settingsData.recipientPosition),
        advertisementPosition: JSON.stringify(settingsData.advertisementPosition),
        imagePosition: JSON.stringify(settingsData.imagePosition),
        senderRecipientFontSize: String(settingsData.senderRecipientFontSize),
        postalIndexFontSize: String(settingsData.postalIndexFontSize),
        advertisementFontSize: String(settingsData.advertisementFontSize),
        imageSize: String(settingsData.imageSize)
      };
      
      console.log('Saving settings:', dataToSend);
      
      return apiRequest("/api/envelope-print-settings", { 
        method: id ? "PATCH" : "POST", 
        body: dataToSend 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/envelope-print-settings"] });
      toast({ title: "Налаштування збережено" });
    },
    onError: (error) => {
      console.error('Save settings error:', error);
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    }
  });

  const batchPrintMutation = useMutation({
    mutationFn: async (data: { batchName: string; clientIds: number[]; settings: EnvelopeSettings }) => {
      return apiRequest("/api/envelope-print", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mail-registry"] });
      toast({ title: "Пакетний друк розпочато" });
      setIsEnvelopePrintDialogOpen(false);
      setSelectedMails([]);
    },
    onError: (error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/client-mail/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-mail"] });
      toast({ title: "Кореспонденція видалена" });
    },
    onError: (error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    }
  });

  // Drag and drop handlers
  const handleMouseDown = (elementType: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDraggedElement(elementType);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggedElement) return;

      const previewContainer = document.querySelector('.envelope-preview');
      if (!previewContainer) return;

      const rect = previewContainer.getBoundingClientRect();
      
      // Calculate position relative to envelope container
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      // Convert to mm considering the scale factor (0.85) and CSS pixel to mm conversion
      const scale = 0.85;
      const pixelToMm = 1 / 3.78; // 1mm ≈ 3.78px
      const xMm = (x / scale) * pixelToMm;
      const yMm = (y / scale) * pixelToMm;

      // Get envelope boundaries
      const maxX = envelopeSizes[envelopeSettings.envelopeSize].width;
      const maxY = envelopeSizes[envelopeSettings.envelopeSize].height;

      if (draggedElement === 'sender') {
        setEnvelopeSettings(prev => ({
          ...prev,
          senderPosition: { 
            x: Math.max(5, Math.min(xMm, maxX - 60)), 
            y: Math.max(5, Math.min(yMm, maxY - 30)) 
          }
        }));
      } else if (draggedElement === 'recipient') {
        setEnvelopeSettings(prev => ({
          ...prev,
          recipientPosition: { 
            x: Math.max(5, Math.min(xMm, maxX - 90)), 
            y: Math.max(5, Math.min(yMm, maxY - 40)) 
          }
        }));
      } else if (draggedElement === 'advertisement') {
        setEnvelopeSettings(prev => ({
          ...prev,
          advertisementPosition: { 
            x: Math.max(5, Math.min(xMm, maxX - 80)), 
            y: Math.max(5, Math.min(yMm, maxY - 20)) 
          }
        }));
      } else if (draggedElement === 'image') {
        setEnvelopeSettings(prev => ({
          ...prev,
          imagePosition: { 
            x: Math.max(5, Math.min(xMm, maxX - 30)), 
            y: Math.max(5, Math.min(yMm, maxY - 30)) 
          }
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedElement(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggedElement, dragOffset, envelopeSettings.envelopeSize]);

  // Helper functions
  const mails = mailsQuery.data || [];
  const toggleSelectItem = (id: number) => {
    setSelectedMails(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllItems = () => {
    const allIds = (mails as any[]).map((m: any) => m.id);
    setSelectedMails(selectedMails.length === allIds.length ? [] : allIds);
  };

  const handleBatchPrint = () => {
    const selectedClients = (clients as any[] || []).filter((c: any) => 
      selectedMails.some(mailId => (mails as any[]).find((m: any) => m.id === mailId)?.clientId === c.id)
    );
    setCurrentBatchMails(selectedClients);
    setIsEnvelopePrintDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'printed': return 'bg-blue-100 text-blue-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setEnvelopeSettings(prev => ({ ...prev, advertisementImage: imageData }));
      };
      reader.readAsDataURL(file);
    }
  };

  const { senderRecipientFontSize, postalIndexFontSize, advertisementFontSize } = envelopeSettings;

  // Mail list component
  const MailList = ({ mails }: { mails: Client[] }) => (
    <div className="space-y-2">
      {(mails as any[]).map((mail: any) => (
        <div key={mail.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
          <Checkbox
            checked={selectedMails.includes(mail.id)}
            onCheckedChange={() => toggleSelectItem(mail.id)}
          />
          <div className="flex-1">
            <div className="font-medium">{mail.subject}</div>
            <div className="text-sm text-gray-600">{mail.description}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteMutation.mutate(mail.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Кореспонденція клієнтів
        </h1>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Додати кореспонденцію
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Додати нову кореспонденцію</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Тема</Label>
                  <Input id="subject" placeholder="Введіть тему" />
                </div>
                <div>
                  <Label htmlFor="description">Опис</Label>
                  <Textarea id="description" placeholder="Введіть опис" />
                </div>
                <Button onClick={() => createMutation.mutate({ subject: '', content: '', clientId: '1' })}>
                  Додати
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={handleBatchPrint}
            disabled={selectedMails.length === 0}
          >
            <Printer className="h-4 w-4 mr-2" />
            Друк конвертів ({selectedMails.length})
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsEnvelopePrintDialogOpen(true)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Налаштування конвертів
          </Button>
        </div>
      </div>

      {/* Batch selection controls */}
      <div className="mb-4 flex items-center gap-4">
        <Button variant="outline" onClick={selectAllItems}>
          {selectedMails.length === (mails as any[]).length ? 'Скасувати вибір' : 'Вибрати все'}
        </Button>
        {selectedMails.length > 0 && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Назва пакету"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="w-48"
            />
            <Button 
              onClick={handleBatchPrint}
              disabled={!batchName || batchPrintMutation.isPending}
            >
              Створити пакет
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mail list */}
        <Card>
          <CardHeader>
            <CardTitle>Список кореспонденції</CardTitle>
          </CardHeader>
          <CardContent>
            {mailsQuery.isLoading ? (
              <div>Завантаження...</div>
            ) : (
              <MailList mails={mails as Client[]} />
            )}
          </CardContent>
        </Card>

        {/* Mail registry */}
        <Card>
          <CardHeader>
            <CardTitle>Реєстр відправлень</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(mailRegistry as any[] || []).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{entry.batchName}</div>
                    <div className="text-sm text-gray-600">{entry.createdAt}</div>
                  </div>
                  <Badge className={getStatusColor(entry.status)}>
                    {entry.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Envelope Print Dialog with Horizontal Layout */}
      <Dialog open={isEnvelopePrintDialogOpen} onOpenChange={setIsEnvelopePrintDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Налаштування друку конвертів - {batchName}</DialogTitle>
          </DialogHeader>
          
          {/* Horizontal Layout: Preview Left, Settings Right */}
          <div className="flex gap-6 h-[600px]">
            {/* Preview Section - Left */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4 overflow-hidden">
              <div 
                className="envelope-preview bg-white shadow-lg relative border"
                style={{
                  width: `${envelopeSizes[envelopeSettings.envelopeSize].width}mm`,
                  height: `${envelopeSizes[envelopeSettings.envelopeSize].height}mm`,
                  transform: `scale(${Math.min(
                    280 / envelopeSizes[envelopeSettings.envelopeSize].width,
                    200 / envelopeSizes[envelopeSettings.envelopeSize].height
                  )})`,
                  transformOrigin: 'center'
                }}
              >
                  {/* Stamp area */}
                  <div 
                    className="absolute border-2 border-dashed border-gray-300"
                    style={{
                      top: '5mm',
                      right: '5mm',
                      width: '25mm',
                      height: '15mm'
                    }}
                  >
                    <div className="text-xs text-gray-400 p-1">Марка</div>
                  </div>

                  {/* Sender */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: `${envelopeSettings.senderPosition.y}mm`,
                      left: `${envelopeSettings.senderPosition.x}mm`,
                      fontSize: `${senderRecipientFontSize}px`,
                      lineHeight: '1.4',
                      maxWidth: '90mm',
                      cursor: 'move',
                      padding: '2mm',
                      border: isDragging && draggedElement === 'sender' ? '2px dashed #3b82f6' : '2px dashed transparent',
                      backgroundColor: isDragging && draggedElement === 'sender' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                    }}
                    onMouseDown={(e) => handleMouseDown('sender', e)}
                    title="Натисніть та перетягніть для переміщення"
                  >

                    <div style={{ fontWeight: 'bold' }}>НВФ "РЕГМІК"</div>
                    <div>вул.Гагаріна, 25</div>
                    <div>с.Рівнопілля, Чернігівський район</div>
                    <div>Чернігівська обл.</div>
                    <div>Україна</div>
                    <div style={{ fontSize: `${postalIndexFontSize}px`, fontWeight: 'bold', marginTop: '2mm', letterSpacing: '2px' }}>
                      15582
                    </div>
                  </div>

                  {/* Recipient */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: `${envelopeSettings.recipientPosition.y}mm`,
                      left: `${envelopeSettings.recipientPosition.x}mm`,
                      fontSize: `${senderRecipientFontSize}px`,
                      lineHeight: '1.4',
                      maxWidth: '90mm',
                      cursor: 'move',
                      padding: '2mm',
                      border: isDragging && draggedElement === 'recipient' ? '2px dashed #3b82f6' : '2px dashed transparent',
                      backgroundColor: isDragging && draggedElement === 'recipient' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                    }}
                    onMouseDown={(e) => handleMouseDown('recipient', e)}
                    title="Натисніть та перетягніть для переміщення"
                  >

                    <div style={{ fontWeight: 'bold' }}>ФОП Таранов Руслан Сергійович</div>
                    <div>вул. Промислова, буд. 18, кв. 33, м.</div>
                    <div>Павлоград</div>
                    <div style={{ fontSize: `${postalIndexFontSize}px`, fontWeight: 'bold', marginTop: '3mm', letterSpacing: '3px' }}>
                      51400
                    </div>
                  </div>

                  {/* Advertisement text */}
                  {envelopeSettings.advertisementText && (
                    <div
                      style={{
                        position: 'absolute',
                        top: `${envelopeSettings.advertisementPosition.y}mm`,
                        left: `${envelopeSettings.advertisementPosition.x}mm`,
                        fontSize: `${advertisementFontSize}px`,
                        maxWidth: '80mm',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        cursor: 'move',
                        padding: '1mm',
                        border: isDragging && draggedElement === 'advertisement' ? '2px dashed #3b82f6' : '2px dashed transparent',
                        backgroundColor: isDragging && draggedElement === 'advertisement' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
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
                        top: `${envelopeSettings.imagePosition.y}mm`,
                        left: `${envelopeSettings.imagePosition.x}mm`,
                        cursor: 'move',
                        padding: '1mm',
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
                          width: `${envelopeSettings.imageSize}%`,
                          height: 'auto',
                          maxWidth: '50mm',
                          maxHeight: '50mm',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  )}
              </div>
            </div>

            {/* Settings Section - Right */}
            <div className="w-96 flex flex-col ml-auto">
              <h3 className="text-lg font-semibold mb-3">Налаштування</h3>
              <div className="flex-1 overflow-auto space-y-4">
                <Tabs defaultValue="envelope" className="h-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="envelope">Конверт</TabsTrigger>
                    <TabsTrigger value="advertisement">Реклама</TabsTrigger>
                    <TabsTrigger value="fonts">Шрифти</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="envelope" className="space-y-4">
                    <div>
                      <Label>Розмір конверта</Label>
                      <Select
                        value={envelopeSettings.envelopeSize}
                        onValueChange={(value: EnvelopeSize) => 
                          setEnvelopeSettings(prev => ({ ...prev, envelopeSize: value }))
                        }
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

                  <TabsContent value="advertisement" className="space-y-4">
                    <div>
                      <Label>Текст реклами</Label>
                      <Textarea
                        value={envelopeSettings.advertisementText}
                        onChange={(e) => setEnvelopeSettings(prev => ({ ...prev, advertisementText: e.target.value }))}
                        placeholder="Введіть рекламний текст"
                      />
                    </div>
                    

                    
                    <div>
                      <Label>Зображення реклами</Label>
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Завантажити зображення
                        </Button>
                        {envelopeSettings.advertisementImage && (
                          <div className="flex items-center gap-2">
                            <img 
                              src={envelopeSettings.advertisementImage} 
                              alt="Preview" 
                              className="w-8 h-8 object-cover rounded"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEnvelopeSettings(prev => ({ ...prev, advertisementImage: null }))}
                            >
                              Видалити
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Розмір зображення: {envelopeSettings.imageSize}%</Label>
                      <Input
                        type="range"
                        min="25"
                        max="200"
                        value={envelopeSettings.imageSize}
                        onChange={(e) => setEnvelopeSettings(prev => ({ ...prev, imageSize: Number(e.target.value) }))}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="fonts" className="space-y-4">
                    <div>
                      <Label>Шрифт відправник/отримувач: {senderRecipientFontSize}px</Label>
                      <Input
                        type="range"
                        min="10"
                        max="18"
                        value={senderRecipientFontSize}
                        onChange={(e) => setEnvelopeSettings(prev => ({ ...prev, senderRecipientFontSize: Number(e.target.value) }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Шрифт поштових індексів: {postalIndexFontSize}px</Label>
                      <Input
                        type="range"
                        min="16"
                        max="36"
                        value={postalIndexFontSize}
                        onChange={(e) => setEnvelopeSettings(prev => ({ ...prev, postalIndexFontSize: Number(e.target.value) }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Шрифт тексту реклами: {advertisementFontSize}px</Label>
                      <Input
                        type="range"
                        min="8"
                        max="18"
                        value={advertisementFontSize}
                        onChange={(e) => setEnvelopeSettings(prev => ({ ...prev, advertisementFontSize: Number(e.target.value) }))}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Action buttons */}
              <div className="pt-4 border-t space-y-2">
                <Button 
                  onClick={() => saveSettingsMutation.mutate(envelopeSettings)}
                  disabled={saveSettingsMutation.isPending}
                  className="w-full"
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Зберегти налаштування
                </Button>
                
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
                  Друкувати конверти
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}