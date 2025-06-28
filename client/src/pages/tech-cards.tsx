import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Clock, DollarSign, FileText, Upload, ClipboardList, Wrench, Settings, Package, Component, Calculator } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";

interface TechCard {
  id: number;
  name: string;
  description: string | null;
  productId: number | null;
  instructions: string | null;
  estimatedTime: number | null;
  requiredSkills: string | null;
  toolsRequired: string | null;
  qualityStandards: string | null;
  safetyNotes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface InsertTechCard {
  name: string;
  description: string | null;
  productId: number | null;
  instructions: string | null;
  estimatedTime: number | null;
  requiredSkills: string | null;
  toolsRequired: string | null;
  qualityStandards: string | null;
  safetyNotes: string | null;
}

export default function TechCards() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTechCard, setEditingTechCard] = useState<TechCard | null>(null);
  const [formData, setFormData] = useState<InsertTechCard>({
    name: "",
    description: null,
    productId: null,
    instructions: null,
    estimatedTime: null,
    requiredSkills: null,
    toolsRequired: null,
    qualityStandards: null,
    safetyNotes: null
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: techCards = [], isLoading } = useQuery<TechCard[]>({
    queryKey: ["/api/tech-cards"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Фільтровані дані для пошуку
  const filteredTechCards = Array.isArray(techCards) ? techCards.filter(techCard => {
    const matchesSearch = techCard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (techCard.description && techCard.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === "all" || 
      (typeFilter === "with-product" && techCard.productId) ||
      (typeFilter === "without-product" && !techCard.productId);
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && techCard.productId) ||
      (statusFilter === "draft" && !techCard.productId);
    
    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  // Статистичні дані
  const totalTechCards = Array.isArray(techCards) ? techCards.length : 0;
  const techCardsWithProduct = Array.isArray(techCards) ? techCards.filter(tc => tc.productId).length : 0;
  const averageTime = Array.isArray(techCards) && techCards.length > 0 
    ? Math.round(techCards.filter(tc => tc.estimatedTime).reduce((sum, tc) => sum + (tc.estimatedTime || 0), 0) / techCards.filter(tc => tc.estimatedTime).length) 
    : 0;
  const totalWithInstructions = Array.isArray(techCards) ? techCards.filter(tc => tc.instructions).length : 0;

  const createMutation = useMutation({
    mutationFn: async (data: InsertTechCard) => {
      try {
        if (editingTechCard) {
          const response = await apiRequest(`/api/tech-cards/${editingTechCard.id}`, {
            method: "PUT",
            body: JSON.stringify(data),
          });
          return response;
        } else {
          const response = await apiRequest("/api/tech-cards", {
            method: "POST",
            body: JSON.stringify(data),
          });
          return response;
        }
      } catch (error: any) {
        console.error("TechCard operation error:", error);
        throw new Error(error.message || "Помилка операції з технологічною картою");
      }
    },
    onSuccess: () => {
      toast({
        title: editingTechCard ? "Технологічну карту оновлено" : "Технологічну карту створено",
        description: editingTechCard ? "Технологічну карту успішно оновлено" : "Нову технологічну карту успішно створено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tech-cards"] });
      resetForm();
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося зберегти технологічну карту",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: null,
      productId: null,
      instructions: null,
      estimatedTime: null,
      requiredSkills: null,
      toolsRequired: null,
      qualityStandards: null,
      safetyNotes: null
    });
    setEditingTechCard(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Колонки для DataTable
  const columns = [
    {
      key: "name",
      label: "Назва технологічної карти",
      sortable: true,
    },
    {
      key: "product",
      label: "Продукт",
      render: (techCard: TechCard) => {
        const product = products.find((p: any) => p.id === techCard.productId);
        return product?.name || "—";
      }
    },
    {
      key: "estimatedTime",
      label: "Час (хв)",
      render: (techCard: TechCard) => techCard.estimatedTime || "—"
    },
    {
      key: "status",
      label: "Статус",
      render: (techCard: TechCard) => {
        if (techCard.productId && techCard.instructions) {
          return <span className="text-green-600 font-medium">Готова</span>;
        } else if (techCard.instructions) {
          return <span className="text-yellow-600 font-medium">В розробці</span>;
        } else {
          return <span className="text-gray-500 font-medium">Чернетка</span>;
        }
      }
    },
    {
      key: "actions",
      label: "Дії",
      render: (techCard: TechCard) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTechCard(techCard);
              setFormData({
                name: techCard.name,
                description: techCard.description,
                productId: techCard.productId,
                instructions: techCard.instructions,
                estimatedTime: techCard.estimatedTime,
                requiredSkills: techCard.requiredSkills,
                toolsRequired: techCard.toolsRequired,
                qualityStandards: techCard.qualityStandards,
                safetyNotes: techCard.safetyNotes
              });
              setIsCreateOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="w-full p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Завантаження технологічних карт...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="w-full px-8 py-3">
          {/* Header з градієнтом */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ClipboardList className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Склад технологічних карт</h1>
                  <p className="text-gray-500 mt-1">Управління технологічними процесами та інструкціями</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setIsImportDialogOpen(true)}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Імпорт XML
                </Button>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Plus className="w-4 h-4 mr-2" />
                      Нова технологічна карта
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingTechCard ? "Редагувати технологічну карту" : "Створити нову технологічну карту"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Назва технологічної карти</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="productId">Продукт</Label>
                          <Select
                            value={formData.productId?.toString() || ""}
                            onValueChange={(value) => setFormData({ ...formData, productId: value ? parseInt(value) : null })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть продукт" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product: any) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Опис</Label>
                        <Textarea
                          id="description"
                          value={formData.description || ""}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="instructions">Технологічні інструкції</Label>
                        <Textarea
                          id="instructions"
                          value={formData.instructions || ""}
                          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                          rows={5}
                          placeholder="Детальні інструкції технологічного процесу..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="estimatedTime">Орієнтовний час (хвилини)</Label>
                          <Input
                            id="estimatedTime"
                            type="number"
                            value={formData.estimatedTime || ""}
                            onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value ? parseInt(e.target.value) : null })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="requiredSkills">Необхідні навички</Label>
                          <Input
                            id="requiredSkills"
                            value={formData.requiredSkills || ""}
                            onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                            placeholder="Навички оператора"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="toolsRequired">Необхідні інструменти</Label>
                          <Textarea
                            id="toolsRequired"
                            value={formData.toolsRequired || ""}
                            onChange={(e) => setFormData({ ...formData, toolsRequired: e.target.value })}
                            rows={3}
                            placeholder="Список інструментів та обладнання"
                          />
                        </div>
                        <div>
                          <Label htmlFor="qualityStandards">Стандарти якості</Label>
                          <Textarea
                            id="qualityStandards"
                            value={formData.qualityStandards || ""}
                            onChange={(e) => setFormData({ ...formData, qualityStandards: e.target.value })}
                            rows={3}
                            placeholder="Критерії якості продукції"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="safetyNotes">Примітки з безпеки</Label>
                        <Textarea
                          id="safetyNotes"
                          value={formData.safetyNotes || ""}
                          onChange={(e) => setFormData({ ...formData, safetyNotes: e.target.value })}
                          rows={3}
                          placeholder="Важливі примітки з техніки безпеки"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => { resetForm(); setIsCreateOpen(false); }}>
                          Скасувати
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                        >
                          {createMutation.isPending ? "Збереження..." : (editingTechCard ? "Оновити" : "Створити")}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          </div>

          {/* Статистичні картки - Statistics Cards */}
          <main className="w-full px-8 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
                <CardContent className="p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-blue-700 font-medium">Всього тех. карт</p>
                      </div>
                      <p className="text-3xl font-bold text-blue-900 mb-1">{totalTechCards}</p>
                      <p className="text-xs text-blue-600">заповнено</p>
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
                        <Component className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm text-emerald-700 font-medium">З продуктами</p>
                      </div>
                      <p className="text-3xl font-bold text-emerald-900 mb-1">{techCardsWithProduct}</p>
                      <p className="text-xs text-emerald-600">карток</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                      <Component className="w-8 h-8 text-white" />
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
                        <Clock className="w-4 h-4 text-purple-600" />
                        <p className="text-sm text-purple-700 font-medium">Середній час</p>
                      </div>
                      <p className="text-3xl font-bold text-purple-900 mb-1">{averageTime}</p>
                      <p className="text-xs text-purple-600">хв.</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                      <Clock className="w-8 h-8 text-white" />
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
                        <p className="text-sm text-orange-700 font-medium">З інструкціями</p>
                      </div>
                      <p className="text-3xl font-bold text-orange-900 mb-1">{totalWithInstructions}</p>
                      <p className="text-xs text-orange-600">З інструкціями</p>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>


          {/* Пошук та фільтри */}
          <div className="w-full py-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Пошук технологічних карт за назвою або описом..."
            filters={[
              {
                key: "status",
                label: "Статус",
                value: statusFilter,
                options: [
                  { value: "all", label: "Всі статуси" },
                  { value: "active", label: "Готові" },
                  { value: "draft", label: "Чернетки" }
                ],
                onChange: setStatusFilter
              },
              {
                key: "type",
                label: "Тип",
                value: typeFilter,
                options: [
                  { value: "all", label: "Всі типи" },
                  { value: "with-product", label: "З продуктом" },
                  { value: "without-product", label: "Без продукту" }
                ],
                onChange: setTypeFilter
              }
            ]}
          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

          {/* Основна таблиця */}
          <main className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            <DataTable
              data={filteredTechCards}
              columns={columns}
              loading={isLoading}
              title="Список технологічних карт"
              storageKey="tech-cards-table"
            />
          </main>

          {/* Import XML Dialog */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Імпорт XML файлу</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="xml-file-tech-cards" className="text-sm font-medium">
                    Оберіть XML файл з технологічними картами
                  </label>
                  <input
                    id="xml-file-tech-cards"
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
                    toast({ title: "Функція імпорту в розробці" });
                    setIsImportDialogOpen(false);
                  }}>
                    Імпортувати
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
      </div>    
  );
}