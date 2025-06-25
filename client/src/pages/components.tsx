import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash, Plus, Package, Search, Link, Upload, Filter, X } from "lucide-react";
import { Component } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ComponentsXmlImport } from "@/components/ComponentsXmlImport";
import { ImportWizard } from "@/components/ImportWizard";
import { Badge } from "@/components/ui/badge";

export default function Components() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [selectedComponentForAlternatives, setSelectedComponentForAlternatives] = useState<Component | null>(null);
  const [isAlternativesDialogOpen, setIsAlternativesDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  
  // DataTable columns
  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: 'Назва',
      sortable: true,
      render: (value) => <span className="font-bold">{value}</span>
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true
    },
    {
      key: 'category',
      label: 'Категорія',
      sortable: true,
      render: (value, row) => {
        const category = categories.find((cat: any) => cat.id === row.categoryId);
        return category ? (
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{ backgroundColor: category.color + '20', color: category.color }}
          >
            {category.name}
          </Badge>
        ) : (
          <span className="text-gray-400">—</span>
        );
      }
    },
    {
      key: 'description',
      label: 'Опис',
      render: (value) => (
        <span className="max-w-xs truncate block" title={value || ""}>
          {value || "—"}
        </span>
      )
    },
    {
      key: 'unit',
      label: 'Одиниця',
      render: (value, row) => 
        units.find((unit: any) => unit.id === row.unitId)?.shortName || "шт"
    },
    {
      key: 'costPrice',
      label: 'Собівартість',
      sortable: true
    },
    {
      key: 'supplier',
      label: 'Постачальник',
      sortable: true,
      render: (value) => value || "—"
    }
  ];
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unitId: 1,
    costPrice: "",
    supplier: "",
    partNumber: "",
    manufacturer: "",
    uktzedCode: "",
    minStock: "",
    maxStock: "",
    isActive: true,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: components = [], isLoading } = useQuery({
    queryKey: ["/api/components"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/component-categories"],
  });

  const { data: units = [] } = useQuery({
    queryKey: ["/api/units"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/components", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      toast({
        title: "Компонент створено",
        description: "Новий компонент було успішно додано.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити компонент.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/components/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      toast({
        title: "Компонент оновлено",
        description: "Компонент було успішно оновлено.",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити компонент.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/components/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      toast({
        title: "Компонент видалено",
        description: "Компонент було успішно видалено.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити компонент.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      unitId: 1,
      costPrice: "",
      supplier: "",
      partNumber: "",
      manufacturer: "",
      uktzedCode: "",
      minStock: "",
      maxStock: "",
      isActive: true,
    });
    setEditingComponent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      costPrice: formData.costPrice,
      minStock: formData.minStock ? parseInt(formData.minStock) : null,
      maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
      isActive: formData.isActive,
    };

    if (editingComponent) {
      updateMutation.mutate({ id: editingComponent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (component: Component) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      sku: component.sku,
      description: component.description || "",
      unitId: component.unitId || 1,
      costPrice: component.costPrice,
      supplier: component.supplier || "",
      partNumber: component.partNumber || "",
      manufacturer: component.manufacturer || "",
      uktzedCode: component.uktzedCode || "",
      minStock: component.minStock?.toString() || "",
      maxStock: component.maxStock?.toString() || "",
      isActive: component.isActive !== false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей компонент?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredAndSortedComponents = components
    .filter(component => {
      const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           component.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (component.supplier && component.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === "all" || !filterCategory || 
                             (component.categoryId && component.categoryId.toString() === filterCategory);
      const matchesSupplier = filterSupplier === "all" || !filterSupplier ||
                             (component.supplier && component.supplier === filterSupplier);
      const matchesActive = filterActive === "all" || 
                           (filterActive === "active" && component.isActive !== false) ||
                           (filterActive === "inactive" && component.isActive === false);
      
      return matchesSearch && matchesCategory && matchesSupplier && matchesActive;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "sku":
          aVal = a.sku.toLowerCase();
          bVal = b.sku.toLowerCase();
          break;
        case "costPrice":
          aVal = parseFloat(a.costPrice);
          bVal = parseFloat(b.costPrice);
          break;
        case "supplier":
          aVal = (a.supplier || "").toLowerCase();
          bVal = (b.supplier || "").toLowerCase();
          break;
        case "category":
          const categoryA = categories.find((cat: any) => cat.id === a.categoryId);
          const categoryB = categories.find((cat: any) => cat.id === b.categoryId);
          aVal = (categoryA?.name || "").toLowerCase();
          bVal = (categoryB?.name || "").toLowerCase();
          break;
        case "createdAt":
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination
  const totalItems = filteredAndSortedComponents.length;
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize);
  const startIndex = pageSize === -1 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalItems : startIndex + pageSize;
  const paginatedComponents = filteredAndSortedComponents.slice(startIndex, endIndex);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleHeaderClick = (e: React.MouseEvent, field: string) => {
    // Only handle sort if click is not on resize handle
    const target = e.target as HTMLElement;
    if (!target.classList.contains('resize-handle')) {
      e.stopPropagation();
      handleSort(field);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50/30">
      <style jsx>{`
        .resize-handle {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          cursor: col-resize;
          background: transparent;
        }
        .resize-handle:hover {
          background: #3b82f6;
        }
        th {
          position: relative;
        }
        .resizable-header {
          resize: horizontal;
          overflow: hidden;
        }
      `}</style>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Компоненти</h1>
            <p className="text-gray-600">Управління компонентами для складу продуктів</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Імпорт компонентів
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingComponent(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Додати компонент
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingComponent ? "Редагувати компонент" : "Додати компонент"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Назва</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="unitId">Одиниця виміру</Label>
                      <Select value={formData.unitId.toString()} onValueChange={(value) => setFormData({ ...formData, unitId: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть одиницю виміру" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit: any) => (
                            <SelectItem key={unit.id} value={unit.id.toString()}>
                              {unit.name} ({unit.shortName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="costPrice">Собівартість</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Постачальник</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="partNumber">Номер деталі</Label>
                      <Input
                        id="partNumber"
                        value={formData.partNumber}
                        onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="manufacturer">Виробник</Label>
                      <Input
                        id="manufacturer"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="uktzedCode">Код УКТЗЕД</Label>
                      <Input
                        id="uktzedCode"
                        value={formData.uktzedCode}
                        onChange={(e) => setFormData({ ...formData, uktzedCode: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minStock">Мінімальний запас</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxStock">Максимальний запас</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        value={formData.maxStock}
                        onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="description">Опис</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div className="col-span-2 flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Активний</Label>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      {editingComponent && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Ви впевнені, що хочете видалити цей компонент?")) {
                              handleDelete(editingComponent.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Видалити
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Скасувати
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingComponent ? "Оновити" : "Створити"}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Пошук та фільтри */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Пошук за назвою, SKU або постачальником..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Фільтри
              {(filterCategory !== "all" || filterSupplier !== "all" || filterActive !== "all") && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {[filterCategory, filterSupplier, filterActive].filter(f => f !== "all").length}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Всі категорії" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі категорії</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Всі постачальники" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі постачальники</SelectItem>
                  {[...new Set(components.map((c: any) => c.supplier).filter(Boolean))].map((supplier: string) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  <SelectItem value="active">Активні</SelectItem>
                  <SelectItem value="inactive">Неактивні</SelectItem>
                </SelectContent>
              </Select>

              {(filterCategory !== "all" || filterSupplier !== "all" || filterActive !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterCategory("all");
                    setFilterSupplier("all");
                    setFilterActive("all");
                  }}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Очистити фільтри
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Пагінація верхня */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Показано {startIndex + 1}-{Math.min(endIndex, totalItems)} з {totalItems} записів
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Розмір сторінки:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(value === "all" ? -1 : parseInt(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Всі</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          data={components}
          columns={columns}
          loading={isLoading}
          searchable={true}
          onSearch={(query) => setSearchTerm(query)}
          actions={(row) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row)}
              title="Редагувати"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          title="Компоненти"
          storageKey="components-table"
        />



        {/* Діалог управління аналогами */}
        <Dialog open={isAlternativesDialogOpen} onOpenChange={setIsAlternativesDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Управління аналогами</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-gray-600">Функціональність аналогів буде додана пізніше.</p>
              <Button onClick={() => setIsAlternativesDialogOpen(false)} className="mt-4">
                Закрити
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Діалог імпорту */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Імпорт компонентів</DialogTitle>
            </DialogHeader>
            {showImportWizard ? (
              <ImportWizard 
                importType="components"
                onProceedToImport={() => setShowImportWizard(false)}
              />
            ) : (
              <ComponentsXmlImport />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}