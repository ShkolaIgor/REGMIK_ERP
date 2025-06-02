import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      setEmailSent(true);
      toast({
        title: "Лист відправлено",
        description: "Перевірте електронну пошту для отримання інструкцій з відновлення паролю",
      });
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося відправити лист для відновлення паролю",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="w-full max-w-md p-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">REGMIK: ERP</h1>
            <p className="text-gray-600">Система управління виробництвом</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Лист відправлено</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Ми відправили інструкції з відновлення паролю на адресу:
              </p>
              <p className="font-medium text-blue-600">{email}</p>
              <p className="text-sm text-gray-500">
                Перевірте папку "Спам", якщо лист не з'явився у вхідних
              </p>
              
              <div className="pt-4">
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline" 
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Повернутись до входу
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">REGMIK: ERP</h1>
          <p className="text-gray-600">Система управління виробництвом</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Відновлення паролю</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Електронна пошта</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Введіть вашу електронну пошту"
                  required
                />
                <p className="text-sm text-gray-500">
                  Ми відправимо посилання для відновлення паролю на цю адресу
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Відправляю..." : "Відправити лист"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="link" 
                className="text-sm text-gray-600 hover:text-gray-700 p-0"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Повернутись до входу
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}