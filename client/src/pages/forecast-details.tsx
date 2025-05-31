import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { ArrowLeft, TrendingUp, BarChart3, Calendar, Target, Activity } from "lucide-react";
import { type ProductionForecast } from "@shared/schema";

// Тестові дані для демонстрації графіків
const generateForecastData = (forecastType: string, periodType: string) => {
  const periods = periodType === 'daily' ? 30 : periodType === 'weekly' ? 12 : 6;
  const data = [];
  
  for (let i = 0; i < periods; i++) {
    const baseValue = forecastType === 'demand' ? 100 + Math.random() * 50 : 
                     forecastType === 'capacity' ? 80 + Math.random() * 40 : 
                     50 + Math.random() * 30;
    
    data.push({
      period: periodType === 'daily' ? `День ${i + 1}` : 
              periodType === 'weekly' ? `Тиждень ${i + 1}` : 
              `Місяць ${i + 1}`,
      actual: Math.round(baseValue + Math.sin(i * 0.5) * 20),
      predicted: Math.round(baseValue + Math.sin(i * 0.5 + 0.2) * 18 + Math.random() * 10 - 5),
      confidence: Math.round(85 + Math.random() * 10),
    });
  }
  
  return data;
};

const generateAccuracyData = () => [
  { metric: 'MAPE', value: 12.5, benchmark: 15 },
  { metric: 'RMSE', value: 8.3, benchmark: 10 },
  { metric: 'MAE', value: 6.7, benchmark: 8 },
  { metric: 'R²', value: 0.85, benchmark: 0.8 },
];

const generateDistributionData = () => [
  { range: '0-50', count: 15, color: '#8884d8' },
  { range: '51-100', count: 35, color: '#82ca9d' },
  { range: '101-150', count: 28, color: '#ffc658' },
  { range: '151-200', count: 18, color: '#ff7300' },
  { range: '200+', count: 8, color: '#8dd1e1' },
];

export default function ForecastDetails() {
  const { id } = useParams<{ id: string }>();
  
  const { data: forecast, isLoading } = useQuery<ProductionForecast>({
    queryKey: ["/api/production-forecasts", id],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Завантаження...</div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Прогноз не знайдено</div>
      </div>
    );
  }

  const forecastData = generateForecastData(forecast.forecastType, forecast.periodType);
  const accuracyData = generateAccuracyData();
  const distributionData = generateDistributionData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'demand': return 'Попит';
      case 'capacity': return 'Потужність';
      case 'material': return 'Матеріали';
      default: return type;
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return 'Щоденно';
      case 'weekly': return 'Щотижнево';
      case 'monthly': return 'Щомісячно';
      default: return period;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Назад</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{forecast.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className={getStatusColor(forecast.status)}>
                    {forecast.status === 'active' ? 'Активний' : 
                     forecast.status === 'draft' ? 'Чернетка' : 'Завершений'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {getTypeLabel(forecast.forecastType)} • {getPeriodLabel(forecast.periodType)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-500">Точність</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {forecast.accuracy ? `${forecast.accuracy}%` : '87.5%'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-medium text-gray-500">Довіра</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {forecast.confidence ? `${forecast.confidence}%` : '92%'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-medium text-gray-500">Методологія</h3>
              </div>
              <p className="text-sm font-bold text-gray-900 mt-2">
                {forecast.methodology === 'linear_regression' ? 'Лінійна регресія' : 
                 forecast.methodology === 'exponential_smoothing' ? 'Експон. згладжування' : 
                 forecast.methodology === 'arima' ? 'ARIMA' : 'Нейронні мережі'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-medium text-gray-500">Період</h3>
              </div>
              <p className="text-sm font-bold text-gray-900 mt-2">
                {new Date(forecast.startDate).toLocaleDateString('uk-UA')} - {' '}
                {new Date(forecast.endDate).toLocaleDateString('uk-UA')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs with Charts */}
        <Tabs defaultValue="forecast" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forecast">Прогноз</TabsTrigger>
            <TabsTrigger value="accuracy">Точність</TabsTrigger>
            <TabsTrigger value="distribution">Розподіл</TabsTrigger>
            <TabsTrigger value="trends">Тренди</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Прогнозовані значення</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Фактичні значення"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Прогнозовані значення"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accuracy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Метрики точності</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accuracyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Поточне значення" />
                      <Bar dataKey="benchmark" fill="#82ca9d" name="Бенчмарк" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Розподіл значень</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Тренди та довірчі інтервали</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="confidence" 
                        stackId="1"
                        stroke="#ffc658" 
                        fill="#ffc658"
                        fillOpacity={0.3}
                        name="Довірчий інтервал (%)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        stroke="#8884d8" 
                        strokeWidth={3}
                        name="Прогноз"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Description */}
        {forecast.description && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Опис прогнозу</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{forecast.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}