import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: any) => {
      setError(error.message || "Помилка входу в систему");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username || !password) {
      setError("Будь ласка, введіть логін і пароль");
      return;
    }

    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              REGMIK ERP
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Система управління виробництвом
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Логін</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введіть логін"
                disabled={loginMutation.isPending}
                autoComplete="username"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть пароль"
                disabled={loginMutation.isPending}
                autoComplete="current-password"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Вхід...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Увійти
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
              <p className="font-medium mb-2">Тестові облікові записи:</p>
              <div className="space-y-1">
                <p><span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">admin</span> / <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">admin</span></p>
                <p><span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">demo</span> / <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">demo</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}