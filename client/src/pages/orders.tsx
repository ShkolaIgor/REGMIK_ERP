import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Eye, Edit } from "lucide-react";

export default function Orders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Очікує';
      case 'processing': return 'В обробці';
      case 'completed': return 'Завершено';
      case 'cancelled': return 'Скасовано';
      default: return status;
    }
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Замовлення</h2>
            <p className="text-gray-600">Управління клієнтськими замовленнями</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Нове замовлення
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-600">Всього замовлень</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-blue-600">
                  {orders.filter((o: any) => o.status === 'processing').length}
                </p>
                <p className="text-sm text-gray-600">В обробці</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">
                  {orders.filter((o: any) => o.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">Завершено</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0))}
                </p>
                <p className="text-sm text-gray-600">Загальна сума</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список замовлень</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Замовлення відсутні</p>
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Створити перше замовлення
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер замовлення</TableHead>
                    <TableHead>Клієнт</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Сума</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
