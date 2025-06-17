import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Key, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Отримуємо токен з URL
  const token = new URLSearchParams(window.location.search).get("token");

  // Перевірка токену
  const { data: tokenData, isLoading, error: tokenError } = useQuery({
    queryKey: ["/api/auth/verify-reset-token", token],
    queryFn: () => apiRequest(`/api/auth/verify-reset-token/${token}`),
    enabled: !!token,
    retry: false,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const response = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      return response;
    },
    onSuccess: () => {
      setSuccess(true);
      // Перенаправляємо на логін через 3 секунди
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token && password && password === confirmPassword) {
      resetPasswordMutation.mutate({ token, password });
    }
  };

  // Якщо немає токену, показуємо помилку
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Недійсне посилання
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Посилання для скидання паролю недійсне або відсутнє
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <Link href="/login">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Повернутися до входу
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Якщо токен недійсний
  if (tokenError || (tokenData && !tokenData.valid)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Токен прострочений
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Токен для скидання паролю недійсний або прострочений
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Будь ласка, запросіть новий токен для скидання паролю
            </p>
            <div className="space-y-2">
              <Link href="/forgot-password">
                <Button className="w-full">
                  Запросити новий токен
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Повернутися до входу
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Успішне скидання паролю
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Пароль змінено
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Ваш пароль успішно змінено
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Зараз ви будете перенаправлені на сторінку входу...
            </p>
            <Link href="/login">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Увійти зараз
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Завантаження токену
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Перевірка токену...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Форма скидання паролю
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Новий пароль
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Введіть новий пароль для вашого облікового запису
          </CardDescription>
          {tokenData?.email && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              {tokenData.email}
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {resetPasswordMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {resetPasswordMutation.error.message || "Помилка при зміні паролю"}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Новий пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть новий пароль"
                required
                minLength={6}
                disabled={resetPasswordMutation.isPending}
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Пароль має містити щонайменше 6 символів
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Підтвердіть пароль</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Підтвердіть новий пароль"
                required
                disabled={resetPasswordMutation.isPending}
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Паролі не співпадають</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={
                resetPasswordMutation.isPending || 
                !password || 
                !confirmPassword || 
                password !== confirmPassword ||
                password.length < 6
              }
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Зміна паролю...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Змінити пароль
                </>
              )}
            </Button>
          </form>
          
          <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Повернутися до входу
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}