import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TempLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTempLogin = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("/api/auth/temp-login", {
        method: "POST"
      });
      
      if (response.success) {
        toast({
          title: "Успішний вхід",
          description: "Тимчасовий доступ надано"
        });
        window.location.href = "/";
      }
    } catch (error) {
      toast({
        title: "Помилка входу",
        description: "Не вдалося увійти в систему",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplitAuth = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Вхід в систему</CardTitle>
          <CardDescription>
            Оберіть спосіб входу для доступу до ERP системи
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleReplitAuth}
            className="w-full"
            variant="default"
          >
            Увійти через Replit
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                або
              </span>
            </div>
          </div>
          
          <Button 
            onClick={handleTempLogin}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            {isLoading ? "Входжу..." : "Тимчасовий доступ (для відновлення)"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}