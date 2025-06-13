import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatUkrainianDate } from "@/lib/date-utils";
import { apiRequest } from "@/lib/queryClient";
import type { Repair, RepairPart, RepairStatusHistory, RepairDocument } from "@shared/schema";

interface RepairDetailsProps {
  repair: Repair;
  onClose: () => void;
}

const statusLabels = {
  received: "Отримано",
  diagnosed: "Діагностовано", 
  in_repair: "В ремонті",
  testing: "Тестування",
  completed: "Завершено",
  returned: "Повернено",
  cancelled: "Скасовано"
};

const typeLabels = {
  warranty: "Гарантійний",
  non_warranty: "Позагарантійний"
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "received": return "secondary";
    case "diagnosed": return "default";
    case "in_repair": return "default";
    case "testing": return "secondary";
    case "completed": return "secondary";
    case "returned": return "default";
    case "cancelled": return "destructive";
    default: return "secondary";
  }
};

export function RepairDetails({ repair, onClose }: RepairDetailsProps) {
  const queryClient = useQueryClient();

  // Отримання запчастин ремонту
  const { data: parts = [] } = useQuery({
    queryKey: ["/api/repairs", repair.id, "parts"],
  });

  // Отримання історії статусів
  const { data: statusHistory = [] } = useQuery({
    queryKey: ["/api/repairs", repair.id, "status-history"],
  });

  // Отримання документів
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/repairs", repair.id, "documents"],
  });

  const deletePart = useMutation({
    mutationFn: (partId: number) => apiRequest(`/api/repairs/${repair.id}/parts/${partId}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repairs", repair.id, "parts"] });
    }
  });

  const changeStatus = useMutation({
    mutationFn: (data: { newStatus: string; comment?: string }) => 
      apiRequest(`/api/repairs/${repair.id}/status`, {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repairs", repair.id, "status-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repairs"] });
    }
  });

  const handleDeletePart = (partId: number) => {
    if (confirm("Ви впевнені, що хочете видалити цю запчастину?")) {
      deletePart.mutate(partId);
    }
  };

  const totalPartsCost = parts.reduce((sum: number, part: RepairPart) => 
    sum + parseFloat(part.totalPrice || "0"), 0
  );

  return (
    <div className="space-y-6">
      {/* Основна інформація */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Основна інформація</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Номер ремонту:</span>
              <span className="ml-2">{repair.repairNumber}</span>
            </div>
            <div>
              <span className="font-medium">Серійний номер:</span>
              <span className="ml-2">{repair.serialNumber}</span>
            </div>
            <div>
              <span className="font-medium">Товар:</span>
              <span className="ml-2">{repair.productName}</span>
            </div>
            <div>
              <span className="font-medium">Тип ремонту:</span>
              <Badge className="ml-2" variant={repair.repairType === "warranty" ? "default" : "secondary"}>
                {typeLabels[repair.repairType as keyof typeof typeLabels]}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Статус:</span>
              <Badge className="ml-2" variant={getStatusColor(repair.status)}>
                {statusLabels[repair.status as keyof typeof statusLabels]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Інформація про клієнта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Ім'я:</span>
              <span className="ml-2">{repair.clientName || "—"}</span>
            </div>
            <div>
              <span className="font-medium">Телефон:</span>
              <span className="ml-2">{repair.clientPhone || "—"}</span>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <span className="ml-2">{repair.clientEmail || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Дати */}
      <Card>
        <CardHeader>
          <CardTitle>Хронологія</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Дата отримання:</span>
              <div>{formatUkrainianDate(repair.receivedDate)}</div>
            </div>
            <div>
              <span className="font-medium">Дата діагностики:</span>
              <div>{repair.diagnosisDate ? formatUkrainianDate(repair.diagnosisDate) : "—"}</div>
            </div>
            <div>
              <span className="font-medium">Початок ремонту:</span>
              <div>{repair.repairStartDate ? formatUkrainianDate(repair.repairStartDate) : "—"}</div>
            </div>
            <div>
              <span className="font-medium">Завершення ремонту:</span>
              <div>{repair.repairEndDate ? formatUkrainianDate(repair.repairEndDate) : "—"}</div>
            </div>
            <div>
              <span className="font-medium">Дата повернення:</span>
              <div>{repair.returnDate ? formatUkrainianDate(repair.returnDate) : "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="description">Опис</TabsTrigger>
          <TabsTrigger value="parts">Запчастини</TabsTrigger>
          <TabsTrigger value="history">Історія</TabsTrigger>
          <TabsTrigger value="documents">Документи</TabsTrigger>
          <TabsTrigger value="costs">Вартість</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Опис проблеми</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{repair.problemDescription}</p>
            </CardContent>
          </Card>

          {repair.visualDamage && (
            <Card>
              <CardHeader>
                <CardTitle>Зовнішні пошкодження</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{repair.visualDamage}</p>
              </CardContent>
            </Card>
          )}

          {repair.accessories && (
            <Card>
              <CardHeader>
                <CardTitle>Комплектація</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{repair.accessories}</p>
              </CardContent>
            </Card>
          )}

          {repair.diagnosisDescription && (
            <Card>
              <CardHeader>
                <CardTitle>Діагностика</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{repair.diagnosisDescription}</p>
              </CardContent>
            </Card>
          )}

          {repair.testingResults && (
            <Card>
              <CardHeader>
                <CardTitle>Результати тестування</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{repair.testingResults}</p>
              </CardContent>
            </Card>
          )}

          {repair.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Внутрішні примітки</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{repair.internalNotes}</p>
              </CardContent>
            </Card>
          )}

          {repair.clientNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Примітки для клієнта</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{repair.clientNotes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="parts">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Використані запчастини
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Додати запчастину
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Запчастини не додано</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Назва</TableHead>
                      <TableHead>Кількість</TableHead>
                      <TableHead>Одиниця</TableHead>
                      <TableHead>Ціна за од.</TableHead>
                      <TableHead>Загальна вартість</TableHead>
                      <TableHead>Постачальник</TableHead>
                      <TableHead>Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part: RepairPart) => (
                      <TableRow key={part.id}>
                        <TableCell>{part.partName}</TableCell>
                        <TableCell>{part.quantity}</TableCell>
                        <TableCell>{part.unit}</TableCell>
                        <TableCell>{part.unitPrice} ₴</TableCell>
                        <TableCell>{part.totalPrice} ₴</TableCell>
                        <TableCell>{part.supplier || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeletePart(part.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {parts.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">Загальна вартість запчастин:</span>
                    <span className="font-bold">{totalPartsCost.toFixed(2)} ₴</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Історія зміни статусів</CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Історія відсутня</p>
              ) : (
                <div className="space-y-4">
                  {statusHistory.map((history: RepairStatusHistory) => (
                    <div key={history.id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {statusLabels[history.newStatus as keyof typeof statusLabels]}
                            </Badge>
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatUkrainianDate(history.changedAt)}
                            </span>
                          </div>
                          {history.comment && (
                            <p className="mt-2 text-sm text-gray-700">{history.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Документи та фото
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Завантажити файл
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Документи не завантажено</p>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc: RepairDocument) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <div className="font-medium">{doc.fileName}</div>
                          <div className="text-sm text-gray-600">
                            {doc.documentType} • {formatUkrainianDate(doc.uploadedAt)}
                          </div>
                          {doc.description && (
                            <div className="text-sm text-gray-600 mt-1">{doc.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Переглянути
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Вартість ремонту</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Орієнтовна вартість</div>
                    <div className="text-2xl font-bold">{repair.estimatedCost} ₴</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Фактична вартість</div>
                    <div className="text-2xl font-bold">{repair.actualCost} ₴</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Вартість роботи:</span>
                    <span className="font-medium">{repair.laborCost} ₴</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Вартість запчастин:</span>
                    <span className="font-medium">{repair.partsCost} ₴</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Запчастини (розрахована):</span>
                    <span className="font-medium">{totalPartsCost.toFixed(2)} ₴</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Загальна вартість:</span>
                    <span>{(parseFloat(repair.laborCost || "0") + parseFloat(repair.partsCost || "0")).toFixed(2)} ₴</span>
                  </div>
                </div>

                {repair.estimatedDuration && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700">Орієнтовний час ремонту</div>
                    <div className="font-medium text-blue-900">{repair.estimatedDuration} днів</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Кнопки дій */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onClose}>
          Закрити
        </Button>
        <Button>
          Редагувати ремонт
        </Button>
      </div>
    </div>
  );
}