import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Package } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OrderSerialNumbersProps {
  orderItemId: number;
  productId: number;
  productName: string;
  quantity: number;
}

interface SerialNumber {
  id: number;
  serialNumber: string;
  status: string;
  manufacturedDate: string | null;
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

export function OrderSerialNumbers({ 
  orderItemId, 
  productId, 
  productName,
  quantity 
}: OrderSerialNumbersProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedSerials, setSelectedSerials] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Отримуємо прив'язані серійні номери
  const { data: assignedSerials = [], refetch: refetchAssigned } = useQuery({
    queryKey: ["/api/order-items", orderItemId, "serial-numbers"],
    queryFn: () => apiRequest(`/api/order-items/${orderItemId}/serial-numbers`)
  });

  // Отримуємо доступні серійні номери для продукту
  const { data: availableSerials = [] } = useQuery({
    queryKey: ["/api/products", productId, "available-serial-numbers"],
    queryFn: () => apiRequest(`/api/products/${productId}/available-serial-numbers`),
    enabled: showAssignDialog
  });

  // Мутація для прив'язки серійних номерів
  const assignMutation = useMutation({
    mutationFn: (serialNumberIds: number[]) => 
      apiRequest(`/api/order-items/${orderItemId}/serial-numbers`, {
        method: "POST",
        body: JSON.stringify({ serialNumberIds })
      }),
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Серійні номери успішно прив'язані"
      });
      setShowAssignDialog(false);
      setSelectedSerials([]);
      refetchAssigned();
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

  // Мутація для видалення прив'язки
  const removeMutation = useMutation({
    mutationFn: (assignmentId: number) => 
      apiRequest(`/api/order-item-serial-numbers/${assignmentId}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Прив'язку серійного номера видалено"
      });
      refetchAssigned();
      queryClient.invalidateQueries({ 
        queryKey: ["/api/products", productId, "available-serial-numbers"] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити прив'язку",
        variant: "destructive"
      });
    }
  });

  const filteredAvailableSerials = availableSerials.filter((serial: SerialNumber) =>
    serial.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSerial = (serialId: number, checked: boolean) => {
    if (checked) {
      setSelectedSerials(prev => [...prev, serialId]);
    } else {
      setSelectedSerials(prev => prev.filter(id => id !== serialId));
    }
  };

  const handleAssignSerials = () => {
    if (selectedSerials.length === 0) {
      toast({
        title: "Попередження",
        description: "Оберіть серійні номери для прив'язки",
        variant: "destructive"
      });
      return;
    }

    assignMutation.mutate(selectedSerials);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Серійні номери для {productName}
          <Badge variant="outline">
            {assignedSerials.length} / {quantity}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Прив'язано: {assignedSerials.length} з {quantity} необхідних
          </div>
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Додати серійні номери
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Вибір серійних номерів</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Пошук серійного номера</Label>
                  <Input
                    id="search"
                    placeholder="Введіть серійний номер..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Вибір</TableHead>
                        <TableHead>Серійний номер</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Дата виробництва</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAvailableSerials.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Немає доступних серійних номерів
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAvailableSerials.map((serial: SerialNumber) => (
                          <TableRow key={serial.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedSerials.includes(serial.id)}
                                onCheckedChange={(checked) => 
                                  handleSelectSerial(serial.id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {serial.serialNumber}
                            </TableCell>
                            <TableCell>
                              <Badge variant={serial.status === "available" ? "default" : "secondary"}>
                                {serial.status === "available" ? "Доступний" : serial.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {serial.manufacturedDate 
                                ? new Date(serial.manufacturedDate).toLocaleDateString("uk-UA")
                                : "—"
                              }
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Обрано: {selectedSerials.length} серійних номерів
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignDialog(false)}
                    >
                      Скасувати
                    </Button>
                    <Button
                      onClick={handleAssignSerials}
                      disabled={selectedSerials.length === 0 || assignMutation.isPending}
                    >
                      {assignMutation.isPending ? "Додавання..." : "Додати"}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {assignedSerials.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Серійний номер</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата прив'язки</TableHead>
                  <TableHead className="w-12">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedSerials.map((assigned: AssignedSerialNumber) => (
                  <TableRow key={assigned.id}>
                    <TableCell className="font-medium">
                      {assigned.serialNumber.serialNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {assigned.serialNumber.status === "reserved" ? "Зарезервований" : assigned.serialNumber.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(assigned.assignedAt).toLocaleDateString("uk-UA")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMutation.mutate(assigned.id)}
                        disabled={removeMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Серійні номери не прив'язані
          </div>
        )}
      </CardContent>
    </Card>
  );
}