import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, FileText, AlertCircle } from "lucide-react";
import { UkrainianDateInput } from "@/components/ui/ukrainian-date-picker";

interface PaymentDialogProps {
  orderId: number;
  orderNumber: string;
  totalAmount: string;
  currentPaymentType?: string;
  currentPaidAmount?: string;
  isProductionApproved?: boolean;
  trigger?: React.ReactNode;
}

export function PaymentDialog({
  orderId,
  orderNumber,
  totalAmount,
  currentPaymentType = "none",
  currentPaidAmount = "0",
  isProductionApproved = false,
  trigger
}: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'contract' | 'none'>(currentPaymentType as any);
  const [paidAmount, setPaidAmount] = useState(currentPaidAmount);
  const [contractNumber, setContractNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [productionApproved, setProductionApproved] = useState(isProductionApproved);


  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return await apiRequest(`/api/orders/${orderId}/process-payment`, {
        method: "POST",
        body: paymentData,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Успішно",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося обробити платіж",
        variant: "destructive",
      });
    },
  });

  const cancelPaymentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/orders/${orderId}/cancel-payment`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Успішно",
        description: data.message || "Оплату скасовано",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося скасувати платіж",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const paymentData = {
      paymentType,
      paidAmount: paymentType === 'full' ? totalAmount : paidAmount,
      contractNumber: paymentType === 'contract' ? contractNumber : null,
      paymentDate: new Date(paymentDate).toISOString(),
      productionApproved: paymentType === 'contract' || paymentType === 'full' || productionApproved,
    };

    // Валідація
    if (paymentType === 'partial' && (!paidAmount || parseFloat(paidAmount) <= 0)) {
      toast({
        title: "Помилка",
        description: "Для часткової оплати вкажіть суму",
        variant: "destructive",
      });
      return;
    }

    if (paymentType === 'contract' && !contractNumber.trim()) {
      toast({
        title: "Помилка",
        description: "Для договірної роботи вкажіть номер договору",
        variant: "destructive",
      });
      return;
    }

    if (paymentType === 'partial' && parseFloat(paidAmount) > parseFloat(totalAmount)) {
      toast({
        title: "Помилка",
        description: "Сума оплати не може перевищувати загальну суму",
        variant: "destructive",
      });
      return;
    }

    processPaymentMutation.mutate(paymentData);
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full': return 'Повна оплата';
      case 'partial': return 'Часткова оплата';
      case 'contract': return 'По договору';
      case 'none': return 'Без оплати';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Оплата
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Обробка оплати замовлення #{orderNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Загальна сума: <span className="font-bold">{totalAmount} грн</span>
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentType">Тип оплати</Label>
            <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">💳 Повна оплата</SelectItem>
                <SelectItem value="partial">🔸 Часткова оплата</SelectItem>
                <SelectItem value="contract">📄 По договору</SelectItem>
                <SelectItem value="none">❌ Без оплати</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentType !== 'none' && (
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Дата оплати</Label>
              <UkrainianDateInput
                date={paymentDate ? new Date(paymentDate) : undefined}
                onDateChange={(date) => setPaymentDate(date ? date.toISOString().split('T')[0] : '')}
              />
            </div>
          )}

          {paymentType === 'partial' && (
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Сума оплати (грн)</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="Введіть суму"
              />
            </div>
          )}

          {paymentType === 'contract' && (
            <div className="space-y-2">
              <Label htmlFor="contractNumber">Номер договору</Label>
              <Input
                id="contractNumber"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="Введіть номер договору"
              />
            </div>
          )}

          {(paymentType === 'partial' || paymentType === 'none') && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
              <Checkbox
                id="productionApproved"
                checked={productionApproved}
                onCheckedChange={(checked) => setProductionApproved(checked as boolean)}
              />
              <Label htmlFor="productionApproved" className="text-sm">
                Дозволити запуск виробництва
              </Label>
            </div>
          )}



          {paymentType === 'partial' && !productionApproved && (
            <div className="flex items-start space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="text-sm text-orange-700">
                <p className="font-medium">Увага!</p>
                <p>Виробництво не буде запущено без дозволу.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={processPaymentMutation.isPending || cancelPaymentMutation.isPending}
            >
              Закрити
            </Button>
            
            {/* Показуємо кнопку скасування оплати якщо є оплата */}
            {currentPaymentType !== "none" && (
              <Button
                variant="destructive"
                onClick={() => cancelPaymentMutation.mutate()}
                disabled={processPaymentMutation.isPending || cancelPaymentMutation.isPending}
              >
                {cancelPaymentMutation.isPending ? "Скасування..." : "Скасувати оплату"}
              </Button>
            )}
            
            <Button
              onClick={handleSubmit}
              disabled={processPaymentMutation.isPending || cancelPaymentMutation.isPending}
            >
              {processPaymentMutation.isPending ? "Обробка..." : "Оплатити"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}