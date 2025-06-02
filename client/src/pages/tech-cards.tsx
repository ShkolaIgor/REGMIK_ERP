import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye, Edit, Clock, FileText, Search, ClipboardList, Wrench, Settings, Trash2 } from "lucide-react";
import { TechCardForm } from "@/components/TechCardForm";

export default function TechCards() {
  const [showTechCardForm, setShowTechCardForm] = useState(false);
  const [selectedTechCard, setSelectedTechCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();
  
  const { data: techCards = [], isLoading } = useQuery({
    queryKey: ["/api/tech-cards"],
  });

  const deleteTechCardMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tech-cards/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Помилка видалення технологічної карти");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tech-cards"] });
    },
  });

  // Фільтрація технологічних карт за пошуковим запитом
  const filteredTechCards = techCards.filter((techCard: any) =>
    techCard.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    techCard.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    techCard.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (techCard: any) => {
    setSelectedTechCard(techCard);
    setShowTechCardForm(true);
  };

  const handleCreate = () => {
    setSelectedTechCard(null);
    setShowTechCardForm(true);
  };

  const handleCloseForm = () => {
    setShowTechCardForm(false);
    setSelectedTechCard(null);
  };

  const handleDelete = (techCard: any) => {
    if (confirm(`Ви впевнені, що хочете видалити технологічну карту "${techCard.name}"?`)) {
      deleteTechCardMutation.mutate(techCard.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Технологічні карти</h1>
            </div>
            <Badge variant="secondary" className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              Онлайн
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Пошук технологічних карт..."
                className="w-80 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Створити карту
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Статистика */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Всього карт
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{techCards.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Активні процеси
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {techCards.filter((card: any) => card.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Середній час
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {techCards.length > 0 
                  ? Math.round(techCards.reduce((acc: number, card: any) => acc + (card.estimatedTime || 0), 0) / techCards.length)
                  : 0} хв
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Вартість матеріалів
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  techCards.reduce((acc: number, card: any) => acc + (parseFloat(card.materialCost) || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Карточки технологічних карт */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTechCards.map((techCard: any) => (
            <Card key={techCard.id} className="relative hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{techCard.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(techCard)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(techCard)}
                      disabled={deleteTechCardMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                {techCard.product && (
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Продукт: {techCard.product.name}</span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                {techCard.description && (
                  <CardDescription className="mb-4">
                    {techCard.description}
                  </CardDescription>
                )}
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Час виконання:</span>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {techCard.estimatedTime || 0} хв
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Складність:</span>
                    <Badge variant={
                      techCard.difficulty === 'high' ? 'destructive' :
                      techCard.difficulty === 'medium' ? 'default' : 'secondary'
                    }>
                      {techCard.difficulty === 'high' ? 'Висока' :
                       techCard.difficulty === 'medium' ? 'Середня' : 'Низька'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Статус:</span>
                    <Badge variant={techCard.status === 'active' ? 'default' : 'secondary'}>
                      {techCard.status === 'active' ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </div>
                  
                  {techCard.materialCost && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Вартість матеріалів:</span>
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(techCard.materialCost) || 0)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Створено:</span>
                    <span className="text-sm">{formatDate(techCard.createdAt)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">
                      ID: {techCard.id}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      Кроків: {techCard.steps?.length || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTechCards.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              {searchQuery ? "Технологічні карти не знайдено" : "Немає технологічних карт"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? "Спробуйте змінити критерії пошуку"
                : "Почніть з створення першої технологічної карти для виробництва"
              }
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Створити карту
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <TechCardForm
        isOpen={showTechCardForm}
        onClose={handleCloseForm}
        techCard={selectedTechCard}
      />
    </div>
  );
}