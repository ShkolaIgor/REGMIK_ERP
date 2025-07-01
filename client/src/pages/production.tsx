//import { KanbanBoard } from "@/components/KanbanBoard";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { cn, getPriorityColor, getStatusColor } from "@/lib/utils";
import { Route, Plus, User, Calendar, Clock } from "lucide-react";
import { InsertProductionTask, Recipe } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const statusColumns = [
  { id: "planned", title: "Заплановано", color: "bg-gray-50" },
  { id: "in-progress", title: "У роботі", color: "bg-blue-50" },
  { id: "quality-check", title: "Контроль якості", color: "bg-yellow-50" },
  { id: "completed", title: "Завершено", color: "bg-green-50" }
];

export default function KanbanBoard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<InsertProductionTask>>({
    quantity: 1,
    status: "planned",
    priority: "medium"
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["/api/production-tasks"],
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["/api/recipes"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/production-tasks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-tasks"] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: InsertProductionTask) => {
      const res = await apiRequest("POST", "/api/production-tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-tasks"] });
      setIsCreateDialogOpen(false);
      setNewTask({
        quantity: 1,
        status: "planned",
        priority: "medium"
      });
      toast({
        title: "Успіх",
        description: "Виробниче завдання створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити виробниче завдання",
        variant: "destructive",
      });
    },
  });

  const moveTask = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { status: newStatus }
    });
  };

  const handleCreateTask = () => {
    if (!newTask.recipeId || !newTask.quantity) {
      toast({
        title: "Помилка",
        description: "Виберіть рецепт та вкажіть кількість",
        variant: "destructive",
      });
      return;
    }

    createTaskMutation.mutate(newTask as InsertProductionTask);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task: any) => task.status === status);
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  {/*export default function Production() {*/}
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section  sticky top-0 z-40*/}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                    Планування виробництва
                  </h1>
                  <p className="text-gray-500 mt-1">Kanban дошка для управління виробничими завданнями</p>
                </div>
              </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Нове завдання
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Створити виробниче завдання</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipe">Рецепт</Label>
                    <Select 
                      value={newTask.recipeId?.toString() || ""} 
                      onValueChange={(value) => setNewTask({ ...newTask, recipeId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Виберіть рецепт" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes.map((recipe: Recipe) => (
                          <SelectItem key={recipe.id} value={recipe.id.toString()}>
                            {recipe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Кількість</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newTask.quantity || 1}
                      onChange={(e) => setNewTask({ ...newTask, quantity: parseInt(e.target.value) })}
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Пріоритет</Label>
                    <Select 
                      value={newTask.priority || "medium"} 
                      onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низький</SelectItem>
                        <SelectItem value="medium">Середній</SelectItem>
                        <SelectItem value="high">Високий</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assignedTo">Призначено</Label>
                    <Input
                      id="assignedTo"
                      value={newTask.assignedTo || ""}
                      onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                      placeholder="Ім'я співробітника"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Примітки</Label>
                    <Textarea
                      id="notes"
                      value={newTask.notes || ""}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      placeholder="Додаткові примітки..."
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateTask} 
                      disabled={createTaskMutation.isPending}
                      className="flex-1"
                    >
                      {createTaskMutation.isPending ? "Створення..." : "Створити"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      Скасувати
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
        </div>
      </header>

      {/*<KanbanBoard />*/}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Планування виробництва (Kanban)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statusColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);

            return (
              <div key={column.id} className={cn("kanban-column", column.color)}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{column.title}</h4>
                  <Badge variant="secondary" className="bg-white">
                    {columnTasks.length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {columnTasks.map((task: any) => (
                    <Card key={task.id} className="kanban-card">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {task.recipe?.name || "Без рецепту"}
                          </span>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority === 'high' ? 'Висока' :
                             task.priority === 'medium' ? 'Середня' : 'Низька'}
                          </Badge>
                        </div>

                        <p className="text-xs text-gray-600 mb-2">
                          {task.quantity} одиниць
                        </p>

                        {task.status === 'in-progress' && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          {task.assignedTo && (
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {task.assignedTo}
                            </div>
                          )}

                          {task.endDate && (
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(task.endDate).toLocaleDateString('uk-UA')}
                            </div>
                          )}
                        </div>

                        {/* Status transition buttons */}
                        <div className="mt-3 flex gap-1">
                          {column.id !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                const nextStatus = column.id === 'planned' ? 'in-progress' :
                                                 column.id === 'in-progress' ? 'quality-check' :
                                                 'completed';
                                moveTask(task.id, nextStatus);
                              }}
                            >
                              →
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
