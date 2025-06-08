import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar, Check, X, Clock } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PaymentDateButtonProps {
  order: {
    id: number;
    paymentDate: string | null;
  };
  onPaymentDateChange: (orderId: number, paymentDate: string | null) => void;
  isLoading?: boolean;
}

export function PaymentDateButton({ order, onPaymentDateChange, isLoading }: PaymentDateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();

  // Мутація для автоматичного створення виробничих завдань
  const processPaymentMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return await apiRequest(`/api/orders/${orderId}/process-payment`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Успішно",
        description: "Створено завдання на виробництво для оплаченого замовлення",
      });
    },
    onError: (error) => {
      console.error("Помилка при обробці оплати:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити завдання на виробництво",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd.MM.yyyy", { locale: uk });
    } catch {
      return null;
    }
  };

  const handleSetPaymentDate = async (date: Date | null) => {
    const isoString = date ? date.toISOString() : null;
    const wasUnpaid = !order.paymentDate;
    
    // Спочатку оновлюємо дату оплати
    onPaymentDateChange(order.id, isoString);
    
    // Якщо замовлення було неоплаченим і тепер стає оплаченим - створюємо виробничі завдання
    if (wasUnpaid && isoString) {
      processPaymentMutation.mutate(order.id);
    }
    
    setIsOpen(false);
  };

  const getQuickDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

    return [
      { label: "Сьогодні", date: today },
      { label: "Вчора", date: yesterday },
      { label: "Позавчора", date: dayBeforeYesterday },
    ];
  };

  const isPaid = !!order.paymentDate;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isPaid ? "default" : "outline"}
          size="sm"
          disabled={isLoading}
          className={`
            ${isPaid 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "text-gray-500 hover:text-gray-700 border-gray-300"
            }
            ${isLoading ? "opacity-50" : ""}
          `}
        >
          {isPaid ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              {formatDate(order.paymentDate)}
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 mr-1" />
              Не оплачено
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {!isPaid && (
          <>
            {getQuickDates().map((item) => (
              <DropdownMenuItem
                key={item.label}
                onClick={() => handleSetPaymentDate(item.date)}
                className="cursor-pointer"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {item.label}
                <span className="ml-auto text-xs text-gray-500">
                  {format(item.date, "dd.MM", { locale: uk })}
                </span>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsCalendarOpen(true);
                    setIsOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Інша дата...
                </DropdownMenuItem>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleSetPaymentDate(date);
                    }
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </>
        )}
        
        {isPaid && (
          <DropdownMenuItem
            onClick={() => handleSetPaymentDate(null)}
            className="cursor-pointer text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-2" />
            Скасувати оплату
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}