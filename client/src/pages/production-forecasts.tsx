import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductionForecastSchema, type ProductionForecast, type InsertProductionForecast } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, TrendingUp, Calendar, BarChart3, AlertTriangle, CheckCircle, Clock, Archive } from "lucide-react";

export default function ProductionForecasts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: forecasts = [], isLoading } = useQuery<ProductionForecast[]>({
    queryKey: ["/api/production-forecasts"],
  });

  const form = useForm<InsertProductionForecast>({
    resolver: zodResolver(insertProductionForecastSchema),
    defaultValues: {
      name: "",
      description: "",
      forecastType: "demand",
      periodType: "monthly",
      status: "draft",
      methodology: "linear_regression",
      createdBy: "Користувач",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProductionForecast) => {
      return apiRequest("/api/production-forecasts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-forecasts"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Прогноз виробництва створено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити прогноз виробництва",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProductionForecast) => {
    const submitData = {
      ...data,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 днів
    };
    createMutation.mutate(submitData);
  };

  const filteredForecasts = forecasts.filter((forecast) =>
    forecast.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (forecast.description && forecast.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    forecast.forecastType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-4 w-4" />;
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "archived":
        return <Archive className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "demand":
        return <TrendingUp className="h-4 w-4" />;
      case "capacity":
        return <BarChart3 className="h-4 w-4" />;
      case "material":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Прогнозування виробництва</h1>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Онлайн
                </div>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Створити прогноз
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Створення нового прогнозу</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Назва прогнозу</FormLabel>
                            <FormControl>
                              <Input placeholder="Введіть назву" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="forecastType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Тип прогнозу</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть тип" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="demand">Попит</SelectItem>
                                <SelectItem value="capacity">Потужність</SelectItem>
                                <SelectItem value="material">Матеріали</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="periodType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Період</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть період" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Щоденно</SelectItem>
                                <SelectItem value="weekly">Щотижня</SelectItem>
                                <SelectItem value="monthly">Щомісяця</SelectItem>
                                <SelectItem value="quarterly">Щокварталу</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="methodology"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Методологія</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть методологію" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="linear_regression">Лінійна регресія</SelectItem>
                                <SelectItem value="moving_average">Ковзне середнє</SelectItem>
                                <SelectItem value="exponential_smoothing">Експоненційне згладжування</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Опис</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Введіть опис прогнозу"
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Скасувати
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createMutation.isPending ? "Створення..." : "Створити"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Пошук за назвою, описом або типом..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredForecasts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Прогнози не знайдено" : "Немає прогнозів"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? "Спробуйте змінити критерії пошуку" 
                  : "Створіть перший прогноз виробництва для початку планування"
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Створити прогноз
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForecasts.map((forecast) => (
              <Card key={forecast.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium truncate">
                      {forecast.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(forecast.forecastType)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(forecast.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(forecast.status)}
                        <span className="capitalize">
                          {forecast.status === "draft" && "Чернетка"}
                          {forecast.status === "active" && "Активний"}
                          {forecast.status === "completed" && "Завершений"}
                          {forecast.status === "archived" && "Архівований"}
                        </span>
                      </div>
                    </Badge>
                    <Badge variant="outline">
                      {forecast.forecastType === "demand" && "Попит"}
                      {forecast.forecastType === "capacity" && "Потужність"}
                      {forecast.forecastType === "material" && "Матеріали"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {forecast.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Період:</span>
                        <p className="font-medium">
                          {forecast.periodType === "daily" && "Щоденно"}
                          {forecast.periodType === "weekly" && "Щотижня"}
                          {forecast.periodType === "monthly" && "Щомісяця"}
                          {forecast.periodType === "quarterly" && "Щокварталу"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Методологія:</span>
                        <p className="font-medium text-xs">
                          {forecast.methodology === "linear_regression" && "Лінійна регресія"}
                          {forecast.methodology === "moving_average" && "Ковзне середнє"}
                          {forecast.methodology === "exponential_smoothing" && "Експ. згладжування"}
                        </p>
                      </div>
                    </div>

                    {(forecast.accuracy || forecast.confidence) && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {forecast.accuracy && (
                          <div>
                            <span className="text-gray-500">Точність:</span>
                            <p className="font-medium">{forecast.accuracy}%</p>
                          </div>
                        )}
                        {forecast.confidence && (
                          <div>
                            <span className="text-gray-500">Довіра:</span>
                            <p className="font-medium">{forecast.confidence}%</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(forecast.createdAt).toLocaleDateString('uk-UA')}</span>
                      </div>
                      {forecast.createdBy && (
                        <span>Автор: {forecast.createdBy}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}