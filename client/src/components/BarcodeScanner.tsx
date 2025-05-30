import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Scan, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface BarcodeScannerProps {
  onProductFound: (product: any) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function BarcodeScanner({ onProductFound, onClose, isOpen }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  // Почати сканування
  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Задня камера
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      toast({
        title: "Помилка камери",
        description: "Не вдалося отримати доступ до камери. Перевірте дозволи.",
        variant: "destructive"
      });
    }
  };

  // Зупинити сканування
  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Обробка штрих-коду
  const handleBarcodeDetected = (barcode: string) => {
    if (barcode === lastScannedCode) return; // Уникнути дублювання
    
    setLastScannedCode(barcode);
    setManualBarcode(barcode);
    
    const product = products.find((p: any) => 
      p.barcode === barcode || p.sku === barcode
    );
    
    if (product) {
      toast({
        title: "Товар знайдено!",
        description: `${product.name} (${product.sku})`,
      });
      onProductFound(product);
      stopScanning();
      onClose();
    } else {
      toast({
        title: "Товар не знайдено",
        description: `Штрих-код: ${barcode}`,
        variant: "destructive"
      });
    }
  };

  // Ручний пошук
  const handleManualSearch = () => {
    if (!manualBarcode.trim()) return;
    
    const product = products.find((p: any) => 
      p.barcode === manualBarcode.trim() || 
      p.sku === manualBarcode.trim() ||
      p.name.toLowerCase().includes(manualBarcode.trim().toLowerCase())
    );
    
    if (product) {
      onProductFound(product);
      onClose();
    } else {
      toast({
        title: "Товар не знайдено",
        description: `За кодом/назвою: ${manualBarcode}`,
        variant: "destructive"
      });
    }
  };

  // Симуляція сканування (для демонстрації)
  useEffect(() => {
    if (isScanning && videoRef.current) {
      const interval = setInterval(() => {
        // В реальному додатку тут буде бібліотека сканування штрих-кодів
        // Наприклад: QuaggaJS, ZXing, або інша
        
        // Демонстраційний код - автоматично знаходить перший товар з штрих-кодом
        const productWithBarcode = products.find((p: any) => p.barcode);
        if (productWithBarcode && Math.random() > 0.7) { // 30% шанс "сканування"
          handleBarcodeDetected(productWithBarcode.barcode);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isScanning, products]);

  // Очистити ресурси при закритті
  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setManualBarcode('');
      setLastScannedCode('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Сканер штрих-кодів
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Камера */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {isScanning ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Натисніть "Почати сканування"</p>
                </div>
              </div>
            )}
            
            {/* Рамка сканування */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-32 border-2 border-blue-500 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                </div>
              </div>
            )}
          </div>

          {/* Статус */}
          {isScanning && (
            <div className="text-center">
              <Badge variant="default" className="bg-blue-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Сканування активне
                </div>
              </Badge>
            </div>
          )}

          {/* Кнопки управління камерою */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button 
                onClick={startScanning} 
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Почати сканування
              </Button>
            ) : (
              <Button 
                onClick={stopScanning} 
                variant="outline" 
                className="flex-1"
              >
                <CameraOff className="h-4 w-4 mr-2" />
                Зупинити
              </Button>
            )}
          </div>

          {/* Ручне введення */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Або введіть код вручну:</label>
            <div className="flex gap-2">
              <Input
                placeholder="Штрих-код, SKU або назва товару"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
              />
              <Button 
                onClick={handleManualSearch}
                disabled={!manualBarcode.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Останній відсканований код */}
          {lastScannedCode && (
            <div className="text-sm text-gray-600">
              Останній код: <code className="bg-gray-100 px-1 rounded">{lastScannedCode}</code>
            </div>
          )}

          {/* Кнопки дій */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Скасувати
            </Button>
          </div>

          {/* Підказка */}
          <div className="text-xs text-gray-500 text-center">
            Наведіть камеру на штрих-код товару або введіть код вручну
          </div>
        </CardContent>
      </Card>
    </div>
  );
}