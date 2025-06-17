import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [debugToken, setDebugToken] = useState("");

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return response;
    },
    onSuccess: (data) => {
      setSuccess(true);
      if (data.debugToken) {
        setDebugToken(data.debugToken);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      forgotPasswordMutation.mutate(email);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Перевірте пошту
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Інструкції для скидання паролю надіслані на вашу електронну пошту
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Якщо ви не отримали листа протягом кількох хвилин, перевірте папку "Спам".
              </p>
              
              {debugToken && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Демо режим - токен для тестування:
                  </p>
                  <p className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded border break-all">
                    {debugToken}
                  </p>
                  <Link href={`/reset-password?token=${debugToken}`}>
                    <Button className="mt-2 w-full" size="sm">
                      Перейти до скидання паролю
                    </Button>
                  </Link>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Повернутися до входу
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Забули пароль?
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Введіть вашу електронну пошту для отримання інструкцій зі скидання паролю
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {forgotPasswordMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {forgotPasswordMutation.error.message || "Помилка при відправці запиту"}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Електронна пошта</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введіть ваш email"
                required
                disabled={forgotPasswordMutation.isPending}
                autoComplete="email"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={forgotPasswordMutation.isPending || !email}
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Відправка...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Надіслати інструкції
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