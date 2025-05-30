import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { cn, getPriorityColor, getStatusColor } from "@/lib/utils";
import { Plus, User, Calendar, Clock } from "lucide-react";

const statusColumns = [
  { id: "planned", title: "Заплановано", color: "bg-gray-50" },
  { id: "in-progress", title: "У роботі", color: "bg-blue-50" },
  { id: "quality-check", title: "Контроль якості", color: "bg-yellow-50" },
  { id: "completed", title: "Завершено", color: "bg-green-50" }
];

export function KanbanBoard() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["/api/production-tasks"],
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

  const moveTask = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { status: newStatus }
    });
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task: any) => task.status === status);
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Планування виробництва (Kanban)</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Нове завдання
        </Button>
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
  );
}
