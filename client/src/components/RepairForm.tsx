import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UkrainianDatePicker } from "@/components/ui/ukrainian-date-picker";
import { apiRequest } from "@/lib/queryClient";
import { insertRepairSchema, type Repair, type SerialNumber, type Client, type Worker } from "@shared/schema";
import { z } from "zod";

const formSchema = insertRepairSchema.extend({
  receivedDate: z.date().optional(),
  diagnosisDate: z.date().optional(),
  repairStartDate: z.date().optional(),
  repairEndDate: z.date().optional(),
  returnDate: z.date().optional(),
  warrantyStartDate: z.date().optional(),
  warrantyEndDate: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RepairFormProps {
  repair?: Repair | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RepairForm({ repair, onSuccess, onCancel }: RepairFormProps) {
  const [searchSerial, setSearchSerial] = useState("");
  const [selectedSerial, setSelectedSerial] = useState<SerialNumber | null>(null);
  const [showSerialSearch, setShowSerialSearch] = useState(!repair);

  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repairType: "warranty",
      status: "received",
      estimatedCost: "0",
      actualCost: "0",
      laborCost: "0",
      partsCost: "0",
      warrantyPeriod: 0,
      qualityRating: "good",
      ...repair
    }
  });

  // Пошук серійних номерів
  const { data: serialNumbers = [] } = useQuery({
    queryKey: ["/api/serial-numbers/for-repair", searchSerial],
    enabled: searchSerial.length > 0
  });

  // Отримання клієнтів
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"]
  });

  // Отримання працівників
  const { data: workers = [] } = useQuery({
    queryKey: ["/api/workers"]
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/repairs", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repairs"] });
      onSuccess();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest(`/api/repairs/${repair?.id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repairs"] });
      onSuccess();
    }
  });

  const handleSubmit = (data: FormData) => {
    if (repair) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSerialSelect = async (serial: SerialNumber) => {
    setSelectedSerial(serial);
    setShowSerialSearch(false);
    
    // Автозаповнення полів
    form.setValue("serialNumberId", serial.id);
    form.setValue("serialNumber", serial.serialNumber);
    form.setValue("productId", serial.productId);
    form.setValue("clientName", serial.clientShortName || "");
    
    // Отримати інформацію про продукт
    try {
      const productResponse = await apiRequest(`/api/products/${serial.productId}`);
      if (productResponse && productResponse.name) {
        form.setValue("productName", productResponse.name);
      }
    } catch (error) {
      console.error("Помилка отримання інформації про продукт:", error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Пошук серійного номера (тільки для нових ремонтів) */}
      {showSerialSearch && (
        <Card>
          <CardHeader>
            <CardTitle>Вибір серійного номера</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Введіть серійний номер або назву клієнта..."
                  value={searchSerial}
                  onChange={(e) => setSearchSerial(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {serialNumbers.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {serialNumbers.map((serial: SerialNumber) => (
                    <div
                      key={serial.id}
                      className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSerialSelect(serial)}
                    >
                      <div className="font-medium">{serial.serialNumber}</div>
                      <div className="text-sm text-gray-600">
                        Клієнт: {serial.clientShortName || "—"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Продаж: {serial.saleDate ? new Date(serial.saleDate).toLocaleDateString("uk-UA") : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Основна інформація */}
          <Card>
            <CardHeader>
              <CardTitle>Основна інформація</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="repairType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип ремонту</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="warranty">Гарантійний</SelectItem>
                          <SelectItem value="non_warranty">Позагарантійний</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="received">Отримано</SelectItem>
                          <SelectItem value="diagnosed">Діагностовано</SelectItem>
                          <SelectItem value="in_repair">В ремонті</SelectItem>
                          <SelectItem value="testing">Тестування</SelectItem>
                          <SelectItem value="completed">Завершено</SelectItem>
                          <SelectItem value="returned">Повернено</SelectItem>
                          <SelectItem value="cancelled">Скасовано</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedSerial && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Обраний серійний номер:</h4>
                  <p><strong>№:</strong> {selectedSerial.serialNumber}</p>
                  <p><strong>Клієнт:</strong> {selectedSerial.clientShortName || "—"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Інформація про клієнта */}
          <Card>
            <CardHeader>
              <CardTitle>Інформація про клієнта</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клієнт</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть клієнта" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client: Client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ім'я клієнта</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Опис проблеми */}
          <Card>
            <CardHeader>
              <CardTitle>Опис проблеми</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="problemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Опис проблеми</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visualDamage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Зовнішні пошкодження</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Комплектація</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Дати */}
          <Card>
            <CardHeader>
              <CardTitle>Дати</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receivedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата отримання</FormLabel>
                      <FormControl>
                        <UkrainianDatePicker
                          date={field.value}
                          onDateChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnosisDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата діагностики</FormLabel>
                      <FormControl>
                        <UkrainianDatePicker
                          date={field.value}
                          onDateChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repairStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Початок ремонту</FormLabel>
                      <FormControl>
                        <UkrainianDatePicker
                          date={field.value}
                          onDateChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repairEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Завершення ремонту</FormLabel>
                      <FormControl>
                        <UkrainianDatePicker
                          date={field.value}
                          onDateChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Вартість */}
          <Card>
            <CardHeader>
              <CardTitle>Вартість</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Орієнтовна вартість</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actualCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фактична вартість</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Вартість роботи</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Вартість запчастин</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Працівники */}
          <Card>
            <CardHeader>
              <CardTitle>Працівники</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="receivedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Прийняв</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть працівника" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workers.map((worker: Worker) => (
                            <SelectItem key={worker.id} value={worker.id.toString()}>
                              {worker.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diagnosedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Діагностував</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть працівника" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workers.map((worker: Worker) => (
                            <SelectItem key={worker.id} value={worker.id.toString()}>
                              {worker.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repairedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ремонтував</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть працівника" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workers.map((worker: Worker) => (
                            <SelectItem key={worker.id} value={worker.id.toString()}>
                              {worker.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Примітки */}
          <Card>
            <CardHeader>
              <CardTitle>Примітки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Внутрішні примітки</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примітки для клієнта</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Кнопки */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Скасувати
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Збереження..." : repair ? "Оновити" : "Створити"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}