import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const hasExcess = assignedSerials.length > quantity;

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
          {assignedSerials.slice(0, 3).map((assigned: AssignedSerialNumber) => (
            <div key={assigned.id} className="group relative">
              <Badge variant="outline" className="text-xs pr-6">
                {assigned.serialNumber.serialNumber}
                <div className="absolute right-0 top-0 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 hover:bg-blue-100"
                    onClick={() => handleEdit(assigned)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 hover:bg-red-100"
                    onClick={() => handleRemove(assigned.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Badge>
            </div>
          ))}
          {assignedSerials.length > 3 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setShowEditDialog(true)}
            >
              +{assignedSerials.length - 3} ще
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

      {isComplete && !hasExcess && (
        <Badge className="text-xs bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Готово
        </Badge>
      )}

      {/* Діалог для редагування серійних номерів */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Управління серійними номерами для {productName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Кількість: {assignedSerials.length} / {quantity}
                {hasExcess && (
                  <span className="text-red-600 ml-2">
                    (Перевищено на {assignedSerials.length - quantity})
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Додати ще
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Серійний номер</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата прив'язки</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedSerials.map((assigned: AssignedSerialNumber) => (
                  <TableRow key={assigned.id}>
                    <TableCell className="font-mono">
                      {editingSerial?.id === assigned.serialNumber.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingSerial.serialNumber}
                            onChange={(e) => setEditingSerial({
                              ...editingSerial,
                              serialNumber: e.target.value
                            })}
                            className="font-mono"
                          />
                          <Button size="sm" onClick={handleEditSave}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingSerial(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        assigned.serialNumber.serialNumber
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {assigned.serialNumber.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(assigned.assignedAt).toLocaleDateString('uk-UA')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(assigned)}
                          disabled={editingSerial?.id === assigned.serialNumber.id}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(assigned.id)}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {assignedSerials.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Серійні номери не прив'язані
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}