import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductionForecastSchema, type ProductionForecast, type InsertProductionForecast } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, Calendar, BarChart3, AlertTriangle, CheckCircle, Clock, Target } from "lucide-react";
import { SearchFilters } from "@/components/SearchFilters";

export default function ProductionForecasts() {
  const [searchQuery, setSearchQuery] = useState("");
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
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-forecasts"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Успіх", description: "Прогноз створено успішно" });
    },
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  // Статистичні дані
  const totalForecasts = (forecasts as any[])?.length || 0;
  const activeForecasts = (forecasts as any[]).filter((f: any) => f.status === "active").length;
  const draftForecasts = (forecasts as any[]).filter((f: any) => f.status === "draft").length;
  const completedForecasts = (forecasts as any[]).filter((f: any) => f.status === "completed").length;

  // Фільтровані дані
  const filteredForecasts = (forecasts as any[]).filter((forecast: any) => {
    const matchesSearch = !searchQuery || 
      forecast.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      forecast.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <TrendingUp className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                  Прогнозування виробництва
                </h1>
                <p className="text-green-100 text-xl font-medium">Планування та прогнозування виробничих потужностей</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Новий прогноз
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Створити новий прогноз</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Назва прогнозу</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Введіть назву прогнозу" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Опис</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                value={field.value ?? ""} 
                                placeholder="Опис прогнозу" 
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Скасувати
                        </Button>
                        <Button type="submit">
                          Створити прогноз
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">Всього прогнозів</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{totalForecasts}</p>
                  <p className="text-xs text-green-600">Створено прогнозів</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Активні</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{activeForecasts}</p>
                  <p className="text-xs text-blue-600">В роботі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700 font-medium">Чернетки</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900 mb-1">{draftForecasts}</p>
                  <p className="text-xs text-yellow-600">На розробці</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Завершені</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{completedForecasts}</p>
                  <p className="text-xs text-purple-600">Готові прогнози</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Прогнози виробництва ({filteredForecasts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredForecasts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Немає прогнозів для відображення
              </div>
            ) : (
              <div className="space-y-4">
                {filteredForecasts.map((forecast: any) => (
                  <Card key={forecast.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="font-semibold">{forecast.name}</h3>
                          <p className="text-sm text-muted-foreground">{forecast.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          forecast.status === "active" ? "bg-green-100 text-green-800" :
                          forecast.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                          forecast.status === "completed" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {forecast.status === "active" ? "Активний" :
                           forecast.status === "draft" ? "Чернетка" :
                           forecast.status === "completed" ? "Завершений" : forecast.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}