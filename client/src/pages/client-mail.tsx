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

const envelopeSizes = {
  c5: { name: 'C5 (162×229мм)', width: 229, height: 162 },
  c4: { name: 'C4 (229×324мм)', width: 324, height: 229 },
  dl: { name: 'DL (110×220мм)', width: 220, height: 110 },
  c6: { name: 'C6 (114×162мм)', width: 162, height: 114 }
};

const getDefaultSettings = (size: EnvelopeSize): EnvelopeSettings => ({
  envelopeSize: size,
  advertisementText: '',
  advertisementImage: null,
  imageSize: 100,
  fontSize: 14,
  senderRecipientFontSize: 12,
  postalIndexFontSize: 24,
  advertisementFontSize: 12,
  senderPosition: { x: 10, y: 10 },
  recipientPosition: { x: 30, y: 100 },
  advertisementPosition: { x: 20, y: 160 },
  imagePosition: { x: 120, y: 10 }
});

export default function ClientMailPage() {
  const [newClientMail, setNewClientMail] = useState<InsertClientMail>({
    clientId: "0",
    subject: '',
    content: '',
    status: 'draft'
  });

  const [envelopeSettings, setEnvelopeSettings] = useState<EnvelopeSettings>(() => {
    const saved = localStorage.getItem('envelopeSettings');
    return saved ? JSON.parse(saved) : getDefaultSettings('dl');
  });

  const [isEnvelopePrintDialogOpen, setIsEnvelopePrintDialogOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  const [batchName, setBatchName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Auto-save settings to localStorage
  useEffect(() => {
    localStorage.setItem('envelopeSettings', JSON.stringify(envelopeSettings));
  }, [envelopeSettings]);

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

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: EnvelopeSettings) => {
      return apiRequest("/api/envelope-settings", { method: "POST", body: settings });
    },
    onSuccess: () => {
      toast({ title: "Налаштування збережено!" });
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
    setIsDragging(true);
    setDraggedElement(element);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggedElement) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const mmDeltaX = deltaX * 0.264583; // px to mm
      const mmDeltaY = deltaY * 0.264583;

      setEnvelopeSettings(prev => {
        const currentPosition = prev[`${draggedElement}Position` as keyof EnvelopeSettings] as { x: number; y: number };
        return {
          ...prev,
          [`${draggedElement}Position`]: {
            x: Math.max(0, currentPosition.x + mmDeltaX),
            y: Math.max(0, currentPosition.y + mmDeltaY)
          }
        };
      });

      setDragStart({ x: e.clientX, y: e.clientY });
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
  }, [isDragging, draggedElement, dragStart]);

  const currentBatchMails = Array.from(selectedClients).map(clientId => 
    clients.find(c => c.id.toString() === clientId.toString())
  ).filter(Boolean) as Client[];

  const { senderRecipientFontSize, postalIndexFontSize, advertisementFontSize } = envelopeSettings;

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
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {clients.map(client => (
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
          </CardContent>
        </Card>
      </div>

      {/* Envelope Print Dialog with Vertical Layout */}
      <Dialog open={isEnvelopePrintDialogOpen} onOpenChange={setIsEnvelopePrintDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden" aria-describedby="envelope-dialog-description">
          <DialogHeader>
            <DialogTitle>Налаштування друку конвертів - {batchName}</DialogTitle>
            <div id="envelope-dialog-description" className="sr-only">
              Діалог для налаштування параметрів друку конвертів з попереднім переглядом
            </div>
          </DialogHeader>
          
          {/* Horizontal Layout: Preview Left, Settings Right */}
          <div className="flex gap-4 h-[650px]">
            {/* Preview Section - Left */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4 overflow-hidden">
              <div 
                className="envelope-preview bg-white shadow-lg relative border"
                style={{
                  width: `${envelopeSizes[envelopeSettings.envelopeSize].width}mm`,
                  height: `${envelopeSizes[envelopeSettings.envelopeSize].height}mm`,
                  transform: `scale(${Math.min(
                    500 / envelopeSizes[envelopeSettings.envelopeSize].width,
                    550 / envelopeSizes[envelopeSettings.envelopeSize].height
                  ) * 0.7})`,
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
            <div className="w-80 flex flex-col flex-shrink-0">
              <h3 className="text-lg font-semibold mb-3">Налаштування</h3>
              <div className="flex-1 overflow-auto space-y-4">
                <Tabs defaultValue="envelope" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="envelope">Конверт</TabsTrigger>
                    <TabsTrigger value="advertisement">Реклама</TabsTrigger>
                    <TabsTrigger value="fonts">Шрифти</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="envelope" className="space-y-4 mt-4">
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

                  <TabsContent value="advertisement" className="space-y-4 mt-4">
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
                          type="file"
                          accept="image/*"
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
                        {envelopeSettings.advertisementImage && (
                          <div className="relative inline-block">
                            <img 
                              src={envelopeSettings.advertisementImage} 
                              alt="Реклама" 
                              className="w-20 h-20 object-contain border rounded"
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

                  <TabsContent value="fonts" className="space-y-4 mt-4">
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
                  variant="outline" 
                  onClick={() => setIsEnvelopePrintDialogOpen(false)}
                  className="w-full"
                >
                  Закрити
                </Button>
                <Button 
                  onClick={() => saveSettingsMutation.mutate(envelopeSettings)}
                  disabled={saveSettingsMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {saveSettingsMutation.isPending ? 'Збереження...' : 'Зберегти'}
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