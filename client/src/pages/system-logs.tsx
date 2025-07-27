import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info, AlertTriangle, Bug, Trash2, Download, RefreshCw, Server, Activity, Mails, TriangleAlert, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SystemLog {
  id: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  module: string;
  message: string;
  details?: any;
  userId?: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  stack?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

interface LogStats {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  debugCount: number;
  recentErrors: SystemLog[];
}

const levelIcons = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  debug: Bug,
};

const levelColors = {
  info: "bg-blue-100 text-blue-800 border-blue-200",
  warn: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
  debug: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function SystemLogs() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    level: 'all',
    category: '',
    module: '',
    userId: 'all',
    startDate: '',
    endDate: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Отримання статистики логів
  const { data: stats } = useQuery<LogStats>({
    queryKey: ['/api/system-logs/stats'],
  });

  // Отримання користувачів для фільтра
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  // Отримання логів з фільтрацією
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['/api/system-logs', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      return apiRequest(`/api/system-logs?${params.toString()}`);
    },
  });

  // Очищення старих логів
  const deleteOldLogsMutation = useMutation({
    mutationFn: (olderThanDays: number) => 
      apiRequest(`/api/system-logs/cleanup?olderThanDays=${olderThanDays}`, {
        method: 'DELETE'
      }),
    onSuccess: (data) => {
      toast({
        title: "Логи очищено",
        description: `Видалено ${data.deletedCount} старих записів`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/system-logs/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося очистити логи",
        variant: "destructive",
      });
    },
  });

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteOldLogs = () => {
    if (confirm('Видалити логи старше 90 днів?')) {
      deleteOldLogsMutation.mutate(90);
    }
  };

  const formatLogTime = (timestamp: string) => {
    return format(new Date(timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: uk });
  };

  const renderLogDetails = (log: SystemLog) => {
    if (!log.details) return null;

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(log.details, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 mb-3">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Системні логи
                </h1>
                <p className="text-gray-600">Моніторинг та діагностика системи</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/system-logs'] })}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Оновити
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteOldLogs}
                disabled={deleteOldLogsMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Очистити старі
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-8 pt-3">
        {/* Статистичні картки */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mails className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-blue-700 font-medium">Всього логів</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">{stats.totalLogs.toLocaleString()}</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Mails className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-red-700 font-medium">Помилки</p>
                    </div>
                    <p className="text-3xl font-bold text-red-900 mb-1">{stats.errorCount.toLocaleString()}</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <ShieldAlert className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TriangleAlert className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-700 font-medium">Попередження</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900 mb-1">{stats.warnCount.toLocaleString()}</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <TriangleAlert className="w-8 h-8 text-white" />
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
                      <Info className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700 font-medium">Інформація</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-1">{stats.infoCount.toLocaleString()}</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Info className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-blue-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Bug className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">Налагодження</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">{stats.debugCount.toLocaleString()}</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Bug className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Фільтри */}
        <Card className="bg-white/80 backdrop-blur-sm mb-3">
          <CardHeader>
            <CardTitle>Фільтри</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              <Select value={filters.level} onValueChange={(value) => updateFilter('level', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Рівень" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі рівні</SelectItem>
                  <SelectItem value="error">Помилки</SelectItem>
                  <SelectItem value="warn">Попередження</SelectItem>
                  <SelectItem value="info">Інформація</SelectItem>
                  <SelectItem value="debug">Налагодження</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Категорія"
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
              />

              <Input
                placeholder="Модуль"
                value={filters.module}
                onChange={(e) => updateFilter('module', e.target.value)}
              />

              <Select value={filters.userId} onValueChange={(value) => updateFilter('userId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Користувач" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі користувачі</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName} (${user.username})`
                        : user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Дата від"
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
              />

              <Input
                type="date"
                placeholder="Дата до"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
              />

              <Select value={filters.limit.toString()} onValueChange={(value) => updateFilter('limit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 записів</SelectItem>
                  <SelectItem value="50">50 записів</SelectItem>
                  <SelectItem value="100">100 записів</SelectItem>
                  <SelectItem value="200">200 записів</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Список логів */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Логи системи</span>
              {logsData && (
                <span className="text-sm font-normal text-gray-600">
                  Показано {logsData.logs?.length || 0} з {logsData.total || 0} записів
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Activity className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2">Завантаження логів...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {logsData?.logs?.map((log: SystemLog) => {
                  const IconComponent = levelIcons[log.level];
                  return (
                    <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <IconComponent className={`w-5 h-5 mt-1 ${
                            log.level === 'error' ? 'text-red-500' :
                            log.level === 'warn' ? 'text-yellow-500' :
                            log.level === 'info' ? 'text-blue-500' :
                            'text-gray-500'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={levelColors[log.level]}>
                                {log.level.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{log.category}</Badge>
                              <Badge variant="outline">{log.module}</Badge>
                              {log.user && (
                                <Badge variant="secondary">
                                  {log.user.firstName} {log.user.lastName} ({log.user.username})
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-900 font-medium mb-1">{log.message}</p>
                            <div className="text-sm text-gray-600 space-x-4">
                              <span>{formatLogTime(log.createdAt)}</span>
                              {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                              {log.requestId && <span>Request: {log.requestId}</span>}
                            </div>
                            {renderLogDetails(log)}
                            {log.stack && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-red-600 text-sm">Stack trace</summary>
                                <pre className="mt-2 p-3 bg-red-50 text-red-800 text-xs overflow-x-auto rounded">
                                  {log.stack}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Пагінація */}
                {logsData?.total > filters.limit && (
                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="outline"
                      disabled={filters.page === 1}
                      onClick={() => handlePageChange(filters.page - 1)}
                    >
                      Попередня
                    </Button>
                    <span className="text-sm text-gray-600">
                      Сторінка {filters.page} з {Math.ceil(logsData.total / filters.limit)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={filters.page >= Math.ceil(logsData.total / filters.limit)}
                      onClick={() => handlePageChange(filters.page + 1)}
                    >
                      Наступна
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}