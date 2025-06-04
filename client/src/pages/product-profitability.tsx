import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, Package, BarChart3, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell } from "recharts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChartSkeleton, CardSkeleton, TableLoadingState } from "@/components/ui/loading-state";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1'];

interface ProfitabilityData {
  productId: number;
  productName: string;
  productSku: string;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
}

interface ProductTrend {
  monthName: string;
  profit: number;
  revenue: number;
  cost: number;
  profitMargin: number;
  unitsSold: number;
}

export default function ProductProfitability() {
  const [period, setPeriod] = useState("month");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  const { data: profitabilityData = [], isLoading: profitabilityLoading } = useQuery<ProfitabilityData[]>({
    queryKey: ["/api/analytics/product-profitability", period],
  });

  const { data: topProducts = [], isLoading: topProductsLoading } = useQuery<ProfitabilityData[]>({
    queryKey: ["/api/analytics/top-profitable-products", period],
  });

  const { data: productTrends = [], isLoading: trendsLoading } = useQuery<ProductTrend[]>({
    queryKey: ["/api/analytics/product-trends", selectedProduct],
    enabled: !!selectedProduct,
  });

  // Обчислюємо загальні показники
  const totalRevenue = profitabilityData.reduce((sum: number, item: ProfitabilityData) => sum + (item.totalRevenue || 0), 0);
  const totalProfit = profitabilityData.reduce((sum: number, item: ProfitabilityData) => sum + (item.totalProfit || 0), 0);
  const totalCost = profitabilityData.reduce((sum: number, item: ProfitabilityData) => sum + (item.totalCost || 0), 0);
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Підготовка даних для графіків
  const profitabilityChartData = profitabilityData.slice(0, 10).map((item: ProfitabilityData) => ({
    name: item.productName?.substring(0, 15) + (item.productName?.length > 15 ? '...' : ''),
    fullName: item.productName,
    profit: item.totalProfit,
    revenue: item.totalRevenue,
    margin: item.profitMargin,
    units: item.unitsSold
  }));

  const marginDistribution = profitabilityData.reduce((acc: Record<string, number>, item: ProfitabilityData) => {
    const margin = item.profitMargin;
    let category;
    if (margin < 0) category = 'Збиткові (< 0%)';
    else if (margin < 10) category = 'Низька (0-10%)';
    else if (margin < 25) category = 'Середня (10-25%)';
    else if (margin < 50) category = 'Висока (25-50%)';
    else category = 'Дуже висока (> 50%)';
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const marginPieData = Object.entries(marginDistribution).map(([name, value]) => ({
    name,
    value,
    percentage: ((value as number) / profitabilityData.length * 100).toFixed(1)
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProfitabilityBadge = (margin: number) => {
    if (margin < 0) return <Badge variant="destructive">Збитковий</Badge>;
    if (margin < 10) return <Badge variant="secondary">Низька</Badge>;
    if (margin < 25) return <Badge variant="outline">Середня</Badge>;
    if (margin < 50) return <Badge variant="default">Висока</Badge>;
    return <Badge className="bg-green-600">Дуже висока</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Аналіз рентабельності продуктів</h1>
          <p className="text-muted-foreground">
            Детальний аналіз прибутковості та рентабельності товарів
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Тиждень</SelectItem>
              <SelectItem value="month">Місяць</SelectItem>
              <SelectItem value="quarter">Квартал</SelectItem>
              <SelectItem value="year">Рік</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Загальні показники */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загальний дохід</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              За обраний період
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загальний прибуток</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Дохід мінус собівартість
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Середня маржа</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              По всіх продуктах
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Прибуткових товарів</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitabilityData.filter((item: any) => item.totalProfit > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              З {profitabilityData.length} загалом
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Топ-10 найприбутковіших товарів */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Найприбутковіші товари
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profitabilityLoading ? (
              <ChartSkeleton />
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitabilityChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'profit' ? formatCurrency(value) : value,
                        name === 'profit' ? 'Прибуток' : name === 'revenue' ? 'Дохід' : 'Маржа'
                      ]}
                      labelFormatter={(label: string) => {
                        const item = profitabilityChartData.find(d => d.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Bar dataKey="profit" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Розподіл за рентабельністю */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Розподіл за рентабельністю
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip 
                    formatter={(value: any) => [`${value} товарів`, 'Кількість']}
                  />
                  <RechartsPieChart data={marginPieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value">
                    {marginPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </RechartsPieChart>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {marginPieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-medium">{entry.value} ({entry.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Детальна таблиця */}
      <Card>
        <CardHeader>
          <CardTitle>Детальний аналіз рентабельності</CardTitle>
        </CardHeader>
        <CardContent>
          {profitabilityLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Продано</TableHead>
                    <TableHead className="text-right">Дохід</TableHead>
                    <TableHead className="text-right">Собівартість</TableHead>
                    <TableHead className="text-right">Прибуток</TableHead>
                    <TableHead className="text-right">Маржа</TableHead>
                    <TableHead>Рентабельність</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitabilityData.map((item: any) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.productSku}</TableCell>
                      <TableCell className="text-right">{item.unitsSold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.totalProfit >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(item.totalProfit)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={item.profitMargin >= 0 ? "text-green-600" : "text-red-600"}>
                          {item.profitMargin.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {getProfitabilityBadge(item.profitMargin)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProduct(item.productId)}
                        >
                          Тренди
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Тренди вибраного продукту */}
      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Тренд рентабельності товару</CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'profit' || name === 'revenue' || name === 'cost' 
                          ? formatCurrency(value) 
                          : name === 'profitMargin' 
                            ? `${value}%` 
                            : value,
                        name === 'profit' ? 'Прибуток' : 
                        name === 'revenue' ? 'Дохід' : 
                        name === 'cost' ? 'Собівартість' : 
                        name === 'profitMargin' ? 'Маржа' : 'Продано'
                      ]}
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#0088FE" 
                      strokeWidth={2}
                      name="profit"
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#00C49F" 
                      strokeWidth={2}
                      name="revenue"
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="profitMargin" 
                      stroke="#FF8042" 
                      strokeWidth={2}
                      name="profitMargin"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}