import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, DollarSign, Clock, FileText, Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CostCalculation {
  id: number;
  name: string;
  productName: string;
  totalCost: number;
  margin: number;
  finalPrice: number;
  createdAt: string;
  status: string;
}

export default function CostCalculations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCalculation, setEditingCalculation] = useState<CostCalculation | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Mock data for demonstration
  const calculations: CostCalculation[] = [
    {
      id: 1,
      name: "Калькуляція №001",
      productName: "Виріб А",
      totalCost: 1500,
      margin: 25,
      finalPrice: 1875,
      createdAt: new Date().toISOString(),
      status: "active"
    }
  ];

  // Filter calculations
  const filteredCalculations = calculations.filter((calc: CostCalculation) => {
    const matchesSearch = !searchQuery || 
      calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      calc.productName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || calc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const totalCalculations = filteredCalculations.length;
  const activeCalculations = filteredCalculations.filter(c => c.status === "active").length;
  const totalValue = filteredCalculations.reduce((sum, c) => sum + c.finalPrice, 0);
  const avgMargin = filteredCalculations.length > 0 
    ? filteredCalculations.reduce((sum, c) => sum + c.margin, 0) / filteredCalculations.length 
    : 0;

  // DataTable columns
  const columns = [
    {
      key: "name",
      label: "Назва калькуляції",
      sortable: true,
    },
    {
      key: "productName",
      label: "Виріб",
      sortable: true,
    },
    {
      key: "totalCost",
      label: "Собівартість",
      sortable: true,
      render: (calc: CostCalculation) => `${calc.totalCost.toLocaleString("uk-UA")} ₴`,
    },
    {
      key: "margin",
      label: "Націнка",
      sortable: true,
      render: (calc: CostCalculation) => `${calc.margin}%`,
    },
    {
      key: "finalPrice",
      label: "Кінцева ціна",
      sortable: true,
      render: (calc: CostCalculation) => `${calc.finalPrice.toLocaleString("uk-UA")} ₴`,
    },
  ];

  // Card template
  const cardTemplate = (calc: CostCalculation) => (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{calc.name}</h3>
            <p className="text-sm text-muted-foreground">{calc.productName}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Собівартість:</span>
            <span className="font-medium">{calc.totalCost.toLocaleString("uk-UA")} ₴</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Кінцева ціна:</span>
            <span className="font-medium">{calc.finalPrice.toLocaleString("uk-UA")} ₴</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (authLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-6">Потрібна авторизація для перегляду калькуляцій</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Калькуляція собівартості</h1>
                <p className="text-purple-100 text-lg">Розрахунок вартості та формування цін</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm transition-all duration-300"
                disabled={!isAuthenticated}
              >
                <Plus className="w-4 h-4 mr-2" />
                Нова калькуляція
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Всього калькуляцій</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{totalCalculations}</p>
                  <p className="text-xs text-purple-600">Розрахунків в системі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Calculator className="w-8 h-8 text-white" />
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
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">Активні</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{activeCalculations}</p>
                  <p className="text-xs text-green-600">В роботі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Загальна вартість</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalValue.toLocaleString("uk-UA")} ₴</p>
                  <p className="text-xs text-blue-600">Сума всіх розрахунків</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <DollarSign className="w-8 h-8 text-white" />
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
                    <FileText className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Середня націнка</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{Math.round(avgMargin)}%</p>
                  <p className="text-xs text-orange-600">Прибутковість</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Пошук за назвою калькуляції або виробом..."
          filters={[
            {
              key: "status",
              label: "Статус",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "Всі статуси" },
                { value: "active", label: "Активні" },
                { value: "draft", label: "Чернетки" },
              ],
            },
          ]}
        />

        {/* DataTable */}
        <div className="w-full">
          <DataTable
            data={filteredCalculations}
            columns={columns}
            storageKey="cost-calculations-table"
            cardTemplate={cardTemplate}
            onRowClick={(calc) => setEditingCalculation(calc)}
            loading={false}
          />
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingCalculation} onOpenChange={(open) => !open && setEditingCalculation(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Деталі калькуляції</DialogTitle>
              <DialogDescription>
                Перегляд калькуляції собівартості
              </DialogDescription>
            </DialogHeader>
            {editingCalculation && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Функція редагування калькуляцій в розробці
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingCalculation(null)}>
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
              <DialogTitle>Нова калькуляція</DialogTitle>
              <DialogDescription>
                Створення калькуляції собівартості
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Функція створення калькуляцій в розробці
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