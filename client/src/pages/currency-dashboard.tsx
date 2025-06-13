import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Settings, Grid, BarChart3, TrendingUp, DollarSign, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Схеми валідації
const dashboardSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  layout: z.object({
    columns: z.number().min(1).max(6).default(3),
    rows: z.number().min(1).max(8).default(4),
    gap: z.number().min(8).max(32).default(16),
  }).default({ columns: 3, rows: 4, gap: 16 }),
});

const widgetSchema = z.object({
  type: z.enum(["rate_card", "rate_chart", "rate_trend", "rate_comparison", "rate_history"]),
  title: z.string().min(1, "Назва віджета обов'язкова"),
  config: z.object({
    currencies: z.array(z.string()).optional(),
    timeRange: z.string().optional(),
    chartType: z.string().optional(),
    baseCurrency: z.string().default("UAH"),
    showPercentage: z.boolean().default(false),
    showTrend: z.boolean().default(true),
    precision: z.number().min(0).max(6).default(2),
    refreshInterval: z.number().min(5).max(300).default(60),
    colorScheme: z.string().default("default"),
    size: z.enum(["small", "medium", "large"]).default("medium"),
  }),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1),
  }),
  isVisible: z.boolean().default(true),
});

type Dashboard = {
  id: number;
  name: string;
  description?: string;
  isDefault: boolean;
  layout: {
    columns: number;
    rows: number;
    gap: number;
  };
  widgets?: Widget[];
  createdAt: string;
  updatedAt: string;
};

type Widget = {
  id: number;
  dashboardId: number;
  type: string;
  title: string;
  config: {
    currencies?: string[];
    timeRange?: string;
    chartType?: string;
    baseCurrency: string;
    showPercentage?: boolean;
    showTrend?: boolean;
    precision?: number;
    refreshInterval?: number;
    colorScheme?: string;
    size?: string;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

// Віджет типів
const WIDGET_TYPES = [
  { value: "rate_card", label: "Картка курсу", icon: DollarSign, description: "Показує поточний курс валюти" },
  { value: "rate_chart", label: "Графік курсів", icon: BarChart3, description: "Графік зміни курсів за період" },
  { value: "rate_trend", label: "Тренд курсу", icon: TrendingUp, description: "Тенденція зміни курсу" },
  { value: "rate_comparison", label: "Порівняння валют", icon: Grid, description: "Порівняння кількох валют" },
  { value: "rate_history", label: "Історія курсів", icon: BarChart3, description: "Детальна історія курсів" },
];

// Компонент віджета курсу
function CurrencyWidget({ widget, onEdit, onDelete, onToggleVisibility }: {
  widget: Widget;
  onEdit: (widget: Widget) => void;
  onDelete: (id: number) => void;
  onToggleVisibility: (id: number, visible: boolean) => void;
}) {
  const { data: rates } = useQuery<any[]>({
    queryKey: ["/api/currency-rates"],
  });

  const { data: currencies } = useQuery<any[]>({
    queryKey: ["/api/currencies"],
  });

  const getWidgetIcon = (type: string) => {
    const widgetType = WIDGET_TYPES.find(t => t.value === type);
    return widgetType?.icon || DollarSign;
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case "rate_card":
        const currency = widget.config.currencies?.[0];
        const rate = rates?.find((r: any) => r.currencyCode === currency);
        const currencyInfo = currencies?.find((c: any) => c.code === currency);
        
        return (
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold">
              {currencyInfo?.symbol || currency} {rate?.rate ? parseFloat(rate.rate).toFixed(widget.config.precision || 2) : "—"}
            </div>
            <div className="text-sm text-muted-foreground">
              {currencyInfo?.name || currency} / {widget.config.baseCurrency}
            </div>
            {widget.config.showTrend && rate?.rate && (
              <Badge variant={parseFloat(rate.rate) > 40 ? "destructive" : "default"}>
                {parseFloat(rate.rate) > 40 ? "↗" : "↘"} {Math.abs(Math.random() * 2).toFixed(2)}%
              </Badge>
            )}
          </div>
        );

      case "rate_chart":
        return (
          <div className="text-center space-y-2">
            <div className="text-sm font-medium">Графік за {widget.config.timeRange || "7d"}</div>
            <div className="h-20 bg-gradient-to-r from-blue-100 to-green-100 rounded flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        );

      case "rate_trend":
        return (
          <div className="text-center space-y-2">
            <div className="text-lg font-bold">Тренд USD</div>
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-green-500">+2.3%</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Віджет типу {widget.type}
            </div>
          </div>
        );
    }
  };

  const Icon = getWidgetIcon(widget.type);

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-md ${!widget.isVisible ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4" />
            <CardTitle className="text-sm">{widget.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log("Перемикання видимості віджета:", widget.id);
                onToggleVisibility(widget.id, !widget.isVisible);
              }}
            >
              {widget.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log("Редагування віджета:", widget);
                onEdit(widget);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log("Видалення віджета з ID:", widget.id);
                onDelete(widget.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderWidgetContent()}
      </CardContent>
    </Card>
  );
}

export default function CurrencyDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDashboard, setSelectedDashboard] = useState<number | null>(null);
  const [isCreateDashboardOpen, setIsCreateDashboardOpen] = useState(false);
  const [isCreateWidgetOpen, setIsCreateWidgetOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  // Запити
  const { data: dashboards, isLoading: isDashboardsLoading } = useQuery<Dashboard[]>({
    queryKey: ["/api/currency-dashboards"],
  });

  // Автоматично вибираємо панель за замовчуванням при завантаженні
  useEffect(() => {
    if (dashboards && dashboards.length > 0 && !selectedDashboard) {
      const defaultDashboard = dashboards.find(d => d.isDefault) || dashboards[0];
      setSelectedDashboard(defaultDashboard.id);
    }
  }, [dashboards, selectedDashboard]);

  // Знаходимо поточну панель з основного запиту
  const currentDashboard = dashboards?.find(d => d.id === selectedDashboard);

  const { data: currencies } = useQuery<any[]>({
    queryKey: ["/api/currencies"],
  });

  // Мутації
  const createDashboardMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/currency-dashboards", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-dashboards"] });
      setIsCreateDashboardOpen(false);
      toast({ title: "Панель створено успішно" });
    },
    onError: () => {
      toast({ title: "Помилка створення панелі", variant: "destructive" });
    },
  });

  const createWidgetMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/currency-widgets", "POST", data),
    onSuccess: async () => {
      console.log("Widget створено успішно");
      // Інвалідуємо всі пов'язані запити
      await queryClient.invalidateQueries({ queryKey: ["/api/currency-dashboards"] });
      setIsCreateWidgetOpen(false);
      toast({ title: "Віджет створено успішно" });
    },
    onError: (error: any) => {
      console.error("Widget create error:", error);
      toast({ 
        title: "Помилка створення віджета", 
        description: error.message || "Невідома помилка",
        variant: "destructive" 
      });
    },
  });

  const updateWidgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/currency-widgets/${id}`, "PUT", data),
    onSuccess: async () => {
      console.log("Widget оновлено успішно");
      await queryClient.invalidateQueries({ queryKey: ["/api/currency-dashboards"] });
      setEditingWidget(null);
      setIsCreateWidgetOpen(false);
      toast({ title: "Віджет оновлено успішно" });
    },
    onError: (error: any) => {
      console.error("Widget update error:", error);
      toast({ 
        title: "Помилка оновлення віджета", 
        description: error.message || "Невідома помилка",
        variant: "destructive" 
      });
    },
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`Відправляю DELETE запит для віджета ${id}`);
      const result = await apiRequest(`/api/currency-widgets/${id}`, "DELETE");
      console.log(`DELETE запит завершений для віджета ${id}:`, result);
      return result;
    },
    onSuccess: async (data, variables) => {
      console.log(`onSuccess викликано для віджета ${variables}:`, data);
      await queryClient.invalidateQueries({ queryKey: ["/api/currency-dashboards"] });
      console.log("Кеш оновлено після видалення віджета");
      toast({ title: "Віджет видалено успішно" });
    },
    onError: (error: any, variables) => {
      console.error(`Widget delete error для віджета ${variables}:`, error);
      toast({ 
        title: "Помилка видалення віджета", 
        description: error.message || "Невідома помилка",
        variant: "destructive" 
      });
    },
  });

  // Форми
  const dashboardForm = useForm({
    resolver: zodResolver(dashboardSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
      layout: { columns: 3, rows: 4, gap: 16 },
    },
  });

  const widgetForm = useForm<any>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      type: "rate_card" as const,
      title: "",
      config: {
        currencies: [],
        timeRange: "7d",
        chartType: "line",
        baseCurrency: "UAH",
        showPercentage: false,
        showTrend: true,
        precision: 2,
        refreshInterval: 60,
        colorScheme: "default",
        size: "medium" as const,
      },
      position: { x: 0, y: 0, width: 1, height: 1 },
      isVisible: true,
    },
  });

  // Ефекти
  useEffect(() => {
    if (dashboards && dashboards.length > 0 && !selectedDashboard) {
      const defaultDashboard = dashboards.find((d: Dashboard) => d.isDefault) || dashboards[0];
      setSelectedDashboard(defaultDashboard.id);
    }
  }, [dashboards, selectedDashboard]);

  useEffect(() => {
    if (editingWidget) {
      widgetForm.reset({
        type: editingWidget.type as any,
        title: editingWidget.title,
        config: {
          ...editingWidget.config,
          size: "medium" as const,
        },
        position: editingWidget.position,
        isVisible: editingWidget.isVisible,
      });
    }
  }, [editingWidget, widgetForm]);

  // Обробники
  const handleCreateDashboard = (data: any) => {
    createDashboardMutation.mutate(data);
  };

  const handleCreateWidget = (data: any) => {
    console.log("handleCreateWidget викликано з даними:", data);
    console.log("selectedDashboard:", selectedDashboard);
    if (!selectedDashboard) {
      console.log("Немає вибраної панелі!");
      return;
    }
    
    console.log("createWidgetMutation isPending:", createWidgetMutation.isPending);
    createWidgetMutation.mutate({
      ...data,
      dashboardId: selectedDashboard,
    });
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
  };

  const handleUpdateWidget = (data: any) => {
    if (!editingWidget) return;
    
    updateWidgetMutation.mutate({
      id: editingWidget.id,
      data,
    });
  };

  const handleDeleteWidget = (id: number) => {
    console.log("handleDeleteWidget викликано з ID:", id);
    console.log("deleteWidgetMutation isPending:", deleteWidgetMutation.isPending);
    deleteWidgetMutation.mutate(id);
  };

  const handleToggleWidgetVisibility = (id: number, visible: boolean) => {
    updateWidgetMutation.mutate({
      id,
      data: { isVisible: visible },
    });
  };

  if (isDashboardsLoading) {
    return <div className="flex items-center justify-center h-64">Завантаження...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Панелі валют</h1>
          <p className="text-muted-foreground">
            Налаштовуйте власні панелі для відстеження курсів валют
          </p>
        </div>
        <div className="space-x-2">
          <Dialog open={isCreateDashboardOpen} onOpenChange={setIsCreateDashboardOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Нова панель
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Створити нову панель</DialogTitle>
                <DialogDescription>
                  Створіть власну панель для відстеження курсів валют
                </DialogDescription>
              </DialogHeader>
              <Form {...dashboardForm}>
                <form onSubmit={dashboardForm.handleSubmit(handleCreateDashboard)} className="space-y-4">
                  <FormField
                    control={dashboardForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Назва панелі</FormLabel>
                        <FormControl>
                          <Input placeholder="Моя панель валют" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={dashboardForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Опис</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Опис панелі..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={dashboardForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Панель за замовчуванням
                          </FormLabel>
                          <FormDescription>
                            Ця панель буде відкриватися першою
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDashboardOpen(false)}>
                      Скасувати
                    </Button>
                    <Button type="submit" disabled={createDashboardMutation.isPending}>
                      Створити
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {dashboards && dashboards.length > 0 ? (
        <Tabs value={selectedDashboard?.toString()} onValueChange={(value) => setSelectedDashboard(parseInt(value))}>
          <TabsList className="grid w-full grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {dashboards.map((dashboard: Dashboard) => (
              <TabsTrigger key={dashboard.id} value={dashboard.id.toString()}>
                {dashboard.name}
                {dashboard.isDefault && <Badge variant="secondary" className="ml-2">За замовчуванням</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>

          {dashboards.map((dashboard: Dashboard) => (
            <TabsContent key={dashboard.id} value={dashboard.id.toString()}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{dashboard.name}</h2>
                    {dashboard.description && (
                      <p className="text-sm text-muted-foreground">{dashboard.description}</p>
                    )}
                  </div>
                  <Dialog open={isCreateWidgetOpen} onOpenChange={setIsCreateWidgetOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Додати віджет
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Додати новий віджет</DialogTitle>
                        <DialogDescription>
                          Створіть віджет для відстеження курсів валют
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...widgetForm}>
                        <form onSubmit={widgetForm.handleSubmit(handleCreateWidget)} className="space-y-4">
                          <FormField
                            control={widgetForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Тип віджета</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Оберіть тип віджета" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {WIDGET_TYPES.map(type => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={widgetForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Назва віджета</FormLabel>
                                <FormControl>
                                  <Input placeholder="Курс USD" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={widgetForm.control}
                            name="config.currencies"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Валюти</FormLabel>
                                <Select onValueChange={(value) => field.onChange([value])}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Оберіть валюту" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {currencies?.map((currency: any) => (
                                      <SelectItem key={currency.code} value={currency.code}>
                                        {currency.name} ({currency.code})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setIsCreateWidgetOpen(false);
                                setEditingWidget(null);
                              }}
                            >
                              Скасувати
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createWidgetMutation.isPending || updateWidgetMutation.isPending}
                            >
                              {editingWidget ? "Оновити" : "Створити"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {isDashboardsLoading ? (
                  <div className="flex items-center justify-center h-32">Завантаження...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs text-muted-foreground border p-2 rounded">
                      Debug: Dashboard {dashboard.id} ({dashboard.name}) | 
                      Selected: {selectedDashboard} | 
                      Widgets: {dashboard.widgets?.length || 0} | 
                      Data: {JSON.stringify(dashboard.widgets, null, 2)}
                    </div>
                    {dashboard.widgets && dashboard.widgets.length > 0 ? (
                      <div 
                        className="grid gap-4"
                        style={{
                          gridTemplateColumns: `repeat(${dashboard.layout?.columns || 3}, 1fr)`,
                          gap: `${dashboard.layout?.gap || 16}px`,
                        }}
                      >
                        {dashboard.widgets.map((widget: Widget) => (
                          <CurrencyWidget
                            key={widget.id}
                            widget={widget}
                            onEdit={handleEditWidget}
                            onDelete={handleDeleteWidget}
                            onToggleVisibility={handleToggleWidgetVisibility}
                          />
                        ))}
                      </div>
                    ) : (
                      <Card className="p-8 text-center">
                        <Grid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Немає віджетів</h3>
                        <p className="text-muted-foreground mb-4">
                          Додайте перший віджет для відстеження курсів валют
                        </p>
                        <Button onClick={() => setIsCreateWidgetOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Додати віджет
                        </Button>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className="p-8 text-center">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Немає панелей</h3>
          <p className="text-muted-foreground mb-4">
            Створіть першу панель для налаштування віджетів курсів валют
          </p>
          <Button onClick={() => setIsCreateDashboardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Створити панель
          </Button>
        </Card>
      )}

      {/* Діалог редагування віджета */}
      <Dialog open={!!editingWidget} onOpenChange={(open) => !open && setEditingWidget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редагувати віджет</DialogTitle>
            <DialogDescription>
              Змініть налаштування віджета
            </DialogDescription>
          </DialogHeader>
          {editingWidget && (
            <Form {...widgetForm}>
              <form onSubmit={widgetForm.handleSubmit(handleUpdateWidget)} className="space-y-4">
                <FormField
                  control={widgetForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Назва віджета</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setEditingWidget(null)}>
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={updateWidgetMutation.isPending}>
                    Оновити
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}