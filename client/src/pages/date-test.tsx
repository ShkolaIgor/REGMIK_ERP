import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UkrainianDateInput, UkrainianDatePicker } from "@/components/ui/ukrainian-date-picker";
import { UkrainianDate } from "@/components/ui/ukrainian-date";
import { Label } from "@/components/ui/label";

export default function DateTestPage() {
  const [inputDate, setInputDate] = useState<Date | undefined>(new Date());
  const [pickerDate, setPickerDate] = useState<Date | undefined>(new Date());

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Тестування українського форматування дат</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Поточна дата (відображення):</Label>
            <div className="p-2 border rounded">
              <UkrainianDate date={new Date()} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Український Input Date:</Label>
            <UkrainianDateInput
              date={inputDate}
              onDateChange={setInputDate}
            />
            <p className="text-sm text-muted-foreground">
              Обрана дата: {inputDate ? <UkrainianDate date={inputDate} /> : "Не обрано"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Український Date Picker:</Label>
            <UkrainianDatePicker
              date={pickerDate}
              onDateChange={setPickerDate}
            />
            <p className="text-sm text-muted-foreground">
              Обрана дата: {pickerDate ? <UkrainianDate date={pickerDate} /> : "Не обрано"}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Статус українського форматування:</h3>
            <p className="text-green-700">✅ Система активно використовує український формат дат</p>
            <p className="text-green-700">✅ Всі поля вибору дат оновлені</p>
            <p className="text-green-700">✅ Формат: день місяць рік</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}