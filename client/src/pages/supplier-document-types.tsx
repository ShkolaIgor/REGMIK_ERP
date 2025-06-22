import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit2, Trash2, FileText } from "lucide-react";

interface SupplierDocumentType {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function SupplierDocumentTypes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<SupplierDocumentType | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  // Query
  const { data: types = [], isLoading } = useQuery({
    queryKey: ["/api/supplier-document-types"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/supplier-document-types', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-document-types"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Тип документу створено успішно" });
    },
    onError: (error) => {
      toast({ 
        title: "Помилка створення типу документу", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/supplier-document-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-document-types"] });
      setIsDialogOpen(false);
      setEditingType(null);
      resetForm();
      toast({ title: "Тип документу оновлено успішно" });
    },
    onError: (error) => {
      toast({ 
        title: "Помилка оновлення типу документу", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/supplier-document-types/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-document-types"] });
      setShowDeleteAlert(false);
      setEditingType(null);
      toast({ title: "Тип документу видалено успішно" });
    },
    onError: (error) => {
      toast({ 
        title: "Помилка видалення типу документу", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (type: SupplierDocumentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      isActive: type.isActive
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (editingType) {
      deleteMutation.mutate(editingType.id);
    }
  };

  // Filter types
  const filteredTypes = types.filter((type: SupplierDocumentType) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      type.name.toLowerCase().includes(searchLower) ||
      type.description?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-50/30">
        <div className="w-full px-6 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Завантаження типів документів...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50/30">
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Типи документів постачальників</h1>
            <p className="text-muted-foreground">
              Довідник типів документів ({filteredTypes.length} з {types.length})
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Новий тип документу
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Пошук за назвою або описом..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTypes.map((type: SupplierDocumentType) => (
            <Card key={type.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                  </div>
                  <Badge variant={type.isActive ? "default" : "secondary"}>
                    {type.isActive ? "Активний" : "Неактивний"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {type.description && (
                  <p className="text-sm text-gray-600">{type.description}</p>
                )}
                
                <div className="text-xs text-gray-500">
                  Створено: {new Date(type.createdAt).toLocaleDateString('uk-UA')}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(type)}
                    className="flex-1"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Редагувати
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setEditingType(type);
                      setShowDeleteAlert(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTypes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "Типи документів не знайдено" : "Немає типів документів"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? "Спробуйте змінити критерії пошуку" : "Створіть перший тип документу"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Створити тип документу
              </Button>
            )}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Редагувати тип документу' : 'Новий тип документу'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Назва *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Наприклад: Накладна, Рахунок-фактура"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Детальний опис типу документу"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isActive">Активний</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingType(null);
                    resetForm();
                  }}
                >
                  Скасувати
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingType ? 'Зберегти' : 'Створити'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Alert */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Підтвердження видалення</AlertDialogTitle>
              <AlertDialogDescription>
                Ви впевнені, що хочете видалити тип документу "{editingType?.name}"? 
                Цю дію неможливо скасувати.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Скасувати</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Видалити
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}