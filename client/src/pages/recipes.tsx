import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye, Edit, Clock, DollarSign, FileText } from "lucide-react";

export default function Recipes() {
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["/api/recipes"],
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Технологічні карти</h2>
            <p className="text-gray-600">Управління рецептами та технологічними процесами</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Нова технологічна карта
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Всього рецептів</p>
                  <p className="text-3xl font-semibold text-gray-900">{recipes.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Середній час виробництва</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {recipes.length > 0 
                      ? Math.round(recipes.reduce((sum: number, r: any) => sum + (r.estimatedTime || 0), 0) / recipes.length)
                      : 0
                    } хв
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Середня вартість робіт</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {recipes.length > 0
                      ? formatCurrency(recipes.reduce((sum: number, r: any) => sum + parseFloat(r.laborCost || 0), 0) / recipes.length)
                      : formatCurrency(0)
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список технологічних карт</CardTitle>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Технологічні карти відсутні</p>
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Створити першу технологічну карту
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Назва</TableHead>
                    <TableHead>Опис</TableHead>
                    <TableHead>Час виробництва</TableHead>
                    <TableHead>Вартість робіт</TableHead>
                    <TableHead>Дата створення</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((recipe: any) => (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium">{recipe.name}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-gray-600">
                          {recipe.description || "Без опису"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {recipe.estimatedTime ? `${recipe.estimatedTime} хв` : "Не вказано"}
                      </TableCell>
                      <TableCell>
                        {recipe.laborCost ? formatCurrency(recipe.laborCost) : "Не вказано"}
                      </TableCell>
                      <TableCell>{formatDate(recipe.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
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
      </main>
    </div>
  );
}
