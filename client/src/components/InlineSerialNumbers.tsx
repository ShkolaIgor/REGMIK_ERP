import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hash, Plus, Check, X, Zap, Edit2, Trash2, AlertTriangle } from "lucide-react";
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [serialInput, setSerialInput] = useState("");
  const [editSerialInput, setEditSerialInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSerial, setEditingSerial] = useState<{ id: number; serialNumber: string } | null>(null);
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

  // Мутація для видалення серійного номера
  const removeMutation = useMutation({
    mutationFn: (assignmentId: number) => 
      apiRequest(`/api/order-item-serial-numbers/${assignmentId}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Серійний номер відкріплено"
      });
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
        description: error.message || "Не вдалося відкріпити серійний номер",
        variant: "destructive"
      });
    }
  });

  // Мутація для редагування серійного номера
  const editMutation = useMutation({
    mutationFn: ({ serialNumberId, newSerial }: { serialNumberId: number; newSerial: string }) => 
      apiRequest(`/api/serial-numbers/${serialNumberId}`, {
        method: "PUT",
        body: { serialNumber: newSerial }
      }),
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Серійний номер оновлено"
      });
      setEditingSerial(null);
      setShowEditDialog(false);
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
        description: error.message || "Не вдалося оновити серійний номер",
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

  // Додаємо запит для перевірки існуючих серійних номерів
  const { data: existingSerials = [] } = useQuery({
    queryKey: ["/api/serial-numbers/check"],
    queryFn: () => apiRequest(`/api/serial-numbers/all`),
    enabled: false // Викликаємо вручну
  });

  const checkForDuplicates = async (serials: string[]): Promise<string[]> => {
    try {
      const response = await apiRequest(`/api/serial-numbers/check-duplicates`, {
        method: "POST",
        body: { serialNumbers: serials }
      });
      return response.duplicates || [];
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return [];
    }
  };

  const handleCreateAndAssign = async () => {
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

    // Перевіряємо на дублікати перед відправкою
    setIsGenerating(true);
    try {
      const duplicates = await checkForDuplicates(parsedSerials);
      
      if (duplicates.length > 0) {
        setIsGenerating(false);
        toast({
          title: "Знайдено дублікати",
          description: `Серійні номери вже використовуються: ${duplicates.join(', ')}. Використайте інші номери.`,
          variant: "destructive"
        });
        return;
      }

      createAndAssignMutation.mutate(parsedSerials);
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Помилка",
        description: "Не вдалося перевірити серійні номери",
        variant: "destructive"
      });
    }
  };

  const unassignedCount = quantity - assignedSerials.length;
  const isComplete = assignedSerials.length >= quantity;
  const hasExcess = assignedSerials.length > quantity;

  // Функція для групування послідовних серійних номерів у діапазони
  const formatSerialNumbers = (serials: AssignedSerialNumber[]): string[] => {
    if (serials.length === 0) return [];
    
    // Групуємо серійні номери за префіксом та довжиною
    const groups: { [key: string]: string[] } = {};
    
    serials.forEach(s => {
      const serial = s.serialNumber.serialNumber;
      
      // Визначаємо групу за довжиною та форматом
      const isNumeric = /^\d+$/.test(serial);
      const key = isNumeric ? `numeric_${serial.length}` : `text_${serial.length}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(serial);
    });

    const allRanges: string[] = [];

    // Обробляємо кожну групу окремо
    Object.values(groups).forEach(groupSerials => {
      // Сортуємо серійні номери в групі
      const sorted = groupSerials.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        
        return a.localeCompare(b);
      });

      const ranges: string[] = [];
      let start = sorted[0];
      let end = start;
      
      for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const prevNum = parseInt(end);
        const currentNum = parseInt(current);
        
        // Якщо серійні номери числові та послідовні, і мають однакову довжину
        if (!isNaN(prevNum) && !isNaN(currentNum) && 
            currentNum === prevNum + 1 && 
            current.length === end.length) {
          end = current;
        } else {
          // Додаємо попередній діапазон
          if (start === end) {
            ranges.push(start);
          } else {
            ranges.push(`${start}-${end}`);
          }
          
          start = current;
          end = current;
        }
      }
      
      // Додаємо останній діапазон
      if (start === end) {
        ranges.push(start);
      } else {
        ranges.push(`${start}-${end}`);
      }
      
      allRanges.push(...ranges);
    });
    
    return allRanges.sort();
  };

  const formattedSerials = formatSerialNumbers(assignedSerials);

  // Валідація кількості в реальному часі
  const validateQuantity = (input: string, currentAssigned: number = 0) => {
    const newSerials = parseSerialInput(input);
    const totalAfterChanges = currentAssigned + newSerials.length;
    return {
      newCount: newSerials.length,
      totalAfterChanges,
      isExceeding: totalAfterChanges > quantity,
      difference: totalAfterChanges - quantity
    };
  };

  // Валідація для додавання нових серійних номерів
  const addValidation = validateQuantity(serialInput, assignedSerials.length);
  
  // Валідація для редагування серійних номерів
  const editValidation = (() => {
    if (!editSerialInput) return { newCount: 0, totalAfterChanges: 0, isExceeding: false, difference: 0 };
    const newSerials = parseSerialInput(editSerialInput);
    return {
      newCount: newSerials.length,
      totalAfterChanges: newSerials.length,
      isExceeding: newSerials.length > quantity,
      difference: newSerials.length - quantity
    };
  })();

  // Функції для обробки редагування та видалення
  const handleEdit = (assigned: AssignedSerialNumber) => {
    setEditingSerial({
      id: assigned.serialNumber.id,
      serialNumber: assigned.serialNumber.serialNumber
    });
    setShowEditDialog(true);
  };

  const handleRemove = (assignmentId: number) => {
    if (confirm("Ви впевнені, що хочете відкріпити цей серійний номер?")) {
      removeMutation.mutate(assignmentId);
    }
  };

  const handleEditSave = () => {
    if (editingSerial && editingSerial.serialNumber.trim()) {
      editMutation.mutate({
        serialNumberId: editingSerial.id,
        newSerial: editingSerial.serialNumber.trim()
      });
    }
  };

  // Автоматично оновлюємо editSerialInput коли відкривається діалог і дані доступні
  useEffect(() => {
    if (showEditDialog && assignedSerials.length > 0) {
      const currentSerials = assignedSerials.map((s: AssignedSerialNumber) => s.serialNumber.serialNumber);
      console.log('Заповнюю форму редагування серійними номерами:', currentSerials);
      setEditSerialInput(currentSerials.join('\n'));
    }
  }, [showEditDialog, assignedSerials]);

  // Оновлюємо editSerialInput коли відкривається діалог редагування
  const handleEditDialogOpen = (open: boolean) => {
    if (open) {
      // Заповнюємо форму наявними серійними номерами
      const currentSerials = assignedSerials.map((s: AssignedSerialNumber) => s.serialNumber.serialNumber);
      console.log('Відкриваю діалог редагування з номерами:', currentSerials);
      setEditSerialInput(currentSerials.join('\n'));
    } else {
      // Очищаємо форму при закритті
      setEditSerialInput('');
    }
    setShowEditDialog(open);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <Badge 
          variant={hasExcess ? "destructive" : isComplete ? "default" : "secondary"} 
          className="text-xs"
        >
          {assignedSerials.length} / {quantity}
          {hasExcess && <AlertTriangle className="h-3 w-3 ml-1" />}
        </Badge>
      </div>

      {assignedSerials.length > 0 && (
        <div className="flex flex-wrap gap-1 max-w-md">
          {formattedSerials.slice(0, 3).map((range, index) => (
            <Badge key={index} variant="outline" className="text-xs font-mono">
              {range}
            </Badge>
          ))}
          {formattedSerials.length > 3 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setShowEditDialog(true)}
            >
              +{formattedSerials.length - 3} ще
            </Button>
          )}
          {assignedSerials.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs hover:bg-gray-100"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {hasExcess && (
        <Badge variant="destructive" className="text-xs">
          Перевищено на {assignedSerials.length - quantity}
        </Badge>
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
                <Card className={addValidation.isExceeding ? "border-red-500" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-muted-foreground">
                        Буде створено номерів: {addValidation.newCount}
                      </div>
                      <div className="text-sm">
                        Загалом: {addValidation.totalAfterChanges} / {quantity}
                      </div>
                    </div>
                    
                    {addValidation.isExceeding && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-800 font-medium">
                            Перевищення кількості на {addValidation.difference}
                          </span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          Замовлено тільки {quantity} шт., але буде призначено {addValidation.totalAfterChanges} серійних номерів
                        </p>
                      </div>
                    )}
                    
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

      {isComplete && !hasExcess && (
        <Badge className="text-xs bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Готово
        </Badge>
      )}

      {/* Діалог для редагування серійних номерів */}
      <Dialog open={showEditDialog} onOpenChange={handleEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Управління серійними номерами для {productName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Прив'язано: {assignedSerials.length} / {quantity}
                {hasExcess && (
                  <span className="text-red-600 ml-2">
                    (Перевищено на {assignedSerials.length - quantity})
                  </span>
                )}
              </div>
            </div>

            {/* Форма редагування серійних номерів */}
            <div className="space-y-4 p-4 border rounded-lg">
              <Label htmlFor="editSerials">
                Редагувати серійні номери (один на рядок або через кому)
              </Label>
              <Textarea
                id="editSerials"
                placeholder={`Введіть серійні номери:\n001233-001240\n0001, 0004-0200, 0300\nABC123\nDEF456-DEF460`}
                value={editSerialInput}
                onChange={(e) => {
                  setEditSerialInput(e.target.value);
                }}
                rows={8}
                className={`font-mono text-sm ${editValidation.isExceeding ? 'border-red-500' : ''}`}
              />
              
              {editSerialInput && (
                <Card className={editValidation.isExceeding ? "border-red-500" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-muted-foreground">
                        Буде номерів: {editValidation.newCount}
                      </div>
                      <div className="text-sm">
                        Загалом: {editValidation.totalAfterChanges} / {quantity}
                      </div>
                    </div>
                    
                    {editValidation.isExceeding && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-800 font-medium">
                            Перевищення кількості на {editValidation.difference}
                          </span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          Замовлено тільки {quantity} шт., але буде призначено {editValidation.totalAfterChanges} серійних номерів
                        </p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {parseSerialInput(editSerialInput).slice(0, 20).map((serial, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {serial}
                        </Badge>
                      ))}
                      {parseSerialInput(editSerialInput).length > 20 && (
                        <Badge variant="outline" className="text-xs">
                          +{parseSerialInput(editSerialInput).length - 20}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    const newSerials = parseSerialInput(editSerialInput);
                    const currentSerials = assignedSerials.map((s: AssignedSerialNumber) => s.serialNumber.serialNumber);
                    
                    // Знаходимо серійні номери для видалення
                    const toRemove = assignedSerials.filter((assigned: AssignedSerialNumber) => 
                      !newSerials.includes(assigned.serialNumber.serialNumber)
                    );
                    
                    // Знаходимо нові серійні номери для додавання
                    const toAdd = newSerials.filter(serial => 
                      !currentSerials.includes(serial)
                    );

                    // Виконуємо операції послідовно
                    const executeUpdates = async () => {
                      try {
                        // Спочатку видаляємо
                        for (const assigned of toRemove) {
                          await removeMutation.mutateAsync(assigned.id);
                        }
                        
                        // Потім додаємо нові
                        if (toAdd.length > 0) {
                          await createAndAssignMutation.mutateAsync(toAdd);
                        }
                        
                        setShowEditDialog(false);
                        toast({
                          title: "Успіх",
                          description: "Серійні номери оновлено"
                        });
                      } catch (error) {
                        console.error("Error updating serial numbers:", error);
                        toast({
                          title: "Помилка",
                          description: "Не вдалося оновити серійні номери",
                          variant: "destructive"
                        });
                      }
                    };

                    executeUpdates();
                  }}
                  disabled={createAndAssignMutation.isPending || removeMutation.isPending}
                >
                  {createAndAssignMutation.isPending || removeMutation.isPending ? (
                    "Збереження..."
                  ) : (
                    "Зберегти зміни"
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                >
                  Скасувати
                </Button>
              </div>
            </div>

            {/* Поточні серійні номери */}
            <div className="space-y-2">
              <Label>Поточні серійні номери:</Label>
              <div className="flex flex-wrap gap-1 p-3 bg-gray-50 rounded border min-h-[60px]">
                {formattedSerials.length > 0 ? (
                  formattedSerials.map((range, index) => (
                    <Badge key={index} variant="outline" className="text-xs font-mono">
                      {range}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Серійні номери не прив'язані</span>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}