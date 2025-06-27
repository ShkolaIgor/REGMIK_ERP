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
          <div className="container mx-auto p-6">
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
        <div className="container mx-auto p-6">
          {/* Header з градієнтом */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 mb-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Склад технологічних карт</h1>
                  <p className="text-blue-100 text-lg">Управління технологічними процесами та інструкціями</p>
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
                    <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
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

          {/* Статистичні картки */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalTechCards}</p>
                    <p className="text-sm text-gray-500">Всього тех. карт</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Component className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{techCardsWithProduct}</p>
                    <p className="text-sm text-gray-500">З продуктами</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{averageTime}</p>
                    <p className="text-sm text-gray-500">Середній час (хв)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalWithInstructions}</p>
                    <p className="text-sm text-gray-500">З інструкціями</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Пошук та фільтри */}
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

          {/* Основна таблиця */}
          <main className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            <DataTable
              data={filteredTechCards}
              columns={columns}
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
        </div>
      </div>
    </div>
  );
}