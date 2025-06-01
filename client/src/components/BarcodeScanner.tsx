import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Camera, CameraOff, Search, Keyboard } from "lucide-react";
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
  isOpen = false, 
  onOpenChange,
  title = "Сканування штрих-коду",
  description = "Наведіть камеру на штрих-код або QR-код товару"
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Перевіряємо доступність камери
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then(() => setHasCamera(true))
      .catch(() => setHasCamera(false));
  }, []);

  const startScanning = async () => {
    if (!videoRef.current || !hasCamera) return;

    try {
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      toast({
        title: "Камера запущена",
        description: "Наведіть камеру на штрих-код",
      });
      
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
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      toast({
        title: "Код введено",
        description: `Код: ${manualInput}`,
      });
      onScanResult(manualInput.trim());
      setManualInput("");
      setShowManualInput(false);
      onOpenChange?.(false);
    }
  };

  useEffect(() => {
    if (isOpen && hasCamera && !showManualInput) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => stopScanning();
  }, [isOpen, hasCamera, showManualInput]);

  const ScannerContent = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showManualInput ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Введіть код вручну:</label>
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Введіть штрих-код або SKU"
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                Пошук
              </Button>
              <Button variant="outline" onClick={() => setShowManualInput(false)}>
                Назад до камери
              </Button>
            </div>
          </div>
        ) : !hasCamera ? (
          <div className="text-center p-8 text-muted-foreground">
            <CameraOff className="h-12 w-12 mx-auto mb-4" />
            <p>Камера недоступна</p>
            <p className="text-sm mb-4">Скористайтеся ручним введенням</p>
            <Button onClick={() => setShowManualInput(true)}>
              <Keyboard className="h-4 w-4 mr-2" />
              Ввести вручну
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg cursor-pointer"
                playsInline
                muted
                onClick={() => setShowManualInput(true)}
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white w-48 h-32 rounded-lg animate-pulse" />
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startScanning} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Запустити камеру
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="outline" className="flex-1">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Зупинити
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => setShowManualInput(true)}
              >
                <Keyboard className="h-4 w-4 mr-2" />
                Ввести вручну
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Натисніть на відео або використайте ручне введення
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (onOpenChange) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
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

interface ScannerButtonProps {
  onScanResult: (result: string) => void;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ScannerButton({ 
  onScanResult, 
  children = "Сканувати",
  variant = "outline",
  size = "default"
}: ScannerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Search className="h-4 w-4 mr-2" />
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Сканування штрих-коду</DialogTitle>
          <DialogDescription>
            Наведіть камеру на штрих-код або введіть код вручну
          </DialogDescription>
        </DialogHeader>
        <BarcodeScanner 
          onScanResult={onScanResult}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        />
      </DialogContent>
    </Dialog>
  );
}