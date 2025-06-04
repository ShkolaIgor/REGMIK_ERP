import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Download } from "lucide-react";

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

  const getClientById = (clientId: string) => {
    return clients.find(c => c.id === clientId);
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
          
          <!-- Рекламний текст (лівий нижній кут) -->
          <div style="position: absolute; bottom: 10mm; left: 10mm; font-size: 8px; color: #666; max-width: 60mm;">
            ${advertisementText}
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
            <Label htmlFor="advertisement">Рекламний текст (лівий нижній кут конверта)</Label>
            <Textarea
              id="advertisement"
              value={advertisementText}
              onChange={(e) => setAdvertisementText(e.target.value)}
              placeholder="Введіть рекламний текст який буде відображатися на конвертах"
              rows={3}
            />
          </div>

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