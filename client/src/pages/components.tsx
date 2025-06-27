import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, CheckCircle, Grid3X3, DollarSign, Layers, Search, Upload, Download, Edit, Trash, AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Interfaces
interface Component {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  categoryId: number | null;
  supplier: string | null;
  supplierId: number | null;
  unitPrice: string;
  unit: string;
  minStock: number | null;
  maxStock: number | null;
  currentStock: number;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function Components() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Queries
  const { data: components = [], isLoading } = useQuery({
    queryKey: ["/api/components"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/component-categories"],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Визначення колонок для DataTable
  const columns = [
    {
      key: 'name',
      label: 'Назва',
      sortable: true,
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Категорія',
      sortable: true,
    },
    {
      key: 'supplier',
      label: 'Постачальник',
      sortable: true,
    },
    {
      key: 'unitPrice',
      label: 'Ціна',
      sortable: true,
      render: (value: string) => `${parseFloat(value).toFixed(2)} ₴`
    },
    {
      key: 'currentStock',
      label: 'На складі',
      sortable: true,
      render: (value: number, row: Component) => `${value} ${row.unit}`
    },
    {
      key: 'isActive',
      label: 'Статус',
      sortable: true,
      render: (value: boolean) => value ? 'Активний' : 'Неактивний'
    }
  ];

  // Фільтрування компонентів
  const filteredComponents = useMemo(() => {
    if (!Array.isArray(components)) return [];
    
    return components.filter((component: Component) => {
      // Пошук
      const matchesSearch = !searchQuery || 
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (component.description && component.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Фільтр за категорією
      const matchesCategory = categoryFilter === "all" || 
        (categoryFilter === "null" && !component.categoryId) ||
        (component.categoryId && component.categoryId.toString() === categoryFilter);

      // Фільтр за постачальником
      const matchesSupplier = supplierFilter === "all" || 
        (supplierFilter === "null" && !component.supplierId) ||
        (component.supplierId && component.supplierId.toString() === supplierFilter);

      // Фільтр за статусом
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && component.isActive) ||
        (statusFilter === "inactive" && !component.isActive);

      return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
    });
  }, [components, searchQuery, categoryFilter, supplierFilter, statusFilter]);

  // Card template для DataTable
  const cardTemplate = (component: Component) => (
    <Card className="h-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {component.name}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                SKU: {component.sku}
              </Badge>
              {component.isActive ? (
                <Badge className="bg-green-100 text-green-800 text-xs">Активний</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Неактивний</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {component.category && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Grid3X3 className="w-4 h-4" />
              <span>{component.category}</span>
            </div>
          )}
          {component.supplier && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="w-4 h-4" />
              <span>{component.supplier}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>{parseFloat(component.unitPrice).toFixed(2)} ₴ за {component.unit}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4" />
            <span>На складі: {component.currentStock} {component.unit}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingComponent(component)}
            className="flex-1"
          >
            <Edit className="w-3 h-3 mr-1" />
            Редагувати
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Trash className="w-3 h-3 mr-1" />
            Видалити
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="container mx-auto p-6">
            <div className="text-center py-12">
              <p className="text-gray-600">Завантаження компонентів...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      Склад компонентів
                    </h1>
                    <p className="text-gray-600 mt-1">Управління складськими запасами компонентів</p>
                  </div>
                </div>
              </div>
            
              <div className="flex items-center space-x-4"> 
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Додати компонент
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <main className="w-full px-8 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700 font-medium">Показано компонентів</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-1">{filteredComponents.length}</p>
                    <p className="text-xs text-blue-600">З {components.length} загалом</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">Активні компоненти</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">{filteredComponents.filter((c: Component) => c.isActive).length}</p>
                    <p className="text-xs text-emerald-600">В використанні</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
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
                      <Grid3X3 className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">Категорії</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">{categories.length}</p>
                    <p className="text-xs text-purple-600">Різних типів</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Grid3X3 className="w-8 h-8 text-white" />
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
                      <DollarSign className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-700 font-medium">Середня ціна</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900 mb-1">{filteredComponents.length > 0 
                        ? Math.round(filteredComponents.reduce((sum: number, c: Component) => sum + parseFloat(c.unitPrice), 0) / filteredComponents.length)
                        : 0} ₴</p>
                    <p className="text-xs text-orange-600">За компонент</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="w-full py-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <SearchFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Пошук компонентів за назвою, SKU, описом..."
                    filters={[
                      {
                        key: "category",
                        label: "Категорія",
                        value: categoryFilter,
                        onChange: setCategoryFilter,
                        options: [
                          { value: "all", label: "Всі категорії" },
                          { value: "null", label: "Без категорії" },
                          ...categories.map((category: any) => ({
                            value: category.id.toString(),
                            label: category.name
                          }))
                        ]
                      },
                      {
                        key: "supplier",
                        label: "Постачальник",
                        value: supplierFilter,
                        onChange: setSupplierFilter,
                        options: [
                          { value: "all", label: "Всі постачальники" },
                          { value: "null", label: "Без постачальника" },
                          ...suppliers.map((supplier: any) => ({
                            value: supplier.id.toString(),
                            label: supplier.name
                          }))
                        ]
                      },
                      {
                        key: "status",
                        label: "Статус",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                          { value: "all", label: "Всі статуси" },
                          { value: "active", label: "Активні" },
                          { value: "inactive", label: "Неактивні" }
                        ]
                      }
                    ]}
                  />

                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsImportDialogOpen(true)}
                      className={`border-blue-200 text-blue-600 hover:bg-blue-50 ${!isAuthenticated ? 'opacity-50' : ''}`}
                      disabled={!isAuthenticated}
                      title={!isAuthenticated ? "Потрібна авторизація для імпорту" : ""}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Імпорт XML
                      {!isAuthenticated && <AlertTriangle className="ml-2 h-4 w-4 text-orange-500" />}
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Експорт
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DataTable */}
          <div className="w-full">
            <DataTable
              data={filteredComponents}
              columns={columns}
              storageKey="components-table"
              cardTemplate={cardTemplate}
              onRowClick={(component) => setEditingComponent(component)}
              actions={(component) => (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingComponent(component);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement delete functionality
                    }}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              )}
            />
          </div>
        </main>

        {/* Import XML Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Імпорт XML файлу</DialogTitle>
              <DialogDescription>
                Завантажте XML файл з компонентами
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="xml-file-components" className="text-sm font-medium">
                  Оберіть XML файл
                </label>
                <input
                  id="xml-file-components"
                  type="file"
                  accept=".xml"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Скасувати
                </Button>
                <Button onClick={() => {
                  // TODO: Implement XML import logic
                  toast({ title: "Функція імпорту в розробці" });
                  setIsImportDialogOpen(false);
                }}>
                  Імпортувати
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}