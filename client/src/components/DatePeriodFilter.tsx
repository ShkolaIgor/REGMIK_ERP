import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateFilterParams {
  period?: 'today' | 'last5days' | 'custom';
  dateFrom?: string;
  dateTo?: string;
}

interface DatePeriodFilterProps {
  onFilterChange: (params: DateFilterParams) => void;
  defaultPeriod?: string;
}

export function DatePeriodFilter({ onFilterChange, defaultPeriod = 'last5days' }: DatePeriodFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    
    if (period === 'today' || period === 'last5days') {
      onFilterChange({ period: period as 'today' | 'last5days' });
    } else if (period === 'custom' && customStartDate) {
      onFilterChange({
        period: 'custom',
        dateFrom: customStartDate.toISOString().split('T')[0],
        dateTo: customEndDate?.toISOString().split('T')[0]
      });
    }
  };

  const handleCustomDateChange = () => {
    if (selectedPeriod === 'custom' && customStartDate) {
      onFilterChange({
        period: 'custom',
        dateFrom: customStartDate.toISOString().split('T')[0],
        dateTo: customEndDate?.toISOString().split('T')[0]
      });
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Період імпорту
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="period-select">Оберіть період</Label>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger id="period-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Сьогодні</SelectItem>
              <SelectItem value="last5days">Останні 5 днів</SelectItem>
              <SelectItem value="custom">Вказати дати</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedPeriod === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Дата початку</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? (
                      format(customStartDate, "dd.MM.yyyy", { locale: uk })
                    ) : (
                      <span>Оберіть дату</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={(date) => {
                      setCustomStartDate(date);
                      setTimeout(handleCustomDateChange, 0);
                    }}
                    initialFocus
                    locale={uk}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Дата закінчення (опціонально)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? (
                      format(customEndDate, "dd.MM.yyyy", { locale: uk })
                    ) : (
                      <span>До сьогодні</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={(date) => {
                      setCustomEndDate(date);
                      setTimeout(handleCustomDateChange, 0);
                    }}
                    initialFocus
                    locale={uk}
                    disabled={(date) => customStartDate ? date < customStartDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {selectedPeriod === 'today' && 'Будуть завантажені документи, створені сьогодні'}
          {selectedPeriod === 'last5days' && 'Будуть завантажені документи за останні 5 днів'}
          {selectedPeriod === 'custom' && customStartDate && (
            `Будуть завантажені документи з ${format(customStartDate, "dd.MM.yyyy", { locale: uk })}${
              customEndDate ? ` по ${format(customEndDate, "dd.MM.yyyy", { locale: uk })}` : ' до сьогодні'
            }`
          )}
        </div>
      </CardContent>
    </Card>
  );
}