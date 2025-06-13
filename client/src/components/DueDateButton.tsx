import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatShortUkrainianDate } from "@/lib/date-utils";

interface DueDateButtonProps {
  order: any;
  onDueDateChange: (orderId: number, dueDate: string | null) => void;
  isLoading?: boolean;
}

export default function DueDateButton({ order, onDueDateChange, isLoading }: DueDateButtonProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    order.dueDate ? new Date(order.dueDate) : undefined
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const isoString = date.toISOString();
      onDueDateChange(order.id, isoString);
    } else {
      onDueDateChange(order.id, null);
    }
    setIsCalendarOpen(false);
  };

  const isOverdue = () => {
    if (!order.dueDate) return false;
    const dueDate = new Date(order.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const formatDueDate = (dateStr: string) => {
    return formatShortUkrainianDate(dateStr) || "Невірна дата";
  };

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-auto p-2 justify-start font-normal ${
            isOverdue() 
              ? "text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100" 
              : order.dueDate 
                ? "text-blue-600 hover:text-blue-700" 
                : "text-gray-500 hover:text-gray-700"
          }`}
          disabled={isLoading}
        >
          <Clock className="mr-2 h-4 w-4" />
          <div className="text-left">
            {order.dueDate ? (
              <div className={isOverdue() ? "font-medium" : ""}>
                {formatDueDate(order.dueDate)}
                {isOverdue() && (
                  <div className="text-xs text-red-500">Прострочено</div>
                )}
              </div>
            ) : (
              <span className="text-gray-400">Не встановлено</span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Термін виконання</h4>
          <p className="text-xs text-gray-500">
            Виберіть дату до якої має бути виконано замовлення
          </p>
        </div>
        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
          className="rounded-md"
        />
        <div className="p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => handleDateSelect(undefined)}
          >
            Очистити термін
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}