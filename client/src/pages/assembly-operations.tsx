import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, TrendingUp, Clock, Package, CheckCircle, Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface AssemblyOperation {
  id: number;
  name: string;
  productName: string;
  status: string;
  startTime: string;
  estimatedTime: number;
  actualTime?: number;
  assignedWorker: string;
  createdAt: string;
}

export default function AssemblyOperations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<AssemblyOperation | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Mock data for demonstration
  const operations: AssemblyOperation[] = [
    {
      id: 1,
      name: "Складання корпусу",
      productName: "Виріб А",
      status: "in_progress",
      startTime: new Date().toISOString(),
      estimatedTime: 120,
      assignedWorker: "Іванов І.І.",
      createdAt: new Date().toISOString()
    }
  ];

  // Filter operations
  const filteredOperations = operations.filter((op: AssemblyOperation) => {
    const matchesSearch = !searchQuery || 
      op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.assignedWorker.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || op.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const totalOperations = filteredOperations.length;
  const inProgressOperations = filteredOperations.filter(o => o.status === "in_progress").length;
  const completedOperations = filteredOperations.filter(o => o.status === "completed").length;
  const avgTime = filteredOperations.length > 0 
    ? filteredOperations.reduce((sum, o) => sum + o.estimatedTime, 0) / filteredOperations.length 
    : 0;

  // DataTable columns
  const columns = [
    {
      key: "name",
      label: "Назва операції",
      sortable: true,
    },
    {
      key: "productName",
      label: "Виріб",
      sortable: true,
    },
    {
      key: "status",
      label: "Статус",
      sortable: true,
      render: (op: AssemblyOperation) => {
        const statusMap = {
          "in_progress": { label: "В роботі", color: "bg-blue-100 text-blue-800" },
          "completed": { label: "Завершено", color: "bg-green-100 text-green-800" },
          "pending": { label: "Очікує", color: "bg-yellow-100 text-yellow-800" },
        };
        const status = statusMap[op.status as keyof typeof statusMap] || statusMap.pending;
        return <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>{status.label}</span>;
      },
    },
    {
      key: "assignedWorker",
      label: "Виконавець",
      sortable: true,
    },
    {
      key: "estimatedTime",
      label: "Час (хв)",
      sortable: true,
      render: (op: AssemblyOperation) => `${op.estimatedTime} хв`,
    },
  ];

  // Card template
  const cardTemplate = (op: AssemblyOperation) => (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{op.name}</h3>
            <p className="text-sm text-muted-foreground">{op.productName}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${
            op.status === "completed" ? "bg-green-100 text-green-800" :
            op.status === "in_progress" ? "bg-blue-100 text-blue-800" :
            "bg-yellow-100 text-yellow-800"
          }`}>
            {op.status === "completed" ? "Завершено" :
             op.status === "in_progress" ? "В роботі" : "Очікує"}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Виконавець:</span>
            <span className="font-medium">{op.assignedWorker}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Час:</span>
            <span className="text-sm">{op.estimatedTime} хв</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (authLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-6">Потрібна авторизація для перегляду операцій</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Складальні операції</h1>
                <p className="text-blue-100 text-lg">Управління виробничими процесами</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm transition-all duration-300"
                disabled={!isAuthenticated}
              >
                <Plus className="w-4 h-4 mr-2" />
                Нова операція
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього операцій</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalOperations}</p>
                  <p className="text-xs text-blue-600">Операцій в системі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">В роботі</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{inProgressOperations}</p>
                  <p className="text-xs text-orange-600">Активних операцій</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">Завершено</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{completedOperations}</p>
                  <p className="text-xs text-green-600">Виконаних операцій</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Середній час</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{Math.round(avgTime)} хв</p>
                  <p className="text-xs text-purple-600">На операцію</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Пошук за назвою операції, виробом або виконавцем..."
          filters={[
            {
              key: "status",
              label: "Статус",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "Всі статуси" },
                { value: "pending", label: "Очікує" },
                { value: "in_progress", label: "В роботі" },
                { value: "completed", label: "Завершено" },
              ],
            },
          ]}
        />

        {/* DataTable */}
        <div className="w-full">
          <DataTable
            data={filteredOperations}
            columns={columns}
            storageKey="assembly-operations-table"
            cardTemplate={cardTemplate}
            onRowClick={(op) => setEditingOperation(op)}
            loading={false}
          />
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingOperation} onOpenChange={(open) => !open && setEditingOperation(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Деталі операції</DialogTitle>
              <DialogDescription>
                Перегляд складальної операції
              </DialogDescription>
            </DialogHeader>
            {editingOperation && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Функція редагування операцій в розробці
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingOperation(null)}>
                    Закрити
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Нова операція</DialogTitle>
              <DialogDescription>
                Створення складальної операції
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Функція створення операцій в розробці
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Закрити
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}