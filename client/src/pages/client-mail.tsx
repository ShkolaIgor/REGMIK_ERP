import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Printer, Save, Eye, Settings, Mail, Users, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

type EnvelopeSize = 'c6' | 'dl' | 'c5' | 'c4';

interface Client {
  id: number;
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  senderCity: string;
  senderStreet: string;
  senderBuilding: string;
  recipientCity: string;
  recipientStreet: string;
  recipientBuilding: string;
  postalIndex: string;
}

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
}

interface ClientMail {
  id?: number;
  clientId: number;
  envelopeSize: EnvelopeSize;
  senderName: string;
  senderAddress: string;
  recipientName: string;
  recipientAddress: string;
  postalIndex: string;
  advertisementText?: string;
  advertisementImage?: string;
  createdAt?: Date;
}

type InsertClientMail = Omit<ClientMail, 'id' | 'createdAt'>;

const getDefaultSettings = (size: EnvelopeSize): EnvelopeSettings => {
  const defaultPositions = {
    c6: {
      senderPosition: { x: 8, y: 8 },
      recipientPosition: { x: 20, y: 45 },
      advertisementPosition: { x: 12, y: 65 },
      imagePosition: { x: 90, y: 8 }
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
    ...defaultPositions[size],
    advertisementText: "",
    advertisementImage: null,
    imageSize: 100,
    fontSize: 14,
    senderRecipientFontSize: 12,
    postalIndexFontSize: 24,
    advertisementFontSize: 12
  };
};

export default function ClientMailPage() {
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [settings, setSettings] = useState<EnvelopeSettings>(getDefaultSettings('dl'));
  const [batchName, setBatchName] = useState("");
  const [selectedEnvelopeSize, setSelectedEnvelopeSize] = useState<EnvelopeSize>('dl');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: savedSettings } = useQuery({
    queryKey: ["/api/envelope-settings"],
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: EnvelopeSettings) => {
      const response = await apiRequest("/api/envelope-settings", {
        method: "PUT",
        body: settings
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Налаштування збережено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/envelope-settings"] });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування",
        variant: "destructive",
      });
    },
  });

  const createMailMutation = useMutation({
    mutationFn: (data: InsertClientMail) => apiRequest("/api/client-mail", { method: "POST", body: data }),
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Кореспонденцію створено",
      });
    },
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data: { batchName: string; clientIds: number[]; settings: EnvelopeSettings }) => {
      return apiRequest("/api/client-mail/batch", { method: "POST", body: data });
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Партію кореспонденції створено",
      });
      setSelectedClients([]);
      setBatchName("");
      queryClient.invalidateQueries({ queryKey: ["/api/client-mail"] });
    },
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
      setSelectedEnvelopeSize(savedSettings.envelopeSize);
    }
  }, [savedSettings]);

  useEffect(() => {
    const newSettings = getDefaultSettings(selectedEnvelopeSize);
    setSettings(prev => ({ ...newSettings, ...prev, envelopeSize: selectedEnvelopeSize }));
  }, [selectedEnvelopeSize]);

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
    setIsSettingsOpen(false);
  };

  const handleCreateBatch = () => {
    if (selectedClients.length === 0) {
      toast({
        title: "Помилка",
        description: "Оберіть клієнтів для створення партії",
        variant: "destructive",
      });
      return;
    }

    if (!batchName.trim()) {
      toast({
        title: "Помилка",
        description: "Введіть назву партії",
        variant: "destructive",
      });
      return;
    }

    createBatchMutation.mutate({
      batchName,
      clientIds: selectedClients,
      settings
    });
  };

  const getEnvelopeDimensions = (size: EnvelopeSize) => {
    const dimensions = {
      c6: { width: 162, height: 114 },
      dl: { width: 220, height: 110 },
      c5: { width: 229, height: 162 },
      c4: { width: 324, height: 229 }
    };
    return dimensions[size];
  };

  const toggleClientSelection = (clientId: number) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAllClients = () => {
    setSelectedClients(clients.map((client: Client) => client.id));
  };

  const clearSelection = () => {
    setSelectedClients([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Поштова кореспонденція
        </h1>
        <div className="flex gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Налаштування
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Налаштування конвертів</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="envelope-size">Розмір конверта</Label>
                  <Select value={selectedEnvelopeSize} onValueChange={(value: EnvelopeSize) => setSelectedEnvelopeSize(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="c6">C6 (162×114 мм)</SelectItem>
                      <SelectItem value="dl">DL (220×110 мм)</SelectItem>
                      <SelectItem value="c5">C5 (229×162 мм)</SelectItem>
                      <SelectItem value="c4">C4 (324×229 мм)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="positions" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="positions">Позиції</TabsTrigger>
                    <TabsTrigger value="fonts">Шрифти</TabsTrigger>
                    <TabsTrigger value="content">Контент</TabsTrigger>
                  </TabsList>

                  <TabsContent value="positions" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Позиція відправника</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="X"
                            value={settings.senderPosition.x}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              senderPosition: { ...prev.senderPosition, x: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                          <Input
                            type="number"
                            placeholder="Y"
                            value={settings.senderPosition.y}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              senderPosition: { ...prev.senderPosition, y: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Позиція одержувача</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="X"
                            value={settings.recipientPosition.x}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              recipientPosition: { ...prev.recipientPosition, x: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                          <Input
                            type="number"
                            placeholder="Y"
                            value={settings.recipientPosition.y}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              recipientPosition: { ...prev.recipientPosition, y: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Позиція реклами</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="X"
                            value={settings.advertisementPosition.x}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              advertisementPosition: { ...prev.advertisementPosition, x: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                          <Input
                            type="number"
                            placeholder="Y"
                            value={settings.advertisementPosition.y}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              advertisementPosition: { ...prev.advertisementPosition, y: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Позиція зображення</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="X"
                            value={settings.imagePosition.x}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              imagePosition: { ...prev.imagePosition, x: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                          <Input
                            type="number"
                            placeholder="Y"
                            value={settings.imagePosition.y}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              imagePosition: { ...prev.imagePosition, y: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="fonts" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="font-size">Основний шрифт (px)</Label>
                        <Input
                          id="font-size"
                          type="number"
                          value={settings.fontSize}
                          onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseFloat(e.target.value) || 14 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sender-recipient-font">Шрифт адрес (px)</Label>
                        <Input
                          id="sender-recipient-font"
                          type="number"
                          value={settings.senderRecipientFontSize}
                          onChange={(e) => setSettings(prev => ({ ...prev, senderRecipientFontSize: parseFloat(e.target.value) || 12 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal-index-font">Шрифт індексу (px)</Label>
                        <Input
                          id="postal-index-font"
                          type="number"
                          value={settings.postalIndexFontSize}
                          onChange={(e) => setSettings(prev => ({ ...prev, postalIndexFontSize: parseFloat(e.target.value) || 24 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="advertisement-font">Шрифт реклами (px)</Label>
                        <Input
                          id="advertisement-font"
                          type="number"
                          value={settings.advertisementFontSize}
                          onChange={(e) => setSettings(prev => ({ ...prev, advertisementFontSize: parseFloat(e.target.value) || 12 }))}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <Label htmlFor="advertisement-text">Рекламний текст</Label>
                      <Textarea
                        id="advertisement-text"
                        value={settings.advertisementText}
                        onChange={(e) => setSettings(prev => ({ ...prev, advertisementText: e.target.value }))}
                        placeholder="Введіть рекламний текст..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="image-size">Розмір зображення (px)</Label>
                      <Input
                        id="image-size"
                        type="number"
                        value={settings.imageSize}
                        onChange={(e) => setSettings(prev => ({ ...prev, imageSize: parseFloat(e.target.value) || 100 }))}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                    Скасувати
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={saveSettingsMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {saveSettingsMutation.isPending ? "Збереження..." : "Зберегти"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Попередній перегляд
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Попередній перегляд конверта ({settings.envelopeSize.toUpperCase()})</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                <div 
                  className="border border-gray-300 bg-white relative"
                  style={{
                    width: `${getEnvelopeDimensions(settings.envelopeSize).width * 2}px`,
                    height: `${getEnvelopeDimensions(settings.envelopeSize).height * 2}px`,
                  }}
                >
                  {/* Відправник */}
                  <div
                    className="absolute text-black"
                    style={{
                      left: `${settings.senderPosition.x * 2}px`,
                      top: `${settings.senderPosition.y * 2}px`,
                      fontSize: `${settings.senderRecipientFontSize * 1.5}px`,
                      fontFamily: 'sans-serif, Ubuntu, Arial',
                      lineHeight: '1.2'
                    }}
                  >
                    <div>Відправник:</div>
                    <div>Тестова Компанія ТОВ</div>
                    <div>вул. Тестова, 123</div>
                    <div>01001, м. Київ</div>
                  </div>

                  {/* Одержувач */}
                  <div
                    className="absolute text-black"
                    style={{
                      left: `${settings.recipientPosition.x * 2}px`,
                      top: `${settings.recipientPosition.y * 2}px`,
                      fontSize: `${settings.senderRecipientFontSize * 1.5}px`,
                      fontFamily: 'sans-serif, Ubuntu, Arial',
                      lineHeight: '1.2'
                    }}
                  >
                    <div>Одержувач:</div>
                    <div>Іваненко Іван Іванович</div>
                    <div>вул. Прикладна, 456</div>
                    <div>02002, м. Харків</div>
                  </div>

                  {/* Поштовий індекс */}
                  <div
                    className="absolute text-black font-bold"
                    style={{
                      right: '20px',
                      top: '10px',
                      fontSize: `${settings.postalIndexFontSize * 1.5}px`,
                      fontFamily: 'sans-serif, Ubuntu, Arial'
                    }}
                  >
                    02002
                  </div>

                  {/* Реклама */}
                  {settings.advertisementText && (
                    <div
                      className="absolute text-black"
                      style={{
                        left: `${settings.advertisementPosition.x * 2}px`,
                        top: `${settings.advertisementPosition.y * 2}px`,
                        fontSize: `${settings.advertisementFontSize * 1.5}px`,
                        fontFamily: 'sans-serif, Ubuntu, Arial',
                        maxWidth: '300px'
                      }}
                    >
                      {settings.advertisementText}
                    </div>
                  )}

                  {/* Зображення */}
                  {settings.advertisementImage && (
                    <div
                      className="absolute border border-gray-200"
                      style={{
                        left: `${settings.imagePosition.x * 2}px`,
                        top: `${settings.imagePosition.y * 2}px`,
                        width: `${settings.imageSize * 1.5}px`,
                        height: `${settings.imageSize * 1.5}px`,
                        backgroundImage: `url(${settings.advertisementImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список клієнтів */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Клієнти ({clients.length})
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllClients}>
                    Обрати всіх
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Очистити
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {clients.map((client: Client) => (
                  <div
                    key={client.id}
                    className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
                  >
                    <Checkbox
                      id={`client-${client.id}`}
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => toggleClientSelection(client.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{client.customerName}</div>
                      <div className="text-sm text-gray-500">
                        {client.recipientName} • {client.recipientCity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedClients.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-700">
                    Обрано клієнтів: {selectedClients.length}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Панель створення партії */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Створення партії
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="batch-name">Назва партії</Label>
                <Input
                  id="batch-name"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Введіть назву партії..."
                />
              </div>

              <div>
                <Label>Розмір конверта</Label>
                <Select value={selectedEnvelopeSize} onValueChange={(value: EnvelopeSize) => setSelectedEnvelopeSize(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="c6">C6 (162×114 мм)</SelectItem>
                    <SelectItem value="dl">DL (220×110 мм)</SelectItem>
                    <SelectItem value="c5">C5 (229×162 мм)</SelectItem>
                    <SelectItem value="c4">C4 (324×229 мм)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.advertisementText && (
                <div>
                  <Label>Рекламний текст</Label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {settings.advertisementText.substring(0, 100)}
                    {settings.advertisementText.length > 100 && "..."}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleCreateBatch}
                disabled={selectedClients.length === 0 || !batchName.trim() || createBatchMutation.isPending}
                className="w-full"
              >
                <Printer className="h-4 w-4 mr-2" />
                {createBatchMutation.isPending ? "Створення..." : `Створити партію (${selectedClients.length})`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}