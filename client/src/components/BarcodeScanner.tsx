import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scan, X } from "lucide-react";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    if (barcode.trim()) {
      onScan(barcode.trim());
      setBarcode("");
      onClose();
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    // Mock scanner - in real implementation, this would use camera API
    setTimeout(() => {
      const mockBarcode = "123456789012";
      setBarcode(mockBarcode);
      setIsScanning(false);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Сканер штрих-кодів</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center py-8">
            <Scan className="w-16 h-16 text-primary mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {isScanning ? "Сканування..." : "Наведіть камеру на штрих-код товару"}
            </p>
            
            <div className="space-y-4">
              <Input
                placeholder="Або введіть код вручну"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                disabled={isScanning}
              />
              
              <div className="flex space-x-3">
                <Button
                  onClick={startScanning}
                  disabled={isScanning}
                  className="flex-1"
                >
                  {isScanning ? "Сканування..." : "Сканувати"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleScan}
                  disabled={!barcode.trim() || isScanning}
                  className="flex-1"
                >
                  Підтвердити
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                Скасувати
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
