import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Flame, Wand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SolderingType {
  id: number;
  name: string;
  description: string | null;
  temperature: string | null;
  method: string | null;
  equipment: string | null;
  createdAt: Date | null;
}

export default function SolderingTypes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSolderingType, setEditingSolderingType] = useState<SolderingType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    temperature: "",
    method: "",
    equipment: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: solderingTypes = [], isLoading } = useQuery<SolderingType[]>({
    queryKey: ["/api/soldering-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending data:", data);
      const response = await fetch("/api/soldering-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create soldering type: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Success callback triggered with data:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/soldering-types"] });
      console.log("Setting dialog open to false");
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Тип пайки створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити тип пайки",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/soldering-types/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update soldering type: ${response.statusText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/soldering-types"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Тип пайки оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити тип пайки",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/soldering-types/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/soldering-types"] });
      toast({
        title: "Успіх",
        description: "Тип пайки видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити тип пайки",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      temperature: "",
      method: "",
      equipment: "",
    });
    setEditingSolderingType(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      description: formData.description || null,
      temperature: formData.temperature || null,
      method: formData.method || null,
      equipment: formData.equipment || null,
    };

    if (editingSolderingType) {
      updateMutation.mutate({ id: editingSolderingType.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (solderingType: SolderingType) => {
    setEditingSolderingType(solderingType);
    setFormData({
      name: solderingType.name,
      description: solderingType.description || "",
      temperature: solderingType.temperature || "",
      method: solderingType.method || "",
      equipment: solderingType.equipment || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей тип пайки?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredSolderingTypes = solderingTypes.filter(solderingType =>
    solderingType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (solderingType.description && solderingType.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (solderingType.method && solderingType.method.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">      
    {/* Header */}
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wand className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Типи пайки</h1>
          <p className="text-gray-500 mt-1">Керування довідником типів пайки компонентів</p>
          </div>
        </div>
      <div className="flex items-center space-x-4">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm}  
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="w-4 h-4" />
              Додати тип пайки
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSolderingType ? "Редагувати тип пайки" : "Новий тип пайки"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Назва *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Назва типу пайки"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Опис типу пайки"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="temperature">Температура</Label>
                <Input
                  id="temperature"
                  value={formData.temperature}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                  placeholder="Температура пайки (наприклад, 260°C)"
                />
              </div>

              <div>
                <Label htmlFor="method">Метод пайки</Label>
                <Input
                  id="method"
                  value={formData.method}
                  onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                  placeholder="Метод пайки (наприклад, SMD, THT)"
                />
              </div>

              <div>
                <Label htmlFor="equipment">Обладнання</Label>
                <Textarea
                  id="equipment"
                  value={formData.equipment}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
                  placeholder="Необхідне обладнання"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingSolderingType ? "Оновити" : "Створити"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Скасувати
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      </div>
    </header>

      {/* Search */}
    <div className="w-full py-3">
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Пошук типів пайки..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Soldering Types Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Типи пайки ({filteredSolderingTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSolderingTypes.length === 0 ? (
            <div className="text-center py-8">
              <Flame className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Типи пайки не знайдено</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва</TableHead>
                  <TableHead>Опис</TableHead>
                  <TableHead>Температура</TableHead>
                  <TableHead>Метод</TableHead>
                  <TableHead>Обладнання</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSolderingTypes.map((solderingType) => (
                  <TableRow key={solderingType.id}>
                    <TableCell>
                      <div className="font-medium">{solderingType.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {solderingType.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{solderingType.temperature || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{solderingType.method || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {solderingType.equipment || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(solderingType)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(solderingType.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}