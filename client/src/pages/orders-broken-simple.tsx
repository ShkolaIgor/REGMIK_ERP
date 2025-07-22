import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { HandPlatter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  orderNumber: string;
  clientName: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  currency: string;
}

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "orderNumber",
    header: "Номер замовлення",
    size: 150,
  },
  {
    accessorKey: "clientName", 
    header: "Клієнт",
    size: 200,
  },
  {
    accessorKey: "status",
    header: "Статус",
    size: 120,
  },
  {
    accessorKey: "totalAmount",
    header: "Сума",
    size: 100,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount"));
      const currency = row.original.currency || "UAH";
      return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: currency,
      }).format(amount);
    },
  },
  {
    accessorKey: "createdAt",
    header: "Дата створення",
    size: 130,
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString("uk-UA");
    },
  },
];

export default function Orders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <HandPlatter className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                    Замовлення клієнтів
                  </h1>
                  <p className="text-gray-600 mt-1">Управління замовленнями та їх статусами</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle>Список замовлень</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Завантаження...</div>
            ) : (
              <DataTable
                data={orders}
                columns={columns}
                searchPlaceholder="Пошук за номером замовлення або клієнтом..."
                noDataMessage="Замовлення не знайдені"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}