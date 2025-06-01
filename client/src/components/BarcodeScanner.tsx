import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, CameraOff, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  onScanResult: (result: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function BarcodeScanner({ 
  onScanResult, 
  isOpen, 
  onOpenChange,
  title = "Сканування штрих-коду",
  description = "Наведіть камеру на штрих-код або QR-код товару"
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    setCodeReader(reader);

    // Перевіряємо доступність камери
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then(() => setHasCamera(true))
      .catch(() => setHasCamera(false));

    return () => {
      reader.reset();
    };
  }, []);

  const startScanning = async () => {
    if (!codeReader || !videoRef.current || !hasCamera) return;

    try {
      setIsScanning(true);
      
      await codeReader.decodeFromVideoDevice(
        null, // використати першу доступну камеру
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            toast({
              title: "Успішно відскановане",
              description: `Знайдено код: ${scannedText}`,
            });
            onScanResult(scannedText);
            stopScanning();
            onOpenChange?.(false);
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error("Помилка сканування:", error);
          }
        }
      );
    } catch (error) {
      console.error("Помилка запуску сканера:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося запустити камеру",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader) {
      codeReader.reset();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen && hasCamera) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => stopScanning();
  }, [isOpen, hasCamera]);

  const ScannerContent = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasCamera ? (
          <div className="text-center p-8 text-muted-foreground">
            <CameraOff className="h-12 w-12 mx-auto mb-4" />
            <p>Камера недоступна</p>
            <p className="text-sm">Переконайтеся, що браузер має доступ до камери</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg"
                playsInline
                muted
              />
              {isScanning && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-32 border-2 border-red-500 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startScanning} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Почати сканування
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="outline" className="flex-1">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Зупинити
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (onOpenChange) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <ScannerContent />
        </DialogContent>
      </Dialog>
    );
  }

  return <ScannerContent />;
}

// Компонент кнопки для відкриття сканера
interface ScannerButtonProps {
  onScanResult: (result: string) => void;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ScannerButton({ 
  onScanResult, 
  children,
  variant = "outline",
  size = "sm"
}: ScannerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size}>
            {children || (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Сканувати
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Сканування штрих-коду</DialogTitle>
            <DialogDescription>
              Наведіть камеру на штрих-код або QR-код товару
            </DialogDescription>
          </DialogHeader>
          <BarcodeScanner
            onScanResult={onScanResult}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}