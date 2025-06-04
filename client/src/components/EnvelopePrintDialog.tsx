import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, Upload, Image, Eye } from "lucide-react";

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
  const [showPreview, setShowPreview] = useState(false);
  // Налаштування реклами тепер передаються через пропси
  const advertisementText = "REGMIK ERP - Ваш надійний партнер у бізнесі! Телефон: +380 XX XXX-XX-XX";
  const advertisementImage: string | null = null;
  const imagePosition = "bottom-left";
  const imageSize = "small";

  // Функції для роботи з рекламою видалені - тепер в основній формі

  const getClientById = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const getAdvertisementPosition = () => {
    switch (imagePosition) {
      case "bottom-left": return "bottom: 5mm; left: 5mm;";
      case "top-right": return "top: 30mm; right: 5mm;";
      default: return "bottom: 5mm; left: 5mm;";
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
        <div style="page-break-after: always; width: 220mm; height: 110mm; font-family: 'Times New Roman', serif; position: relative; border: 2px solid #000; margin: 10mm auto; box-sizing: border-box;">
          
          <!-- Місце для марки (правий верхній кут) -->
          <div style="position: absolute; top: 8mm; right: 8mm; width: 30mm; height: 25mm; border: 1px dashed #999; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999; text-align: center; line-height: 1.2;">
            МІСЦЕ<br/>ДЛЯ<br/>МАРКИ
          </div>
          
          <!-- Адреса відправника (лівий верхній кут) -->
          <div style="position: absolute; top: 8mm; left: 8mm; font-size: 9px; line-height: 1.3; max-width: 70mm;">
            <div style="font-weight: bold; margin-bottom: 2mm;">Від кого:</div>
            <div>ТОВ "REGMIK"</div>
            <div>04112, м. Київ</div>
            <div>вул. Дегтярівська, 27-Т</div>
          </div>
          
          <!-- Адреса отримувача (центр конверта) -->
          <div style="position: absolute; top: 45mm; left: 60mm; font-size: 12px; line-height: 1.4; max-width: 120mm;">
            <div style="font-weight: bold; margin-bottom: 3mm;">Кому:</div>
            <div style="font-weight: bold; margin-bottom: 2mm;">${client?.fullName || client?.name || 'Невідомий клієнт'}</div>
            <div>${address || 'Адреса не вказана'}</div>
          </div>
          
          <!-- Рекламний контент (згідно вибраної позиції) -->
          ${(advertisementText || advertisementImage) ? `
          <div style="position: absolute; ${getAdvertisementPosition()}; font-size: 8px; color: #333; max-width: 50mm; display: flex; ${imagePosition === 'top-right' ? 'flex-column' : 'flex-row'}; align-items: ${imagePosition === 'top-right' ? 'flex-end' : 'center'}; gap: 3px;">
            ${advertisementImage ? `<img src="${advertisementImage}" style="width: ${getImageSizeValue()}; height: auto; max-height: ${getImageSizeValue()};" alt="Реклама" />` : ''}
            ${advertisementText ? `<div style="text-align: ${imagePosition === 'top-right' ? 'right' : 'left'}; line-height: 1.2;">${advertisementText}</div>` : ''}
          </div>
          ` : ''}
          
          <!-- Номер у пакеті (для внутрішнього використання) -->
          <div style="position: absolute; bottom: 3mm; right: 3mm; font-size: 7px; color: #ccc;">
            ${batchName} - №${index + 1}/${mails.length}
          </div>
          
          <!-- Індекс отримувача (якщо є) -->
          <div style="position: absolute; top: 35mm; right: 45mm; font-size: 14px; font-weight: bold; letter-spacing: 2px;">
            <!-- Тут може бути поштовий індекс -->
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
          {/* Налаштування реклами видалені - тепер в основній формі */}

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

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Сховати перегляд' : 'Попередній перегляд'}
            </Button>
            
            <div className="flex space-x-2">
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

          {showPreview && (
            <div className="mt-6 border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3">Попередній перегляд конверта (зменшено):</h4>
              <div className="bg-white border-2 border-black mx-auto" style={{
                width: '220mm',
                height: '110mm',
                position: 'relative',
                fontFamily: 'Times New Roman, serif',
                transform: 'scale(0.4)',
                transformOrigin: 'top left',
                marginBottom: '-60mm'
              }}>
                {/* Місце для марки */}
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

                {/* Адреса відправника */}
                <div style={{
                  position: 'absolute',
                  top: '8mm',
                  left: '8mm',
                  fontSize: '9px',
                  lineHeight: '1.3',
                  maxWidth: '70mm'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>Від кого:</div>
                  <div>ТОВ "REGMIK"</div>
                  <div>04112, м. Київ</div>
                  <div>вул. Дегтярівська, 27-Т</div>
                </div>

                {/* Адреса отримувача */}
                <div style={{
                  position: 'absolute',
                  top: '45mm',
                  left: '60mm',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  maxWidth: '120mm'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3mm' }}>Кому:</div>
                  <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>Приклад клієнта</div>
                  <div>01001, м. Київ, вул. Прикладна, 1</div>
                </div>

                {/* Рекламний контент */}
                {(advertisementText || advertisementImage) && (
                  <div style={{
                    position: 'absolute',
                    [imagePosition === 'top-right' ? 'top' : 'bottom']: imagePosition === 'top-right' ? '30mm' : '5mm',
                    [imagePosition === 'top-right' ? 'right' : 'left']: '5mm',
                    fontSize: '8px',
                    color: '#333',
                    maxWidth: '50mm',
                    display: 'flex',
                    flexDirection: imagePosition === 'top-right' ? 'column' : 'row',
                    alignItems: imagePosition === 'top-right' ? 'flex-end' : 'center',
                    gap: '3px'
                  }}>
                    {advertisementImage && (
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
                    {advertisementText && (
                      <div style={{
                        textAlign: imagePosition === 'top-right' ? 'right' : 'left',
                        lineHeight: '1.2'
                      }}>
                        {advertisementText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}