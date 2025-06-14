import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Hash, Plus, Check, X, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InlineSerialNumbersProps {
  orderItemId: number;
  productId: number;
  productName: string;
  quantity: number;
}

interface AssignedSerialNumber {
  id: number;
  serialNumber: {
    id: number;
    serialNumber: string;
    status: string;
    manufacturedDate: string | null;
  };
  assignedAt: string;
  notes: string | null;
}

export function InlineSerialNumbers({ 
  orderItemId, 
  productId, 
  productName,
  quantity 
}: InlineSerialNumbersProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [serialInput, setSerialInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Отримуємо прив'язані серійні номери
  const { data: assignedSerials = [], refetch: refetchAssigned } = useQuery({
    queryKey: ["/api/order-items", orderItemId, "serial-numbers"],
    queryFn: () => apiRequest(`/api/order-items/${orderItemId}/serial-numbers`)
  });

  // Мутація для прив'язки серійних номерів
  const assignMutation = useMutation({
    mutationFn: (serialNumberIds: number[]) => 
      apiRequest(`/api/order-items/${orderItemId}/assign-serial-numbers`, {
        method: "POST",
        body: { serialNumberIds }
      }),
    onSuccess: (data) => {
      toast({
        title: "Успіх",
        description: `Прив'язано ${data.assignedCount} серійних номерів`
      });
      setSerialInput("");
      setShowDialog(false);
      refetchAssigned();
      queryClient.invalidateQueries({ 
        queryKey: ["/api/order-items", orderItemId, "serial-numbers"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/products", productId, "available-serial-numbers"] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося прив'язати серійні номери",
        variant: "destructive"
      });
    }
  });

  // Мутація для створення та прив'язки серійних номерів
  const createAndAssignMutation = useMutation({
    mutationFn: (serialNumbers: string[]) => 
      apiRequest(`/api/order-items/${orderItemId}/create-and-assign-serials`, {
        method: "POST",
        body: { 
          productId,
          serialNumbers 
        }
      }),
    onSuccess: (data) => {
      toast({
        title: "Успіх",
        description: `Створено та прив'язано ${data.createdCount} серійних номерів`
      });
      setSerialInput("");
      setShowDialog(false);
      setIsGenerating(false);
      refetchAssigned();
      queryClient.invalidateQueries({ 
        queryKey: ["/api/order-items", orderItemId, "serial-numbers"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/products", productId, "available-serial-numbers"] 
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити серійні номери",
        variant: "destructive"
      });
    }
  });

  // Парсинг введених серійних номерів з підтримкою діапазонів
  const parseSerialInput = (input: string): string[] => {
    const serials: string[] = [];
    const lines = input.split(/[,\n]/).map(line => line.trim()).filter(Boolean);
    
    for (const line of lines) {
      if (line.includes('-')) {
        // Обробка діапазону: 0001-0010 або 1234-1250
        const [start, end] = line.split('-').map(s => s.trim());
        if (start && end) {
          const startNum = parseInt(start);
          const endNum = parseInt(end);
          const length = start.length;
          
          if (!isNaN(startNum) && !isNaN(endNum) && startNum <= endNum) {
            for (let i = startNum; i <= endNum; i++) {
              serials.push(i.toString().padStart(length, '0'));
            }
          } else {
            // Якщо не числовий діапазон, додаємо як є
            serials.push(line);
          }
        }
      } else {
        // Одиночний номер
        serials.push(line);
      }
    }
    
    return serials;
  };

  const handleCreateAndAssign = () => {
    if (!serialInput.trim()) {
      toast({
        title: "Помилка",
        description: "Введіть серійні номери",
        variant: "destructive"
      });
      return;
    }

    const parsedSerials = parseSerialInput(serialInput);
    
    if (parsedSerials.length === 0) {
      toast({
        title: "Помилка", 
        description: "Не вдалося розпарсити серійні номери",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    createAndAssignMutation.mutate(parsedSerials);
  };

  const unassignedCount = quantity - assignedSerials.length;
  const isComplete = assignedSerials.length >= quantity;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <Badge variant={isComplete ? "default" : "secondary"} className="text-xs">
          {assignedSerials.length} / {quantity}
        </Badge>
      </div>

      {assignedSerials.length > 0 && (
        <div className="flex flex-wrap gap-1 max-w-md">
          {assignedSerials.slice(0, 3).map((assigned: AssignedSerialNumber) => (
            <Badge key={assigned.id} variant="outline" className="text-xs">
              {assigned.serialNumber.serialNumber}
            </Badge>
          ))}
          {assignedSerials.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{assignedSerials.length - 3}
            </Badge>
          )}
        </div>
      )}

      {!isComplete && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Plus className="h-3 w-3 mr-1" />
              Додати
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Серійні номери для {productName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Введіть серійні номери (потрібно: {unassignedCount})
                </label>
                <Textarea
                  placeholder={`Приклади:
0001
0010-0020
001234-001245
SN001, SN002, SN003
або кожен з нового рядка`}
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              {serialInput && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground mb-2">
                      Буде створено номерів: {parseSerialInput(serialInput).length}
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {parseSerialInput(serialInput).slice(0, 20).map((serial, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {serial}
                        </Badge>
                      ))}
                      {parseSerialInput(serialInput).length > 20 && (
                        <Badge variant="outline" className="text-xs">
                          +{parseSerialInput(serialInput).length - 20}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDialog(false)}
                  disabled={isGenerating}
                >
                  Скасувати
                </Button>
                <Button 
                  onClick={handleCreateAndAssign}
                  disabled={!serialInput.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-spin" />
                      Створюю...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Створити та прив'язати
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isComplete && (
        <Badge className="text-xs bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Готово
        </Badge>
      )}
    </div>
  );
}