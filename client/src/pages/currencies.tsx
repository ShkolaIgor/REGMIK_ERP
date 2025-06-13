import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  DollarSign, 
  Edit,
  Trash2,
  TrendingUp,
  Settings,
  Save,
  Star,
  RefreshCw,
  Calendar,
  ArrowUpDown,
  Download,
  BarChart3,
  Banknote,
  Grid,
  Eye,
  EyeOff
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { uk } from "date-fns/locale";

// Currency schema definition
const currencySchema = z.object({
  code: z.string().min(3, "Код валюти повинен містити принаймні 3 символи").max(3, "Код валюти повинен містити максимум 3 символи"),
  name: z.string().min(1, "Назва валюти обов'язкова"),
  symbol: z.string().min(1, "Символ валюти обов'язковий"),
  decimalPlaces: z.number().min(0).max(10),
  isBase: z.boolean(),
  isActive: z.boolean()
});

// Widget and Dashboard schemas
const dashboardSchema = z.object({
  name: z.string().min(1, "Назва панелі обов'язкова"),
  description: z.string().optional(),
  isDefault: z.boolean(),
  layout: z.object({
    columns: z.number().min(1).max(12),
    rows: z.number().min(1).max(10),
    gap: z.number().min(0).max(20)
  })
});

const widgetSchema = z.object({
  type: z.string(),
  title: z.string().min(1, "Назва віджета обов'язкова"),
  config: z.object({
    currencies: z.array(z.string()).optional(),
    baseCurrency: z.string(),
    precision: z.number().min(0).max(10).optional(),
    showPercentage: z.boolean().optional(),
    showTrend: z.boolean().optional(),
    refreshInterval: z.number().min(5).max(3600).optional(),
    colorScheme: z.string().optional()
  }),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1)
  }),
  isVisible: z.boolean()
});

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBase: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CurrencyWithLatestRate extends Currency {
  latestRate?: string;
  rateDate?: string;
}

interface CurrencyRate {
  id: number;
  currencyCode: string;
  rate: string;
  exchangeDate: string;
  txt: string;
  cc: string;
  r030: number;
  createdAt: string;
  updatedAt: string;
}

interface CurrencySettings {
  id: number;
  autoUpdateEnabled: boolean;
  updateTime: string;
  lastUpdateDate: string | null;
  lastUpdateStatus: string;
  lastUpdateError: string | null;
  enabledCurrencies: string[];
}

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

function CurrencyWidget({ widget, onEdit, onDelete, onToggleVisibility }: {
  widget: Widget;
  onEdit: (widget: Widget) => void;
  onDelete: (widgetId: number) => void;
  onToggleVisibility: (widgetId: number) => void;
}) {
  return (
    <Card 
      className={`relative ${!widget.isVisible ? 'opacity-50' : ''}`}
      style={{
        gridColumn: `span ${Math.min(widget.position.width, 4)}`,
        gridRow: `span ${Math.min(widget.position.height, 3)}`
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onToggleVisibility(widget.id)}
            >
              {widget.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEdit(widget)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onDelete(widget.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground">
          Тип: {widget.type === 'rate-display' ? 'Відображення курсів' : 
               widget.type === 'rate-chart' ? 'Графік курсів' : 
               'Підсумок валют'}
        </div>
        <div className="mt-2">
          <div className="text-lg font-semibold">
            {widget.config.baseCurrency || 'UAH'}
          </div>
          <div className="text-xs text-muted-foreground">
            Точність: {widget.config.precision || 4}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CurrencyDashboardTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDashboard, setSelectedDashboard] = useState<number | null>(null);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [isDashboardDialogOpen, setIsDashboardDialogOpen] = useState(false);
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);

  const { data: dashboards = [], isLoading: dashboardsLoading } = useQuery<Dashboard[]>({
    queryKey: ['/api/currency-dashboards']
  });

  // Set default selected dashboard
  useEffect(() => {
    if (dashboards.length > 0 && !selectedDashboard) {
      const defaultDashboard = dashboards.find(d => d.isDefault) || dashboards[0];
      setSelectedDashboard(defaultDashboard.id);
    }
  }, [dashboards, selectedDashboard]);

  const dashboardForm = useForm<z.infer<typeof dashboardSchema>>({
    resolver: zodResolver(dashboardSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
      layout: {
        columns: 4,
        rows: 3,
        gap: 4
      }
    }
  });

  const widgetForm = useForm<z.infer<typeof widgetSchema>>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      type: "rate-display",
      title: "",
      config: {
        currencies: [],
        baseCurrency: "UAH",
        precision: 4,
        showPercentage: false,
        showTrend: true,
        refreshInterval: 60,
        colorScheme: "default"
      },
      position: {
        x: 0,
        y: 0,
        width: 2,
        height: 2
      },
      isVisible: true
    }
  });

  // Mutations
  const createDashboardMutation = useMutation({
    mutationFn: (data: z.infer<typeof dashboardSchema>) =>
      apiRequest('/api/currency-dashboards', {
        method: 'POST',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      setIsDashboardDialogOpen(false);
      dashboardForm.reset();
      toast({
        title: "Успіх",
        description: "Панель створено"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateDashboardMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & z.infer<typeof dashboardSchema>) =>
      apiRequest(`/api/currency-dashboards/${id}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      setIsDashboardDialogOpen(false);
      setEditingDashboard(null);
      dashboardForm.reset();
      toast({
        title: "Успіх",
        description: "Панель оновлено"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/currency-dashboards/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      if (selectedDashboard && dashboards.length > 1) {
        setSelectedDashboard(dashboards.find(d => d.id !== selectedDashboard)?.id || null);
      }
      toast({
        title: "Успіх",
        description: "Панель видалено"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createWidgetMutation = useMutation({
    mutationFn: (data: z.infer<typeof widgetSchema> & { dashboardId: number }) =>
      apiRequest('/api/currency-dashboard-widgets', {
        method: 'POST',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      setIsWidgetDialogOpen(false);
      widgetForm.reset();
      toast({
        title: "Успіх",
        description: "Віджет створено"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateWidgetMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<z.infer<typeof widgetSchema>>) =>
      apiRequest(`/api/currency-dashboard-widgets/${id}`, {
        method: 'PUT',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      setIsWidgetDialogOpen(false);
      setEditingWidget(null);
      widgetForm.reset();
      toast({
        title: "Успіх",
        description: "Віджет оновлено"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/currency-dashboard-widgets/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/currency-dashboards'] });
      toast({
        title: "Успіх",
        description: "Віджет видалено"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handlers
  const handleEditDashboard = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    dashboardForm.reset({
      name: dashboard.name,
      description: dashboard.description || "",
      isDefault: dashboard.isDefault,
      layout: dashboard.layout
    });
    setIsDashboardDialogOpen(true);
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
    widgetForm.reset({
      type: widget.type,
      title: widget.title,
      config: widget.config,
      position: widget.position,
      isVisible: widget.isVisible
    });
    setIsWidgetDialogOpen(true);
  };

  const handleSubmitDashboard = (data: z.infer<typeof dashboardSchema>) => {
    if (editingDashboard) {
      updateDashboardMutation.mutate({ id: editingDashboard.id, ...data });
    } else {
      createDashboardMutation.mutate(data);
    }
  };

  const handleSubmitWidget = (data: z.infer<typeof widgetSchema>) => {
    if (!selectedDashboard) return;
    
    if (editingWidget) {
      updateWidgetMutation.mutate({ id: editingWidget.id, ...data });
    } else {
      createWidgetMutation.mutate({ ...data, dashboardId: selectedDashboard });
    }
  };

  const handleDeleteWidget = (widgetId: number) => {
    deleteWidgetMutation.mutate(widgetId);
  };

  const handleToggleWidgetVisibility = (widgetId: number) => {
    const currentDashboard = dashboards.find(d => d.id === selectedDashboard);
    const widget = currentDashboard?.widgets?.find(w => w.id === widgetId);
    if (widget) {
      updateWidgetMutation.mutate({
        id: widgetId,
        isVisible: !widget.isVisible
      });
    }
  };

  if (dashboardsLoading) {
    return <div className="flex justify-center p-8">Завантаження...</div>;
  }

  const currentDashboard = dashboards.find(d => d.id === selectedDashboard);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Панелі валют</h3>
        <div className="flex gap-2">
          <Dialog open={isDashboardDialogOpen} onOpenChange={setIsDashboardDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Нова панель
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDashboard ? "Редагувати панель" : "Створити панель"}
                </DialogTitle>
                <DialogDescription>
                  Налаштуйте параметри панелі валют
                </DialogDescription>
              </DialogHeader>
              <Form {...dashboardForm}>
                <form onSubmit={dashboardForm.handleSubmit(handleSubmitDashboard)} className="space-y-4">
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
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={dashboardForm.control}
                      name="layout.columns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Колонки</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="12" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={dashboardForm.control}
                      name="layout.rows"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Рядки</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="10" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={dashboardForm.control}
                      name="layout.gap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Відступ</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="20" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={dashboardForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Зробити панеллю за замовчуванням</FormLabel>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createDashboardMutation.isPending || updateDashboardMutation.isPending}>
                      {editingDashboard ? "Оновити" : "Створити"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDashboardDialogOpen(false)}>
                      Скасувати
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {selectedDashboard && (
            <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Grid className="h-4 w-4 mr-2" />
                  Додати віджет
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingWidget ? "Редагувати віджет" : "Додати віджет"}
                  </DialogTitle>
                  <DialogDescription>
                    Налаштуйте параметри віджета для відображення валютної інформації
                  </DialogDescription>
                </DialogHeader>
                <Form {...widgetForm}>
                  <form onSubmit={widgetForm.handleSubmit(handleSubmitWidget)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                                <SelectItem value="rate-display">Відображення курсів</SelectItem>
                                <SelectItem value="rate-chart">Графік курсів</SelectItem>
                                <SelectItem value="currency-summary">Підсумок валют</SelectItem>
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
                              <Input placeholder="Поточні курси" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <FormField
                        control={widgetForm.control}
                        name="position.x"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>X позиція</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="position.y"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Y позиція</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="position.width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ширина</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="position.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Висота</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={widgetForm.control}
                        name="config.precision"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Точність</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="10" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="config.refreshInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Інтервал оновлення (сек)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="5" 
                                max="3600" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="config.baseCurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Базова валюта</FormLabel>
                            <FormControl>
                              <Input placeholder="UAH" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <FormField
                        control={widgetForm.control}
                        name="config.showTrend"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Показувати тренд</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="config.showPercentage"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Показувати відсотки</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={widgetForm.control}
                        name="isVisible"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Видимий</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={createWidgetMutation.isPending || updateWidgetMutation.isPending}>
                        {editingWidget ? "Оновити" : "Створити"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsWidgetDialogOpen(false)}>
                        Скасувати
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {/* Dashboard Tabs */}
      {dashboards && dashboards.length > 0 ? (
        <Tabs 
          value={selectedDashboard?.toString()} 
          onValueChange={(value) => setSelectedDashboard(parseInt(value))}
        >
          <TabsList className="w-full">
            {dashboards.map((dashboard: Dashboard) => (
              <TabsTrigger key={dashboard.id} value={dashboard.id.toString()} className="flex-1">
                {dashboard.name}
                {dashboard.isDefault && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    За замовчуванням
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {dashboards.map((dashboard: Dashboard) => (
            <TabsContent key={dashboard.id} value={dashboard.id.toString()}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium">{dashboard.name}</h4>
                    {dashboard.description && (
                      <p className="text-sm text-muted-foreground">{dashboard.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditDashboard(dashboard)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    {dashboards.length > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteDashboardMutation.mutate(dashboard.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Widgets Grid */}
                {dashboard.widgets && dashboard.widgets.length > 0 ? (
                  <div 
                    className="grid auto-rows-min"
                    style={{
                      gridTemplateColumns: `repeat(${dashboard.layout.columns}, minmax(0, 1fr))`,
                      gap: `${dashboard.layout.gap * 4}px`
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
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Немає віджетів у цій панелі
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => setIsWidgetDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Додати перший віджет
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <h3 className="text-lg font-medium mb-2">Немає панелей валют</h3>
            <p className="text-muted-foreground mb-4">
              Створіть першу панель для відстеження курсів валют
            </p>
            <Button onClick={() => setIsDashboardDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Створити панель
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Currencies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState("list");
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  const { data: currencies = [], isLoading } = useQuery<CurrencyWithLatestRate[]>({
    queryKey: ["/api/currencies"],
    select: (data: Currency[]) => {
      return data.map(currency => ({
        ...currency,
        latestRate: rates?.find(r => r.currencyCode === currency.code)?.rate,
        rateDate: rates?.find(r => r.currencyCode === currency.code)?.exchangeDate
      }));
    }
  });

  const { data: rates = [] } = useQuery<CurrencyRate[]>({
    queryKey: ["/api/currency-rates"]
  });

  const { data: settings } = useQuery<CurrencySettings>({
    queryKey: ["/api/currency-settings"]
  });

  const form = useForm<z.infer<typeof currencySchema>>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      code: "",
      name: "",
      symbol: "",
      decimalPlaces: 2,
      isBase: false,
      isActive: true
    }
  });

  const rateForm = useForm({
    resolver: zodResolver(z.object({
      rate: z.string().min(1, "Курс обов'язковий"),
      exchangeDate: z.string().min(1, "Дата обов'язкова")
    })),
    defaultValues: {
      rate: "",
      exchangeDate: format(new Date(), "yyyy-MM-dd")
    }
  });

  const settingsForm = useForm({
    resolver: zodResolver(z.object({
      autoUpdateEnabled: z.boolean(),
      updateTime: z.string(),
      enabledCurrencies: z.array(z.string())
    })),
    defaultValues: {
      autoUpdateEnabled: false,
      updateTime: "09:00",
      enabledCurrencies: []
    }
  });

  const createCurrencyMutation = useMutation({
    mutationFn: (data: z.infer<typeof currencySchema>) =>
      apiRequest("/api/currencies", {
        method: "POST",
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Валюту створено"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & z.infer<typeof currencySchema>) =>
      apiRequest(`/api/currencies/${id}`, {
        method: "PUT",
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsDialogOpen(false);
      form.reset();
      setEditingCurrency(null);
      toast({
        title: "Успіх",
        description: "Валюту оновлено"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteCurrencyMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/currencies/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Валюту видалено"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const addRateMutation = useMutation({
    mutationFn: (data: { currencyCode: string; rate: string; exchangeDate: string }) =>
      apiRequest("/api/currency-rates", {
        method: "POST",
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setIsRateDialogOpen(false);
      rateForm.reset();
      toast({
        title: "Успіх",
        description: "Курс додано"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateRatesMutation = useMutation({
    mutationFn: () => apiRequest("/api/currency-rates/update", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-rates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({
        title: "Успіх",
        description: "Курси оновлено з НБУ"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/currency-settings", {
        method: "PUT",
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currency-settings"] });
      setIsSettingsDialogOpen(false);
      toast({
        title: "Успіх",
        description: "Налаштування збережено"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    form.reset({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      isBase: currency.isBase,
      isActive: currency.isActive
    });
    setIsDialogOpen(true);
  };

  const handleAddRate = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsRateDialogOpen(true);
  };

  const onSubmit = (data: z.infer<typeof currencySchema>) => {
    if (editingCurrency) {
      updateCurrencyMutation.mutate({ id: editingCurrency.id, ...data });
    } else {
      createCurrencyMutation.mutate(data);
    }
  };

  const onRateSubmit = (data: any) => {
    if (!selectedCurrency) return;
    addRateMutation.mutate({
      currencyCode: selectedCurrency.code,
      rate: data.rate,
      exchangeDate: data.exchangeDate
    });
  };

  const onSettingsSubmit = (data: any) => {
    updateSettingsMutation.mutate(data);
  };

  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        autoUpdateEnabled: settings.autoUpdateEnabled,
        updateTime: settings.updateTime,
        enabledCurrencies: settings.enabledCurrencies
      });
    }
  }, [settings, settingsForm]);

  const handleUpdateRates = () => {
    updateRatesMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Завантаження...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Валюти</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleUpdateRates}
            disabled={updateRatesMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${updateRatesMutation.isPending ? 'animate-spin' : ''}`} />
            Оновити курси
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsSettingsDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Налаштування
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Список валют</TabsTrigger>
          <TabsTrigger value="rates">Курси</TabsTrigger>
          <TabsTrigger value="dashboard">Панелі</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Керування валютами</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Додати валюту
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCurrency ? "Редагувати валюту" : "Додати валюту"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Код валюти</FormLabel>
                          <FormControl>
                            <Input placeholder="USD" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Назва</FormLabel>
                          <FormControl>
                            <Input placeholder="Долар США" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Символ</FormLabel>
                          <FormControl>
                            <Input placeholder="$" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="decimalPlaces"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Десяткові знаки</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="10" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center space-x-4">
                      <FormField
                        control={form.control}
                        name="isBase"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Базова валюта</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Активна</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={createCurrencyMutation.isPending || updateCurrencyMutation.isPending}>
                        {editingCurrency ? "Оновити" : "Створити"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingCurrency(null);
                          form.reset();
                        }}
                      >
                        Скасувати
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код</TableHead>
                    <TableHead>Назва</TableHead>
                    <TableHead>Символ</TableHead>
                    <TableHead>Поточний курс</TableHead>
                    <TableHead>Дата курсу</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow key={currency.id}>
                      <TableCell className="font-medium">
                        {currency.code}
                        {currency.isBase && (
                          <Badge variant="secondary" className="ml-2">
                            Базова
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{currency.name}</TableCell>
                      <TableCell>{currency.symbol}</TableCell>
                      <TableCell>
                        {currency.latestRate ? (
                          <span className="font-mono">
                            {parseFloat(currency.latestRate).toFixed(currency.decimalPlaces)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {currency.rateDate ? (
                          format(new Date(currency.rateDate), "dd.MM.yyyy")
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={currency.isActive ? "default" : "secondary"}>
                          {currency.isActive ? "Активна" : "Неактивна"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddRate(currency)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCurrency(currency)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCurrencyMutation.mutate(currency.id)}
                            disabled={currency.isBase}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Історія курсів</h2>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Валюта</TableHead>
                    <TableHead>Курс</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Опис НБУ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.slice(0, 50).map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">{rate.currencyCode}</TableCell>
                      <TableCell className="font-mono">
                        {parseFloat(rate.rate).toFixed(4)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(rate.exchangeDate), "dd.MM.yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rate.txt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <CurrencyDashboardTab />
        </TabsContent>
      </Tabs>

      {/* Add Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Додати курс для {selectedCurrency?.name}</DialogTitle>
          </DialogHeader>
          <Form {...rateForm}>
            <form onSubmit={rateForm.handleSubmit(onRateSubmit)} className="space-y-4">
              <FormField
                control={rateForm.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Курс</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="41.25" 
                        type="number" 
                        step="0.0001"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rateForm.control}
                name="exchangeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={addRateMutation.isPending}>
                  Додати
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsRateDialogOpen(false);
                    setSelectedCurrency(null);
                    rateForm.reset();
                  }}
                >
                  Скасувати
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Налаштування валют</DialogTitle>
            <DialogDescription>
              Налаштування автоматичного оновлення курсів валют
            </DialogDescription>
          </DialogHeader>
          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
              <FormField
                control={settingsForm.control}
                name="autoUpdateEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Автоматичне оновлення</FormLabel>
                      <FormDescription>
                        Автоматично оновлювати курси валют щодня
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
              <FormField
                control={settingsForm.control}
                name="updateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Час оновлення</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormDescription>
                      Час щоденного оновлення курсів
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  Зберегти
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSettingsDialogOpen(false)}
                >
                  Скасувати
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}