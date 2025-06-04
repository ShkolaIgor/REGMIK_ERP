import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, Upload, Image } from "lucide-react";

interface Client {
  id: string;
  name: string;
  fullName: string;
  legalAddress?: string;
  actualAddress?: string;
  sameAddress?: boolean;
}

interface Mail {
  id: number;
  clientId: string;
  subject: string;
  content: string;
  mailType: string;
  priority: string;
}

interface EnvelopePrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mails: Mail[];
  clients: Client[];
  batchName: string;
}

export default function EnvelopePrintDialog({ 
  isOpen, 
  onClose, 
  mails, 
  clients, 
  batchName 
}: EnvelopePrintDialogProps) {
  const [advertisementText, setAdvertisementText] = useState("REGMIK ERP - Ваш надійний партнер у бізнесі! Телефон: +380 XX XXX-XX-XX");
  const [advertisementImage, setAdvertisementImage] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState("bottom-left");
  const [imageSize, setImageSize] = useState("small");

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

  const getClientById = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const getAdvertisementPosition = () => {
    switch (imagePosition) {
      case "bottom-left": return "bottom: 10mm; left: 10mm;";
      case "bottom-right": return "bottom: 10mm; right: 10mm;";
      case "top-left": return "top: 10mm; left: 10mm;";
      case "top-right": return "top: 10mm; right: 10mm;";
      default: return "bottom: 10mm; left: 10mm;";
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

  const generateEnvelopePrintContent = () => {
    const printableContent = mails.map((mail, index) => {
      const client = getClientById(mail.clientId);
      const address = client?.sameAddress ? client.legalAddress : (client?.actualAddress || client?.legalAddress);
      
      return `
        <div style="page-break-after: always; width: 220mm; height: 110mm; padding: 20mm; font-family: Arial, sans-serif; position: relative; border: 1px solid #ddd; margin-bottom: 10mm;">
          <!-- Адреса отримувача (центр конверта) -->
          <div style="position: absolute; top: 40mm; left: 80mm; font-size: 14px; line-height: 1.6;">
            <div style="font-weight: bold; margin-bottom: 5px;">${client?.fullName || client?.name || 'Невідомий клієнт'}</div>
            <div>${address || 'Адреса не вказана'}</div>
          </div>
          
          <!-- Адреса відправника (лівий верхній кут) -->
          <div style="position: absolute; top: 10mm; left: 10mm; font-size: 10px; line-height: 1.4;">
            <div style="font-weight: bold;">Відправник:</div>
            <div>REGMIK</div>
            <div>вул. Прикладна, 1</div>
            <div>м. Київ, 01001</div>
          </div>
          
          <!-- Рекламний контент -->
          <div style="position: absolute; ${getAdvertisementPosition()}; font-size: 8px; color: #666; max-width: 60mm; display: flex; align-items: center; gap: 5px;">
            ${advertisementImage ? `<img src="${advertisementImage}" style="width: ${getImageSizeValue()}; height: auto; max-height: 15mm;" alt="Реклама" />` : ''}
            <div>${advertisementText}</div>
          </div>
          
          <!-- Номер у пакеті (правий верхній кут) -->
          <div style="position: absolute; top: 10mm; right: 10mm; font-size: 10px; background: #f0f0f0; padding: 2px 5px; border-radius: 3px;">
            ${batchName} - №${index + 1}/${mails.length}
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Друк конвертів - ${batchName}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printableContent}
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printContent = generateEnvelopePrintContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleDownloadHTML = () => {
    const content = generateEnvelopePrintContent();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `конверти-${batchName}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Друк конвертів для пакета "{batchName}"</DialogTitle>
          <p className="text-sm text-gray-600">
            Підготовлено {mails.length} конвертів з адресною інформацією
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="advertisement">Рекламний текст</Label>
            <Textarea
              id="advertisement"
              value={advertisementText}
              onChange={(e) => setAdvertisementText(e.target.value)}
              placeholder="Введіть рекламний текст який буде відображатися на конвертах"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="imageUpload">Рекламне зображення</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="imageUpload"
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
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="imagePosition">Позиція зображення</Label>
              <Select value={imagePosition} onValueChange={setImagePosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть позицію" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-left">Лівий нижній кут</SelectItem>
                  <SelectItem value="bottom-right">Правий нижній кут</SelectItem>
                  <SelectItem value="top-left">Лівий верхній кут</SelectItem>
                  <SelectItem value="top-right">Правий верхній кут</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="imageSize">Розмір зображення</Label>
              <Select value={imageSize} onValueChange={setImageSize}>
                <SelectTrigger>
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

          {advertisementImage && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2">Перегляд зображення:</h4>
              <img 
                src={advertisementImage} 
                alt="Рекламне зображення" 
                className="max-w-32 max-h-32 object-contain border rounded"
              />
            </div>
          )}

          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Перегляд адрес для друку:</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {mails.map((mail, index) => {
                const client = getClientById(mail.clientId);
                const address = client?.sameAddress ? client.legalAddress : (client?.actualAddress || client?.legalAddress);
                return (
                  <div key={mail.id} className="text-sm p-2 bg-white rounded border">
                    <div className="font-medium">
                      №{index + 1}: {client?.fullName || client?.name || 'Невідомий клієнт'}
                    </div>
                    <div className="text-gray-600">
                      {address || 'Адреса не вказана'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Закрити
            </Button>
            <Button variant="outline" onClick={handleDownloadHTML}>
              <Download className="h-4 w-4 mr-2" />
              Завантажити HTML
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Друкувати конверти
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}