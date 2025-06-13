import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { formatUkrainianDate } from "@/lib/date-utils";
import type { RepairPart, InventoryItem } from "@shared/schema";

interface RepairPartsManagerProps {
  repairId: number;
  parts?: RepairPart[];
}

export function RepairPartsManager({ repairId, parts = [] }: RepairPartsManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState("");

  const queryClient = useQueryClient();

  // Отримання товарів зі складу
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"]
  });

  // Фільтровані товари для пошуку
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Додавання запчастини до ремонту
  const addPartMutation = useMutation({
    mutationFn: (data: { inventoryId: number; quantity: number; description?: string }) =>
      apiRequest(`/api/repairs/${repairId}/parts`, {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repairs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/repairs/${repairId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setShowAddDialog(false);
      setSelectedInventoryId("");
      setQuantity(1);
      setDescription("");
      setSearchTerm("");
    }
  });

  // Видалення запчастини з ремонту
  const deletePartMutation = useMutation({
    mutationFn: (partId: number) =>
      apiRequest(`/api/repair-parts/${partId}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repairs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/repairs/${repairId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    }
  });

  const handleAddPart = () => {
    if (!selectedInventoryId || quantity <= 0) return;

    addPartMutation.mutate({
      inventoryId: parseInt(selectedInventoryId),
      quantity,
      description: description || undefined
    });
  };

  const handleDeletePart = (partId: number) => {
    if (confirm("Ви впевнені, що хочете видалити цю запчастину? Товар буде повернуто на склад.")) {
      deletePartMutation.mutate(partId);
    }
  };

  const selectedItem = inventory.find(item => item.id === parseInt(selectedInventoryId));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Використані запчастини</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Додати запчастину
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Додати запчастину до ремонту</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Пошук товарів */}
                <div>
                  <Label htmlFor="search">Пошук товарів на складі</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Введіть назву або артикул товару..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Вибір товару */}
                <div>
                  <Label htmlFor="inventory">Товар</Label>
                  <Select value={selectedInventoryId} onValueChange={setSelectedInventoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть товар" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {filteredInventory.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({item.sku}) - Наявно: {item.quantity} шт.
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Інформація про вибраний товар */}
                {selectedItem && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Назва:</strong> {selectedItem.name}
                    </p>
                    <p className="text-sm">
                      <strong>Артикул:</strong> {selectedItem.sku}
                    </p>
                    <p className="text-sm">
                      <strong>Наявно на складі:</strong> {selectedItem.quantity} шт.
                    </p>
                    <p className="text-sm">
                      <strong>Вартість:</strong> {selectedItem.cost ? `${selectedItem.cost} грн` : "Не вказана"}
                    </p>
                  </div>
                )}

                {/* Кількість */}
                <div>
                  <Label htmlFor="quantity">Кількість</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedItem?.quantity || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>

                {/* Опис (необов'язково) */}
                <div>
                  <Label htmlFor="description">Додатковий опис (необов'язково)</Label>
                  <Input
                    id="description"
                    placeholder="Опис використання запчастини..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Скасувати
                  </Button>
                  <Button 
                    onClick={handleAddPart} 
                    disabled={!selectedInventoryId || quantity <= 0 || addPartMutation.isPending}
                  >
                    {addPartMutation.isPending ? "Додавання..." : "Додати"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {parts.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Запчастини ще не додавались
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Запчастина</TableHead>
                <TableHead>Кількість</TableHead>
                <TableHead>Вартість</TableHead>
                <TableHead>Опис</TableHead>
                <TableHead>Додано</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{part.inventoryItem?.name}</div>
                      <div className="text-sm text-gray-500">
                        Артикул: {part.inventoryItem?.sku}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{part.quantity} шт.</TableCell>
                  <TableCell>
                    {part.cost ? `${part.cost.toFixed(2)} грн` : "Не вказана"}
                  </TableCell>
                  <TableCell>{part.description || "-"}</TableCell>
                  <TableCell>
                    {part.createdAt ? formatUkrainianDate(new Date(part.createdAt)) : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => part.id && handleDeletePart(part.id)}
                      disabled={deletePartMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}