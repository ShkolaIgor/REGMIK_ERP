import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LoginCredentials {
  username: string;
  password: string;
}

export function SimpleLogin({ onSuccess }: { onSuccess?: () => void }) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: ""
  });
  const [error, setError] = useState<string>("");
  
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (loginData: LoginCredentials) => {
      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Login failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успішна авторизація",
        description: "Тепер ви можете використовувати всі функції системи",
      });
      setError("");
      onSuccess?.();
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Помилка авторизації";
      setError(errorMessage);
      toast({
        title: "Помилка авторизації",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      setError("Заповніть усі поля");
      return;
    }
    loginMutation.mutate(credentials);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="w-5 h-5" />
          Увійти в систему
        </CardTitle>
        <CardDescription>
          Для доступу до 1С інтеграції потрібна авторизація
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Логін</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Введіть логін"
              disabled={loginMutation.isPending}
            />
          </div>
          
          <div>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Введіть пароль"
              disabled={loginMutation.isPending}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Увійти
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}