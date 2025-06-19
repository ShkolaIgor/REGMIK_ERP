import { useState, useRef } from "react";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface LogoUploadProps {
  companyId: number;
  currentLogo?: string | null;
  onLogoUpdate?: (logo: string | null) => void;
}

export function LogoUpload({ companyId, currentLogo, onLogoUpdate }: LogoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch(`/api/companies/${companyId}/logo`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Важливо для cookies
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload logo');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Logo upload successful:", data);
      setPreviewUrl(data.logo);
      onLogoUpdate?.(data.logo);
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Успіх",
        description: "Логотип успішно завантажено",
      });
    },
    onError: (error: any) => {
      console.error("Logo upload error:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося завантажити логотип",
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/logo`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove logo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setPreviewUrl(null);
      onLogoUpdate?.(null);
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Успіх",
        description: "Логотип успішно видалено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити логотип",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Помилка",
        description: "Будь ласка, оберіть файл зображення",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Помилка",
        description: "Розмір файлу не повинен перевищувати 5MB",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Label>Логотип компанії</Label>
      
      {previewUrl ? (
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                <img 
                  src={previewUrl} 
                  alt="Company logo" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Поточний логотип</p>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBrowseClick}
                    disabled={uploadMutation.isPending}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Замінити
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeMutation.mutate()}
                    disabled={removeMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Видалити
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}>
          <CardContent 
            className="p-8 text-center cursor-pointer"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isDragging ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Image className={`w-8 h-8 ${
                  isDragging ? 'text-blue-500' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragging ? 'Відпустіть файл тут' : 'Завантажити логотип'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Перетягніть файл або натисніть для вибору
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PNG, JPG, GIF до 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}