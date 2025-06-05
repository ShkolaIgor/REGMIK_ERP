import { useState, useEffect } from "react";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Стани для UI
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isGroupPrintDialogOpen, setIsGroupPrintDialogOpen] = useState(false);
  const [isEnvelopePrintDialogOpen, setIsEnvelopePrintDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [batchName, setBatchName] = useState("");
  const [currentBatchMails, setCurrentBatchMails] = useState<ClientMail[]>([]);

  // Налаштування конверта
  const [envelopeSize, setEnvelopeSize] = useState("dl");
  const [fontSize, setFontSize] = useState("12");
  const [senderRecipientFontSize, setSenderRecipientFontSize] = useState("14");
  const [postalIndexFontSize, setPostalIndexFontSize] = useState("18");
  const [advertisementFontSize, setAdvertisementFontSize] = useState("11");
  const [centerImage, setCenterImage] = useState(false);
  const [advertisementText, setAdvertisementText] = useState("REGMIK ERP - Ваш надійний партнер у бізнесі!");
  const [advertisementImage, setAdvertisementImage] = useState<string | null>(null);
  const [adPositions, setAdPositions] = useState<string[]>(["bottom-left"]);
  const [imageRelativePosition, setImageRelativePosition] = useState("below");
  const [imageSize, setImageSize] = useState("small");

  // Інтерактивні позиції елементів
  const [senderPosition, setSenderPosition] = useState({ x: 20, y: 15 });
  const [recipientPosition, setRecipientPosition] = useState({ x: 120, y: 60 });
  const [adPositionCoords, setAdPositionCoords] = useState({
    'bottom-left': { x: 8, y: 85 },
    'top-right': { x: 160, y: 8 }
  });

  // Стани для перетягування
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  
  // Стани для зміни розмірів шрифтів
  const [isResizing, setIsResizing] = useState(false);
  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [initialFontSize, setInitialFontSize] = useState(0);

  // Дані
  const { data: mails = [] } = useQuery({
    queryKey: ["/api/client-mail"]
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"]
  });

  const { data: mailRegistry = [] } = useQuery({
    queryKey: ["/api/mail-registry"]
  });

  const { data: envelopeSettings = [] } = useQuery({
    queryKey: ["/api/envelope-print-settings"]
  });

  // Завантаження налаштувань для поточного типу конверта
  const loadSettingsForEnvelopeSize = (size: string) => {
    console.log("Шукаємо налаштування для розміру:", size);
    console.log("Доступні налаштування:", envelopeSettings);
    
    const settings = envelopeSettings.find((s: any) => s.envelopeSize === size);
    console.log("Знайдені налаштування:", settings);
    
    if (settings) {
      console.log("Завантажуємо налаштування:", settings);
      setAdvertisementText(settings.advertisementText || "REGMIK ERP - Ваш надійний партнер у бізнесі!");
      setAdvertisementImage(settings.advertisementImage || null);
      setAdPositions(settings.adPositions ? JSON.parse(settings.adPositions) : []);
      setImageRelativePosition(settings.imageRelativePosition || "below");
      setImageSize(settings.imageSize || "small");
      setFontSize(settings.fontSize?.toString() || "12");
      setSenderRecipientFontSize(settings.senderRecipientFontSize?.toString() || "14");
      setPostalIndexFontSize(settings.postalIndexFontSize?.toString() || "18");
      setAdvertisementFontSize(settings.advertisementFontSize?.toString() || "11");
      setCenterImage(settings.centerImage || false);
      setSenderPosition(settings.senderPosition ? JSON.parse(settings.senderPosition) : { x: 20, y: 15 });
      setRecipientPosition(settings.recipientPosition ? JSON.parse(settings.recipientPosition) : { x: 120, y: 60 });
      setAdPositionCoords(settings.adPositionCoords ? JSON.parse(settings.adPositionCoords) : {
        'bottom-left': { x: 8, y: 85 },
        'top-right': { x: 160, y: 8 }
      });
    } else {
      console.log("Налаштування не знайдені, використовуємо значення за замовчуванням");
      // Встановлюємо значення за замовчуванням
      setAdvertisementText("REGMIK ERP - Ваш надійний партнер у бізнесі!");
      setAdvertisementImage(null);
      setAdPositions([]);
      setImageRelativePosition("below");
      setImageSize("small");
      setFontSize("12");
      setCenterImage(false);
      setSenderPosition({ x: 20, y: 15 });
      setRecipientPosition({ x: 120, y: 60 });
      setAdPositionCoords({
        'bottom-left': { x: 8, y: 85 },
        'top-right': { x: 160, y: 8 }
      });
    }
  };



  // Завантаження налаштувань при ініціалізації
  useEffect(() => {
    if (envelopeSettings.length > 0) {
      loadSettingsForEnvelopeSize(envelopeSize);
    }
  }, [envelopeSettings, envelopeSize]);



  // Обробники перетягування
  const handleMouseDown = (elementType: string, event: React.MouseEvent) => {
    setIsDragging(true);
    setDraggedElement(elementType);
    event.preventDefault();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !draggedElement) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = 0.9;
    const pixelsToMm = 3.7795;
    const newX = (event.clientX - rect.left) / scale / pixelsToMm;
    const newY = (event.clientY - rect.top) / scale / pixelsToMm;
    
    const maxWidth = envelopeSize === 'dl' ? 200 : envelopeSize === 'c4' ? 304 : 209;
    const maxHeight = envelopeSize === 'dl' ? 90 : envelopeSize === 'c4' ? 209 : 142;
    
    if (draggedElement === 'sender') {
      setSenderPosition({ 
        x: Math.max(0, Math.min(maxWidth, newX - 10)), 
        y: Math.max(0, Math.min(maxHeight, newY - 5)) 
      });
    } else if (draggedElement === 'recipient') {
      setRecipientPosition({ 
        x: Math.max(0, Math.min(maxWidth, newX - 20)), 
        y: Math.max(0, Math.min(maxHeight, newY - 10)) 
      });
    } else if (draggedElement.startsWith('ad-')) {
      const position = draggedElement.replace('ad-', '') as keyof typeof adPositionCoords;
      setAdPositionCoords(prev => ({
        ...prev,
        [position]: { 
          x: Math.max(0, Math.min(maxWidth, newX - 15)), 
          y: Math.max(0, Math.min(maxHeight, newY - 10)) 
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedElement(null);
    setIsResizing(false);
    setResizingElement(null);
  };

  // Функції для роботи з зображеннями
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

  // Мутації
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

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("🔄 МУТАЦІЯ ПОЧАТОК: Надсилаємо POST запит:", data);
      console.log("🔍 Тип даних:", typeof data);
      console.log("🔍 JSON stringify:", JSON.stringify(data, null, 2));
      
      try {
        // Перевіряємо fetch API безпосередньо
        console.log("🌐 Пряма перевірка fetch до сервера...");
        const response = await fetch("/api/envelope-print-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        console.log("📡 Response status:", response.status);
        console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Response error text:", errorText);
          throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
        }
        
        const result = await response.json();
        console.log("✅ МУТАЦІЯ УСПІХ: Отримали відповідь:", result);
        return result;
      } catch (error) {
        console.error("❌ МУТАЦІЯ ПОМИЛКА:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("🎉 onSuccess викликано з даними:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/envelope-print-settings"] });
      
      // Оновлюємо локальний стан після успішного збереження
      setTimeout(() => {
        loadSettingsForEnvelopeSize(envelopeSize);
      }, 100);
      
      // Примусово оновлюємо стан з нових даних
      if (data && data.length > 0) {
        const latestSettings = data.find((s: any) => s.envelopeSize === envelopeSize);
        if (latestSettings) {
          setFontSize(latestSettings.fontSize?.toString() || "12");
          setImageSize(latestSettings.imageSize || "small");
          setImageRelativePosition(latestSettings.imageRelativePosition || "below");
          setCenterImage(latestSettings.centerImage || false);
        }
      }
      
      toast({ title: `Налаштування для ${envelopeSize.toUpperCase()} збережено` });
    },
    onError: (error) => {
      console.error("💥 onError викликано з помилкою:", error);
      toast({ title: "Помилка", description: "Не вдалося зберегти налаштування", variant: "destructive" });
    },
  });

  const batchPrintMutation = useMutation({
    mutationFn: (data: { mailIds: number[], batchName: string }) =>
      apiRequest("/api/client-mail/batch-print", "POST", data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-mail"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mail-registry"] });
      setIsGroupPrintDialogOpen(false);
      setSelectedItems([]);
      setBatchName("");
      toast({
        title: "Пакет підготовлено",
        description: `Створено ${result.count} записів для друку конвертів`
      });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити пакет", variant: "destructive" });
    },
  });

  // Допоміжні функції
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "queued": return "bg-blue-100 text-blue-800";
      case "sent": return "bg-green-100 text-green-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Листування з клієнтами</h1>
          <p className="text-gray-600">Управління паперовою поштою та друк конвертів</p>
        </div>
        <div className="flex gap-2">
          {/* Діалог налаштувань друку */}
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Налаштування друку
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Налаштування друку конвертів</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-[2fr_1fr] gap-6">
                {/* Ліва колонка - Попередній перегляд */}
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <h3 className="text-lg font-semibold mb-4">Попередній перегляд</h3>
                  <div className="border rounded-lg p-4 bg-gray-50 overflow-auto">
                    <div className="text-sm text-blue-600 mb-4 font-medium text-center">
                      Перетягуйте елементи для зміни розташування
                    </div>
                    <div 
                      className="bg-white border-2 border-black mx-auto cursor-crosshair shadow-lg" 
                      style={{
                        width: envelopeSize === 'dl' ? '220mm' : envelopeSize === 'c4' ? '324mm' : '229mm',
                        height: envelopeSize === 'dl' ? '110mm' : envelopeSize === 'c4' ? '229mm' : '162mm',
                        position: 'relative',
                        fontFamily: 'Arial, sans-serif',
                        transform: 'scale(0.6)',
                        transformOrigin: 'center top',
                        margin: '10px auto',
                        minHeight: '200px'
                      }}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      {/* Область для марки */}
                      <div style={{
                        position: 'absolute',
                        top: '8mm',
                        right: '8mm',
                        width: '30mm',
                        height: '20mm',
                        border: '1px dashed #999',
                        fontSize: '8px',
                        textAlign: 'center',
                        padding: '2mm'
                      }}>
                        МАРКА
                      </div>

                      {/* Відправник */}
                      <div
                        style={{
                          position: 'absolute',
                          top: `${senderPosition.y}mm`,
                          left: `${senderPosition.x}mm`,
                          fontSize: `${senderRecipientFontSize}px`,
                          lineHeight: '1.4',
                          maxWidth: '80mm',
                          cursor: 'move',
                          padding: '2mm',
                          border: isDragging && draggedElement === 'sender' ? '2px dashed #3b82f6' : '2px dashed transparent',
                          backgroundColor: isDragging && draggedElement === 'sender' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                        }}
                        onMouseDown={(e) => handleMouseDown('sender', e)}
                        title="Натисніть та перетягніть для переміщення"
                      >
                        <div style={{ fontSize: '8px', marginBottom: '1mm', color: '#666' }}>Адреса відправника</div>
                        <div style={{ fontWeight: 'bold' }}>ТОВ "РЕГМІК"</div>
                        <div>м. Київ, вул. Промислова, 15</div>
                        <div>+38 (044) 123-45-67</div>
                        <div style={{ fontSize: `${postalIndexFontSize}px`, fontWeight: 'bold', marginTop: '3mm', letterSpacing: '3px' }}>
                          01001
                        </div>
                      </div>

                      {/* Отримувач */}
                      <div
                        style={{
                          position: 'absolute',
                          top: `${recipientPosition.y}mm`,
                          left: `${recipientPosition.x}mm`,
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
                        <div style={{ fontSize: '8px', marginBottom: '1mm', color: '#666' }}>Адреса одержувача, індекс</div>
                        <div style={{ fontWeight: 'bold' }}>ФОП Таранов Руслан Сергійович</div>
                        <div>вул. Промислова, буд. 18, кв. 33, м.</div>
                        <div>Павлоград</div>
                        <div style={{ fontSize: `${postalIndexFontSize}px`, fontWeight: 'bold', marginTop: '3mm', letterSpacing: '3px' }}>
                          51400
                        </div>
                      </div>

                      {/* Реклама */}
                      {adPositions.map(position => (
                        <div
                          key={position}
                          style={{
                            position: 'absolute',
                            top: `${adPositionCoords[position as keyof typeof adPositionCoords].y}mm`,
                            left: `${adPositionCoords[position as keyof typeof adPositionCoords].x}mm`,
                            fontSize: `${advertisementFontSize}px`,
                            maxWidth: position === 'bottom-left' ? '80mm' : '60mm',
                            cursor: 'move',
                            padding: '1mm',
                            border: isDragging && draggedElement === `ad-${position}` ? '2px dashed #3b82f6' : '2px dashed transparent',
                            backgroundColor: isDragging && draggedElement === `ad-${position}` ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                          }}
                          onMouseDown={(e) => handleMouseDown(`ad-${position}`, e)}
                          title="Натисніть та перетягніть для переміщення"
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            flexDirection: imageRelativePosition === 'above' || imageRelativePosition === 'below' ? 'column' : 'row',
                            gap: '3mm'
                          }}>
                            {imageRelativePosition === 'above' && advertisementImage && (
                              <img 
                                src={advertisementImage} 
                                alt="Реклама" 
                                style={{
                                  width: getImageSizeValue(),
                                  height: 'auto',
                                  maxHeight: getImageSizeValue(),
                                  alignSelf: centerImage ? 'center' : 'flex-start'
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
                                  marginRight: '3px',
                                  alignSelf: centerImage ? 'center' : 'flex-start'
                                }}
                              />
                            )}
                            <div 
                              style={{ 
                                flex: 1,
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                hyphens: 'auto',
                                lineHeight: '1.3'
                              }}
                              dangerouslySetInnerHTML={{
                                __html: advertisementText
                                  .replace(/\n/g, '<br/>')
                                  .replace(/(\w{6,})/g, (match) => {
                                    return match.length > 8 ? 
                                      match.replace(/(.{4})/g, '$1&shy;') : 
                                      match;
                                  })
                              }}
                            />
                            {imageRelativePosition === 'right' && advertisementImage && (
                              <img 
                                src={advertisementImage} 
                                alt="Реклама" 
                                style={{
                                  width: getImageSizeValue(),
                                  height: 'auto',
                                  maxHeight: getImageSizeValue(),
                                  marginLeft: '3px',
                                  alignSelf: centerImage ? 'center' : 'flex-start'
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
                                  maxHeight: getImageSizeValue(),
                                  alignSelf: centerImage ? 'center' : 'flex-start'
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Права колонка - Налаштування */}
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold mb-4">Налаштування</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Розмір конверта</Label>
                        <Select value={envelopeSize} onValueChange={(size) => {
                          setEnvelopeSize(size);
                          loadSettingsForEnvelopeSize(size);
                        }}>
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
                        <Label>Відправник/Отримувач (px)</Label>
                        <Input 
                          type="number" 
                          value={senderRecipientFontSize} 
                          onChange={(e) => setSenderRecipientFontSize(e.target.value)}
                          min="8" 
                          max="24" 
                        />
                      </div>
                      <div>
                        <Label>Поштові індекси (px)</Label>
                        <Input 
                          type="number" 
                          value={postalIndexFontSize} 
                          onChange={(e) => setPostalIndexFontSize(e.target.value)}
                          min="8" 
                          max="28" 
                        />
                      </div>
                      <div>
                        <Label>Розмір шрифту реклами (px)</Label>
                        <Input 
                          type="number" 
                          value={advertisementFontSize} 
                          onChange={(e) => setAdvertisementFontSize(e.target.value)}
                          min="6" 
                          max="18" 
                        />
                      </div>

                    </div>
                  </div>

                  {/* Налаштування реклами */}
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h3 className="text-lg font-semibold mb-4">Налаштування реклами</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Текст реклами</Label>
                        <Textarea 
                          value={advertisementText}
                          onChange={(e) => setAdvertisementText(e.target.value)}
                          placeholder="Введіть рекламний текст"
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="centerImage" 
                          checked={centerImage} 
                          onCheckedChange={setCenterImage}
                        />
                        <Label htmlFor="centerImage">Центрувати зображення</Label>
                      </div>
                      <div>
                        <Label>Зображення реклами</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
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
                      <div>
                        <Label>Розташування зображення відносно тексту</Label>
                        <Select value={imageRelativePosition} onValueChange={setImageRelativePosition}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="above">Над текстом</SelectItem>
                            <SelectItem value="below">Під текстом</SelectItem>
                            <SelectItem value="left">Зліва від тексту</SelectItem>
                            <SelectItem value="right">Зправа від тексту</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Розмір зображення</Label>
                        <Select value={imageSize} onValueChange={setImageSize}>
                          <SelectTrigger>
                            <SelectValue />
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
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => {
                    const settingsData = {
                      settingName: `Налаштування для ${envelopeSize.toUpperCase()}`,
                      envelopeSize,
                      senderName: "ТОВ \"РЕГМІК\"",
                      senderAddress: "м. Київ, вул. Промислова, 15",
                      senderPhone: "+38 (044) 123-45-67",
                      advertisementText,
                      advertisementImage,
                      adPositions: JSON.stringify(adPositions),
                      imageRelativePosition,
                      imageSize,
                      fontSize,
                      senderRecipientFontSize,
                      postalIndexFontSize,
                      advertisementFontSize,
                      centerImage,
                      senderPosition: JSON.stringify(senderPosition),
                      recipientPosition: JSON.stringify(recipientPosition),
                      adPositionCoords: JSON.stringify(adPositionCoords)
                    };
                    saveSettingsMutation.mutate(settingsData);
                  }}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? "Збереження..." : "Зберегти налаштування"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Створити повідомлення
          </Button>
        </div>

        {isCreateDialogOpen && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Створити повідомлення</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="recipientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип отримувача</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Всі клієнти</SelectItem>
                          <SelectItem value="selected">Обрані клієнти</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {form.watch('recipientType') === 'selected' && (
                  <FormField
                    control={form.control}
                    name="selectedClients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Обрані клієнти</FormLabel>
                        <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                          {clients?.map((client: any) => (
                            <div key={client.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(client.id) || false}
                                onCheckedChange={(checked) => {
                                  const currentIds = field.value || [];
                                  if (checked && checked !== 'indeterminate') {
                                    field.onChange([...currentIds, client.id]);
                                  } else {
                                    field.onChange(currentIds.filter((id: number) => id !== client.id));
                                  }
                                }}
                              />
                              <span className="text-sm">{client.name}</span>
                            </div>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тема</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Зміст повідомлення</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={5} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пріоритет</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Низький</SelectItem>
                          <SelectItem value="medium">Середній</SelectItem>
                          <SelectItem value="high">Високий</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Скасувати
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Створення..." : "Створити"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Поштові повідомлення
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(mails as any[])?.filter((m: any) => !m.deleted).map((mail: any) => (
                  <div key={mail.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{mail.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          {mail.recipientType === 'all' ? 'Всі клієнти' : `${mail.recipientCount} клієнтів`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          mail.priority === 'high' ? 'destructive' : 
                          mail.priority === 'medium' ? 'default' : 
                          'secondary'
                        }>
                          {mail.priority === 'high' ? 'Високий' : 
                           mail.priority === 'medium' ? 'Середній' : 'Низький'}
                        </Badge>
                        <Badge variant={
                          mail.status === 'sent' ? 'default' : 
                          mail.status === 'draft' ? 'secondary' : 
                          'destructive'
                        }>
                          {mail.status === 'sent' ? 'Відправлено' : 
                           mail.status === 'draft' ? 'Чернетка' : 'Помилка'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(mail.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm mb-2">{mail.content}</p>
                    <p className="text-xs text-muted-foreground">
                      Створено: {new Date(mail.createdAt).toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Клієнти для розсилки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(clients as any[])?.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">{c.email}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {c.address}, {c.city}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Реєстр поштових відправлень
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(mailRegistry as any[])?.map((entry: any) => (
                  <div key={entry.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <span className="font-medium">{entry.recipientName}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {entry.mailType} - {entry.trackingNumber}
                      </span>
                    </div>
                    <div className="text-sm">
                      <Badge variant={entry.status === 'delivered' ? 'default' : 'secondary'}>
                        {entry.status === 'delivered' ? 'Доставлено' : 'В дорозі'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Поштові повідомлення</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSelectedMails([])}>
            Очистити вибір
          </Button>
          <Button variant="outline" disabled={selectedMails.length === 0}>
            Груповий друк ({selectedMails.length})
          </Button>
        </div>
      </div>

      {mailsQuery.isLoading ? (
        <div>Завантаження...</div>
      ) : (
        <MailList mails={mails as Client[]} />
      )}
                        top: '8mm',
                        right: '8mm',
                        width: '30mm',
                        height: '25mm',
                        border: '2px dashed #3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#3b82f6',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        lineHeight: '1.2'
                      }}>
                        МІСЦЕ<br/>ДЛЯ<br/>МАРКИ
                      </div>

                      {/* Відправник */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: `${senderPosition.y}mm`,
                          left: `${senderPosition.x}mm`,
                          fontSize: `${senderRecipientFontSize}px`,
                          lineHeight: '1.3',
                          maxWidth: '70mm',
                          cursor: 'move',
                          padding: '2mm',
                          border: isDragging && draggedElement === 'sender' ? '2px dashed #3b82f6' : '2px dashed transparent',
                          backgroundColor: isDragging && draggedElement === 'sender' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                        }}
                        onMouseDown={(e) => handleMouseDown('sender', e)}
                        title="Натисніть та перетягніть для переміщення"
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '8px', marginBottom: '1mm', color: '#666' }}>Адреса відправника, індекс</div>
                        <div style={{ fontWeight: 'bold' }}>НВФ "РЕГМІК"</div>
                        <div>вул.Гагаріна, 25</div>
                        <div>с.Рівнопілля, Чернігівський район</div>
                        <div>Чернігівська обл.</div>
                        <div>Україна</div>
                        <div style={{ fontSize: `${postalIndexFontSize}px`, fontWeight: 'bold', marginTop: '2mm', letterSpacing: '2px' }}>
                          15582
                        </div>
                      </div>

                      {/* Отримувач */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: `${recipientPosition.y}mm`,
                          left: `${recipientPosition.x}mm`,
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
                        <div style={{ fontSize: '8px', marginBottom: '1mm', color: '#666' }}>Адреса одержувача, індекс</div>
                        <div style={{ fontWeight: 'bold' }}>ФОП Таранов Руслан Сергійович</div>
                        <div>вул. Промислова, буд. 18, кв. 33, м.</div>
                        <div>Павлоград</div>
                        <div style={{ fontSize: `${postalIndexFontSize}px`, fontWeight: 'bold', marginTop: '3mm', letterSpacing: '3px' }}>
                          51400
                        </div>
                      </div>

                      {/* Реклама */}
                      {adPositions.map(position => (
                        <div
                          key={position}
                          style={{
                            position: 'absolute',
                            top: `${adPositionCoords[position as keyof typeof adPositionCoords].y}mm`,
                            left: `${adPositionCoords[position as keyof typeof adPositionCoords].x}mm`,
                            fontSize: `${advertisementFontSize}px`,
                            maxWidth: position === 'bottom-left' ? '80mm' : '60mm',
                            cursor: 'move',
                            padding: '1mm',
                            border: isDragging && draggedElement === `ad-${position}` ? '2px dashed #3b82f6' : '2px dashed transparent',
                            backgroundColor: isDragging && draggedElement === `ad-${position}` ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                          }}
                          onMouseDown={(e) => handleMouseDown(`ad-${position}`, e)}
                          title="Натисніть та перетягніть для переміщення"
                        >
                          <div style={{
                            display: 'flex',
                            flexDirection: imageRelativePosition === 'above' || imageRelativePosition === 'below' ? 'column' : 'row',
                            alignItems: centerImage ? 'center' : 'flex-start',
                            gap: '2mm'
                          }}>
                            {imageRelativePosition === 'above' && advertisementImage && (
                              <img 
                                src={advertisementImage} 
                                alt="Реклама" 
                                style={{
                                  width: getImageSizeValue(),
                                  height: 'auto',
                                  maxHeight: getImageSizeValue(),
                                  alignSelf: centerImage ? 'center' : 'flex-start'
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
                                  marginRight: '3px',
                                  alignSelf: centerImage ? 'center' : 'flex-start'
                                }}
                              />
                            )}
                            <div 
                              style={{ 
                                flex: 1,
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                hyphens: 'auto',
                                lineHeight: '1.3'
                              }}
                              dangerouslySetInnerHTML={{
                                __html: advertisementText
                                  .replace(/\n/g, '<br/>')
                                  .replace(/(\w{6,})/g, (match) => {
                                    // Додаємо м'які переноси для довгих слів
                                    return match.length > 8 ? 
                                      match.replace(/(.{4})/g, '$1&shy;') : 
                                      match;
                                  })
                              }}
                            />
                            {imageRelativePosition === 'right' && advertisementImage && (
                              <img 
                                src={advertisementImage} 
                                alt="Реклама" 
                                style={{
                                  width: getImageSizeValue(),
                                  height: 'auto',
                                  maxHeight: getImageSizeValue(),
                                  marginLeft: '3px',
                                  alignSelf: centerImage ? 'center' : 'flex-start'
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
                                  maxHeight: getImageSizeValue(),
                                  alignSelf: centerImage ? 'center' : 'flex-start'
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => {
                    const settingsData = {
                      settingName: `Налаштування для ${envelopeSize.toUpperCase()}`,
                      envelopeSize,
                      senderName: "ТОВ \"РЕГМІК\"",
                      senderAddress: "м. Київ, вул. Промислова, 15",
                      senderPhone: "+38 (044) 123-45-67",
                      advertisementText,
                      advertisementImage,
                      adPositions: JSON.stringify(adPositions),
                      imageRelativePosition,
                      imageSize,
                      fontSize,
                      senderRecipientFontSize,
                      postalIndexFontSize,
                      advertisementFontSize,
                      centerImage,
                      senderPosition: JSON.stringify(senderPosition),
                      recipientPosition: JSON.stringify(recipientPosition),
                      adPositionCoords: JSON.stringify(adPositionCoords)
                    };
                    saveSettingsMutation.mutate(settingsData);
                  }}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? "Збереження..." : "Зберегти налаштування"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Новий лист
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mails" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mails">Листи</TabsTrigger>
          <TabsTrigger value="registry">Реєстр надсилань</TabsTrigger>
        </TabsList>

        <TabsContent value="mails" className="space-y-4">
          {/* Групові дії */}
          {selectedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Групові дії ({selectedItems.length} обрано)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="batchName">Назва партії для друку</Label>
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
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAllItems();
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Клієнт</TableHead>
                <TableHead>Тема</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата створення</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mails.map((mail) => (
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
                    {clients.find(c => c.id === mail.clientId)?.name || mail.clientId}
                  </TableCell>
                  <TableCell>{mail.subject}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {mail.mailType === "invoice" ? "Рахунок" : 
                       mail.mailType === "contract" ? "Договір" : 
                       mail.mailType === "notification" ? "Повідомлення" : "Інше"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(mail.status)}>
                      {mail.status === "draft" ? "Чернетка" :
                       mail.status === "queued" ? "В черзі" :
                       mail.status === "sent" ? "Відправлено" : "Доставлено"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {mail.createdAt ? new Date(mail.createdAt).toLocaleDateString('uk-UA') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {mail.status === "draft" && (
                        <Button variant="ghost" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="registry" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Назва партії</TableHead>
                <TableHead>Дата реєстрації</TableHead>
                <TableHead>Кількість листів</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Надіслав</TableHead>
                <TableHead>Примітки</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mailRegistry.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.batchName}</TableCell>
                  <TableCell>
                    {new Date(entry.registryDate).toLocaleDateString('uk-UA')}
                  </TableCell>
                  <TableCell>{entry.mailCount}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status === "registered" ? "Зареєстровано" : 
                       entry.status === "sent" ? "Відправлено" : "Доставлено"}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.sentBy || '-'}</TableCell>
                  <TableCell>{entry.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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