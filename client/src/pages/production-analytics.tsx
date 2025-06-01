import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, TrendingUp, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, format, startOfMonth, endOfMonth } from "date-fns";
import type { DateRange } from "react-day-picker";

export default function ProductionAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedWorker, setSelectedWorker] = useState<string>("all");

  // Отримуємо дані для аналізу
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/production/analytics", dateRange, selectedDepartment, selectedWorker],
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: workers } = useQuery({
    queryKey: ["/api/workers"],
  });

  const { data: productionTasks } = useQuery({
    queryKey: ["/api/production-tasks"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Аналіз завантаженості виробництва</h1>
          <p className="text-muted-foreground">Завантаження...</p>
        </div>
      </div>
    );
  }

  // Розрахуємо статистику завантаженості
  const tasks = productionTasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
  const inProgressTasks = tasks.filter((task: any) => task.status === 'in_progress').length;
  const pendingTasks = tasks.filter((task: any) => task.status === 'pending').length;
  const overdueTask = tasks.filter((task: any) => 
    task.status !== 'completed' && task.endDate && new Date(task.endDate) < new Date()
  ).length;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const workloadRate = totalTasks > 0 ? ((inProgressTasks + pendingTasks) / totalTasks) * 100 : 0;

  // Групуємо завдання за працівниками
  const workerStats = workers?.map((worker: any) => {
    const workerTasks = tasks.filter((task: any) => 
      task.assignedTo && task.assignedTo.includes(worker.firstName)
    );
    const completed = workerTasks.filter((task: any) => task.status === 'completed').length;
    const inProgress = workerTasks.filter((task: any) => task.status === 'in_progress').length;
    const pending = workerTasks.filter((task: any) => task.status === 'pending').length;
    
    return {
      id: worker.id,
      name: `${worker.firstName} ${worker.lastName}`,
      department: worker.department,
      position: worker.position,
      totalTasks: workerTasks.length,
      completed,
      inProgress,
      pending,
      workload: workerTasks.length > 0 ? ((inProgress + pending) / workerTasks.length) * 100 : 0,
      efficiency: workerTasks.length > 0 ? (completed / workerTasks.length) * 100 : 0,
    };
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Аналіз завантаженості виробництва</h1>
          <p className="text-muted-foreground">
            Моніторинг ефективності та завантаженості виробничих процесів
          </p>
        </div>
      </div>

      {/* Фільтри */}
      <Card>
        <CardHeader>
          <CardTitle>Фільтри аналізу</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Період</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Відділ</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть відділ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі відділи</SelectItem>
                  {departments?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Працівник</label>
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть працівника" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Усі працівники</SelectItem>
                  {workers?.map((worker: any) => (
                    <SelectItem key={worker.id} value={worker.id.toString()}>
                      {worker.firstName} {worker.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Загальна статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загальна завантаженість</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workloadRate.toFixed(1)}%</div>
            <Progress value={workloadRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {inProgressTasks + pendingTasks} з {totalTasks} завдань
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ефективність</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedTasks} виконано з {totalTasks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активні завдання</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              В процесі виконання
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Прострочені</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTask}</div>
            <p className="text-xs text-muted-foreground">
              Потребують уваги
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Аналіз по працівниках */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Завантаженість працівників
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Працівник</TableHead>
                <TableHead>Відділ</TableHead>
                <TableHead>Посада</TableHead>
                <TableHead>Всього завдань</TableHead>
                <TableHead>Виконано</TableHead>
                <TableHead>В процесі</TableHead>
                <TableHead>Очікують</TableHead>
                <TableHead>Завантаженість</TableHead>
                <TableHead>Ефективність</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workerStats.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>{worker.department || "—"}</TableCell>
                  <TableCell>{worker.position || "—"}</TableCell>
                  <TableCell>{worker.totalTasks}</TableCell>
                  <TableCell>
                    <Badge variant="default">{worker.completed}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{worker.inProgress}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{worker.pending}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={worker.workload} className="flex-1" />
                      <span className="text-sm">{worker.workload.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={worker.efficiency} className="flex-1" />
                      <span className="text-sm">{worker.efficiency.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Деталізація завдань */}
      <Card>
        <CardHeader>
          <CardTitle>Поточні виробничі завдання</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Рецепт</TableHead>
                <TableHead>Кількість</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Пріоритет</TableHead>
                <TableHead>Призначено</TableHead>
                <TableHead>Прогрес</TableHead>
                <TableHead>Початок</TableHead>
                <TableHead>Кінець</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task: any) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    {task.recipe?.name || "—"}
                  </TableCell>
                  <TableCell>{task.quantity}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'in_progress' ? 'secondary' :
                        'outline'
                      }
                    >
                      {task.status === 'completed' && 'Виконано'}
                      {task.status === 'in_progress' && 'В процесі'}
                      {task.status === 'pending' && 'Очікує'}
                      {task.status === 'cancelled' && 'Скасовано'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'default' :
                        'secondary'
                      }
                    >
                      {task.priority === 'high' && 'Високий'}
                      {task.priority === 'medium' && 'Середній'}
                      {task.priority === 'low' && 'Низький'}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.assignedTo || "Не призначено"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={task.progress || 0} className="flex-1" />
                      <span className="text-sm">{task.progress || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.startDate ? format(new Date(task.startDate), "dd.MM.yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    {task.endDate ? format(new Date(task.endDate), "dd.MM.yyyy") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}