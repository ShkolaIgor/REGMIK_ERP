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
import { format } from "date-fns";
import { uk } from "date-fns/locale";

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd.MM.yyyy", { locale: uk });
    } catch {
      return null;
    }
  };

  const handleSetPaymentDate = (date: Date | null) => {
    const isoString = date ? date.toISOString() : null;
    onPaymentDateChange(order.id, isoString);
    setIsOpen(false);
  };

  const getQuickDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return [
      { label: "Сьогодні", date: today },
      { label: "Вчора", date: yesterday },
      { label: "Тиждень тому", date: weekAgo },
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
            
            <DropdownMenuItem
              onClick={() => {
                const customDate = prompt("Введіть дату оплати (дд.мм.рррр):");
                if (customDate) {
                  const parts = customDate.split(".");
                  if (parts.length === 3) {
                    const [day, month, year] = parts;
                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    if (!isNaN(date.getTime())) {
                      handleSetPaymentDate(date);
                    } else {
                      alert("Невірний формат дати");
                    }
                  } else {
                    alert("Введіть дату у форматі дд.мм.рррр");
                  }
                }
              }}
              className="cursor-pointer"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Інша дата...
            </DropdownMenuItem>
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