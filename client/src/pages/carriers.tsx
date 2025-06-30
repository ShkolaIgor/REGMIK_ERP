import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Truck, CheckCircle, Grid3X3, DollarSign, Star, Search, Upload, Download, Edit, Trash, AlertTriangle, Phone, Mail, MapPin, Users } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Interfaces
interface Carrier {
  id: number;
  name: string;
  alternativeNames: string[] | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  serviceType: string | null;
  rating: number | null;
  apiKey: string | null;
  isActive: boolean;
  citiesCount: number | null;
  warehousesCount: number | null;
  lastSyncAt: string | null;
  syncTime: string | null;
  syncInterval: number | null;
  autoSync: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function Carriers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Queries
  const { data: carriers = [], isLoading } = useQuery({
    queryKey: ["/api/carriers"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/carriers', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      toast({ title: "Перевізника створено", description: "Новий перевізник успішно додано до системи" });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/carriers/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      toast({ title: "Перевізника оновлено", description: "Дані перевізника успішно збережено" });
      setEditingCarrier(null);
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/carriers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      toast({ title: "Перевізника видалено", description: "Перевізник успішно видалений з системи" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    }
  });

  // Filter logic
  const filteredCarriers = useMemo(() => {
    if (!Array.isArray(carriers)) return [];
    
    return carriers.filter((carrier: Carrier) => {
      const matchesSearch = !searchQuery || 
        carrier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carrier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        carrier.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "all" || carrier.serviceType === typeFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && carrier.isActive) ||
        (statusFilter === "inactive" && !carrier.isActive);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [carriers, searchQuery, typeFilter, statusFilter, ratingFilter]);

  // Statistics
  const statistics = useMemo(() => {
    if (!Array.isArray(carriers)) return { total: 0, active: 0, withApi: 0, synced: 0 };
    
    return {
      total: carriers.length,
      active: carriers.filter((c: Carrier) => c.isActive).length,
      withApi: carriers.filter((c: Carrier) => c.apiKey).length,
      synced: carriers.filter((c: Carrier) => c.lastSyncAt).length,
    };
  }, [carriers]);

  // Table columns
  const columns = [
    { key: "name", label: "Назва", sortable: true },
    { key: "contactPerson", label: "Контактна особа", sortable: true },
    { key: "phone", label: "Телефон", sortable: false },
    { key: "email", label: "Email", sortable: false },
    { 
      key: "serviceType", 
      label: "Тип послуг", 
      render: (carrier: Carrier) => {
        const serviceTypeLabels: { [key: string]: string } = {
          express: "Експрес",
          standard: "Стандартна",
          freight: "Вантажна",
          international: "Міжнародна"
        };
        return serviceTypeLabels[carrier.serviceType || ""] || "-";
      }
    },
    { 
      key: "rating", 
      label: "Рейтинг", 
      render: (carrier: Carrier) => (
        <div className="flex items-center space-x-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= (carrier.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-1">({carrier.rating || 0})</span>
        </div>
      )
    },
    { 
      key: "status", 
      label: "Статус", 
      render: (carrier: Carrier) => (
        <Badge variant={carrier.isActive ? "default" : "secondary"}>
          {carrier.isActive ? "Активний" : "Неактивний"}
        </Badge>
      )
    },
    { 
      key: "actions", 
      label: "Дії", 
      render: (carrier: Carrier) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setEditingCarrier(carrier)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDelete(carrier.id)}>
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цього перевізника?")) {
      deleteMutation.mutate(id);
    }
  };

  if (authLoading || isLoading) {
    return <div>Завантаження...</div>;
  }

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <Truck className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Довідник перевізників
                </h1>
                <p className="text-blue-100 text-xl font-medium">Управління перевізниками та службами доставки</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Додати перевізника
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-90"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Всього перевізників</p>
                  <p className="text-3xl font-bold">{statistics.total}</p>
                </div>
                <Truck className="w-8 h-8 text-blue-200 group-hover:rotate-6 transition-transform duration-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-90"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Активні</p>
                  <p className="text-3xl font-bold">{statistics.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200 group-hover:rotate-6 transition-transform duration-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-90"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">З API</p>
                  <p className="text-3xl font-bold">{statistics.withApi}</p>
                </div>
                <Grid3X3 className="w-8 h-8 text-purple-200 group-hover:rotate-6 transition-transform duration-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-90"></div>
            <CardContent className="relative p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Синхронізовані</p>
                  <p className="text-3xl font-bold">{statistics.synced}</p>
                </div>
                <Users className="w-8 h-8 text-amber-200 group-hover:rotate-6 transition-transform duration-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 shadow-lg border-gray-200/50">
          <CardContent className="p-6">
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Пошук за назвою, контактною особою або email..."
              filters={[
                {
                  key: "type",
                  label: "Тип послуг",
                  value: typeFilter,
                  onChange: setTypeFilter,
                  options: [
                    { value: "all", label: "Всі типи" },
                    { value: "express", label: "Експрес" },
                    { value: "standard", label: "Стандартна" },
                    { value: "freight", label: "Вантажна" },
                    { value: "international", label: "Міжнародна" }
                  ]
                },
                {
                  key: "status",
                  label: "Статус",
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: [
                    { value: "all", label: "Всі статуси" },
                    { value: "active", label: "Активні" },
                    { value: "inactive", label: "Неактивні" }
                  ]
                }
              ]}
            />
          </CardContent>
        </Card>

        {/* DataTable Section */}
        <Card className="shadow-lg border-gray-200/50">
          <CardContent className="p-6">
            <DataTable
              data={filteredCarriers}
              columns={columns}
              loading={isLoading}
              storageKey="carriers-table"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}