import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye, Edit, Clock, FileText, Wrench, Settings, Search, ClipboardList } from "lucide-react";
import { TechCardForm } from "@/components/TechCardForm";

export default function TechCards() {
  const [showTechCardForm, setShowTechCardForm] = useState(false);
  const [selectedTechCard, setSelectedTechCard] = useState(null);

  const { data: techCards = [], isLoading } = useQuery({
    queryKey: ["/api/tech-cards"],
  });

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Технологічні карти</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Технологічні карти</h1>
          <p className="text-muted-foreground">
            Управління технологічними процесами виробництва
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Створити карту
        </Button>
      </div>

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
                techCards.reduce((acc: number, card: any) => acc + (card.materialCost || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблиця технологічних карт */}
      <Card>
        <CardHeader>
          <CardTitle>Технологічні карти</CardTitle>
          <CardDescription>
            Список всіх технологічних карт виробництва
          </CardDescription>
        </CardHeader>
        <CardContent>
          {techCards.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                Немає технологічних карт
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Почніть з створення першої технологічної карти для виробництва
              </p>
              <div className="mt-6">
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Створити карту
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва</TableHead>
                  <TableHead>Продукт</TableHead>
                  <TableHead>Час виконання</TableHead>
                  <TableHead>Вартість матеріалів</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Створено</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {techCards.map((techCard: any) => (
                  <TableRow key={techCard.id}>
                    <TableCell className="font-medium">
                      {techCard.name}
                    </TableCell>
                    <TableCell>{techCard.productName}</TableCell>
                    <TableCell>{techCard.estimatedTime} хв</TableCell>
                    <TableCell>{formatCurrency(techCard.materialCost || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={techCard.status === 'active' ? 'default' : 'secondary'}>
                        {techCard.status === 'active' ? 'Активна' : 'Неактивна'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(techCard.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(techCard)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
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

      <TechCardForm
        isOpen={showTechCardForm}
        onClose={handleCloseForm}
        techCard={selectedTechCard}
      />
    </div>
  );
}