import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatUkrainianDate } from "@/lib/date-utils";
import { apiRequest } from "@/lib/queryClient";
import type { Repair } from "@shared/schema";
import { RepairForm } from "@/components/RepairForm";
import { RepairDetails } from "@/components/RepairDetails";

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

export default function Repairs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const queryClient = useQueryClient();

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["/api/repairs"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/repairs/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repairs"] });
    }
  });

  const filteredRepairs = repairs.filter((repair: Repair) => {
    const matchesSearch = repair.repairNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repair.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repair.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repair.productName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    const matchesType = typeFilter === "all" || repair.repairType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleEdit = (repair: Repair) => {
    setSelectedRepair(repair);
    setShowCreateForm(true);
  };

  const handleViewDetails = (repair: Repair) => {
    setSelectedRepair(repair);
    setShowDetailsDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей ремонт?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateNew = () => {
    setSelectedRepair(null);
    setShowCreateForm(true);
  };

  return (
    <div className="w-full px-4 py-3 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ремонти</h1>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Новий ремонт
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фільтри та пошук</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Пошук за номером ремонту, серійним номером, клієнтом..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі статуси</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Тип ремонту" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі типи</SelectItem>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Список ремонтів ({filteredRepairs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-4">Завантаження...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№ Ремонту</TableHead>
                  <TableHead>Серійний №</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>Клієнт</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата отримання</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRepairs.map((repair: Repair) => (
                  <TableRow key={repair.id}>
                    <TableCell className="font-medium">
                      {repair.repairNumber}
                    </TableCell>
                    <TableCell>{repair.serialNumber}</TableCell>
                    <TableCell>{repair.productName}</TableCell>
                    <TableCell>{repair.clientName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={repair.repairType === "warranty" ? "default" : "secondary"}>
                        {typeLabels[repair.repairType as keyof typeof typeLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(repair.status)}>
                        {statusLabels[repair.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatUkrainianDate(repair.receivedDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(repair)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(repair)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(repair.id)}
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
        </CardContent>
      </Card>

      {/* Форма створення/редагування ремонту */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRepair ? "Редагувати ремонт" : "Новий ремонт"}
            </DialogTitle>
          </DialogHeader>
          <RepairForm
            repair={selectedRepair}
            onSuccess={() => {
              console.log("onSuccess called in repairs.tsx");
              console.log("Setting showCreateForm to false");
              setShowCreateForm(false);
              setSelectedRepair(null);
              queryClient.invalidateQueries({ queryKey: ["/api/repairs"] });
            }}
            onCancel={() => {
              setShowCreateForm(false);
              setSelectedRepair(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Діалог деталей ремонту */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Деталі ремонту {selectedRepair?.repairNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedRepair && (
            <RepairDetails
              repair={selectedRepair}
              onClose={() => setShowDetailsDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}