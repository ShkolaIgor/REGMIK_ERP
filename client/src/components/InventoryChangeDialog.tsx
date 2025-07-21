import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface InventoryChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    sku: string;
  };
  warehouse: {
    id: number;
    name: string;
  };
  currentQuantity: number;
  userId: number;
}

export function InventoryChangeDialog({
  isOpen,
  onClose,
  product,
  warehouse,
  currentQuantity,
  userId
}: InventoryChangeDialogProps) {
  const [newQuantity, setNewQuantity] = useState(currentQuantity.toString());
  const [reason, setReason] = useState("");
  const [changeType, setChangeType] = useState<"set" | "add" | "subtract">("set");
  const [changeAmount, setChangeAmount] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateInventoryMutation = useMutation({
    mutationFn: async (data: {
      productId: number;
      warehouseId: number;
      newQuantity: number;
      userId: number;
      reason: string;
    }) => {
      return apiRequest("/api/inventory/update-with-logging", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Кількість товару оновлено та дію зареєстровано",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити кількість товару",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewQuantity(currentQuantity.toString());
    setReason("");
    setChangeType("set");
    setChangeAmount("");
  };

  const handleQuantityChange = (type: "set" | "add" | "subtract", amount: string) => {
    const amountNum = parseFloat(amount) || 0;
    let calculated = currentQuantity;
    
    switch (type) {
      case "set":
        calculated = amountNum;
        break;
      case "add":
        calculated = currentQuantity + amountNum;
        break;
      case "subtract":
        calculated = Math.max(0, currentQuantity - amountNum);
        break;
    }
    
    setNewQuantity(calculated.toString());
  };

  const handleSubmit = () => {
    const newQty = parseFloat(newQuantity);
    
    if (isNaN(newQty) || newQty < 0) {
      toast({
        title: "Помилка",
        description: "Введіть коректну кількість (не менше 0)",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Помилка",
        description: "Вкажіть причину зміни кількості",
        variant: "destructive",
      });
      return;
    }

    updateInventoryMutation.mutate({
      productId: product.id,
      warehouseId: warehouse.id,
      newQuantity: newQty,
      userId,
      reason: reason.trim(),
    });
  };

  const quantityDifference = parseFloat(newQuantity) - currentQuantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Зміна кількості товару на складі</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Товар</Label>
            <p className="text-sm text-muted-foreground">{product.name} ({product.sku})</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Склад</Label>
            <p className="text-sm text-muted-foreground">{warehouse.name}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Поточна кількість</Label>
            <p className="text-sm font-semibold">{currentQuantity}</p>
          </div>

          <div className="space-y-3">
            <Label>Тип зміни</Label>
            <Select value={changeType} onValueChange={(value: "set" | "add" | "subtract") => {
              setChangeType(value);
              setChangeAmount("");
              setNewQuantity(currentQuantity.toString());
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="set">Встановити точну кількість</SelectItem>
                <SelectItem value="add">Додати до наявної кількості</SelectItem>
                <SelectItem value="subtract">Відняти від наявної кількості</SelectItem>
              </SelectContent>
            </Select>

            {changeType !== "set" && (
              <div>
                <Label htmlFor="changeAmount">Кількість для {changeType === "add" ? "додавання" : "віднімання"}</Label>
                <Input
                  id="changeAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={changeAmount}
                  onChange={(e) => {
                    setChangeAmount(e.target.value);
                    handleQuantityChange(changeType, e.target.value);
                  }}
                  placeholder="0"
                />
              </div>
            )}

            <div>
              <Label htmlFor="newQuantity">
                {changeType === "set" ? "Нова кількість" : "Результуюча кількість"}
              </Label>
              <Input
                id="newQuantity"
                type="number"
                min="0"
                step="0.01"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                disabled={changeType !== "set"}
              />
              {quantityDifference !== 0 && (
                <p className={`text-sm mt-1 ${quantityDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {quantityDifference > 0 ? '+' : ''}{quantityDifference.toFixed(2)} 
                  {quantityDifference > 0 ? ' (збільшення)' : ' (зменшення)'}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Причина зміни *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Вкажіть причину зміни кількості товару (інвентаризація, коригування, відвантаження, тощо)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Скасувати
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={updateInventoryMutation.isPending}
          >
            {updateInventoryMutation.isPending ? "Збереження..." : "Зберегти"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}