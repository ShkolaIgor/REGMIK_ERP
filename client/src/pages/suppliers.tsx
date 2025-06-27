import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, CheckCircle, Grid3X3, DollarSign, Star, Search, Upload, Download, Edit, Trash, AlertTriangle, Phone, Mail, MapPin, Users } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Interfaces
interface Supplier {
  id: number;
  name: string;
  fullName: string | null;
  taxCode: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  rating: number;
  isActive: boolean;
  externalId: number | null;
  clientTypeId: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function Suppliers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Queries
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Визначення колонок для DataTable
  const columns = [
    {
      key: 'name',
      label: 'Назва',
      sortable: true,
    },
    {
      key: 'fullName',
      label: 'Повна назва',
      sortable: true,
    },
    {
      key: 'taxCode',
      label: 'Код ЄДРПОУ',
      sortable: true,
    },
    {
      key: 'contactPerson',
      label: 'Контактна особа',
      sortable: true,
    },
    {
      key: 'rating',
      label: 'Рейтинг',
      sortable: true,
      render: (value: number) => {
        return (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < value
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-1 text-sm text-gray-600">({value})</span>
          </div>
        );
      }
    },
    {
      key: 'isActive',
      label: 'Статус',
      sortable: true,
      render: (value: boolean) => value ? 'Активний' : 'Неактивний'
    }
  ];

  // Фільтрування постачальників
  const filteredSuppliers = useMemo(() => {
    if (!Array.isArray(suppliers)) return [];
    
    return suppliers.filter((supplier: Supplier) => {
      // Пошук
      const matchesSearch = !searchQuery || 
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (supplier.fullName && supplier.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (supplier.taxCode && supplier.taxCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()));

      // Фільтр за типом (можна розширити пізніше)
      const matchesType = typeFilter === "all";

      // Фільтр за статусом
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && supplier.isActive) ||
        (statusFilter === "inactive" && !supplier.isActive);

      // Фільтр за рейтингом
      const matchesRating = ratingFilter === "all" || 
        (ratingFilter === "1-2" && supplier.rating >= 1 && supplier.rating <= 2) ||
        (ratingFilter === "3" && supplier.rating === 3) ||
        (ratingFilter === "4-5" && supplier.rating >= 4 && supplier.rating <= 5);

      return matchesSearch && matchesType && matchesStatus && matchesRating;
    });
  }, [suppliers, searchQuery, typeFilter, statusFilter, ratingFilter]);

  // Компонент рейтингу зірок
  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">({rating})</span>
    </div>
  );

  // Card template для DataTable
  const cardTemplate = (supplier: Supplier) => (
    <Card className="h-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {supplier.name}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              {supplier.taxCode && (
                <Badge variant="outline" className="text-xs">
                  ЄДРПОУ: {supplier.taxCode}
                </Badge>
              )}
              {supplier.isActive ? (
                <Badge className="bg-green-100 text-green-800 text-xs">Активний</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Неактивний</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {supplier.fullName && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Повна назва:</span> {supplier.fullName}
            </div>
          )}
          {supplier.contactPerson && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{supplier.contactPerson}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{supplier.email}</span>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{supplier.address}</span>
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <StarRating rating={supplier.rating} />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingSupplier(supplier);
            }}
            className="w-full"
          >
            <Edit className="w-3 h-3 mr-1" />
            Редагувати
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="container mx-auto p-6">
            <div className="text-center py-12">
              <p className="text-gray-600">Завантаження постачальників...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      Постачальники
                    </h1>
                    <p className="text-gray-600 mt-1">Управління базою постачальників та партнерів</p>
                  </div>
                </div>
              </div>
            
              <div className="flex items-center space-x-4"> 
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Додати постачальника
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <main className="w-full px-8 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700 font-medium">Показано постачальників</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-1">{filteredSuppliers.length}</p>
                    <p className="text-xs text-blue-600">З {suppliers.length} загалом</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">Активні постачальники</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">{filteredSuppliers.filter((s: Supplier) => s.isActive).length}</p>
                    <p className="text-xs text-emerald-600">Працюють з нами</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
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
                      <Star className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm text-yellow-700 font-medium">Середній рейтинг</p>
                    </div>
                    <p className="text-3xl font-bold text-yellow-900 mb-1">{filteredSuppliers.length > 0 
                        ? Math.round(filteredSuppliers.reduce((sum: number, s: Supplier) => sum + s.rating, 0) / filteredSuppliers.length * 10) / 10
                        : 0}</p>
                    <p className="text-xs text-yellow-600">З 5 можливих</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Star className="w-8 h-8 text-white" />
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
                      <Users className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">З контактами</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">{filteredSuppliers.filter((s: Supplier) => s.contactPerson).length}</p>
                    <p className="text-xs text-purple-600">Мають контактну особу</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="w-full py-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <SearchFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Пошук постачальників за назвою, кодом, контактами..."
                    filters={[
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
                      },
                      {
                        key: "rating",
                        label: "Рейтинг",
                        value: ratingFilter,
                        onChange: setRatingFilter,
                        options: [
                          { value: "all", label: "Всі рейтинги" },
                          { value: "4-5", label: "4-5 зірок" },
                          { value: "3", label: "3 зірки" },
                          { value: "1-2", label: "1-2 зірки" }
                        ]
                      }
                    ]}
                  />

                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsImportDialogOpen(true)}
                      className={`border-blue-200 text-blue-600 hover:bg-blue-50 ${!isAuthenticated ? 'opacity-50' : ''}`}
                      disabled={!isAuthenticated}
                      title={!isAuthenticated ? "Потрібна авторизація для імпорту" : ""}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Імпорт XML
                      {!isAuthenticated && <AlertTriangle className="ml-2 h-4 w-4 text-orange-500" />}
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Експорт
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DataTable */}
          <div className="w-full">
            <DataTable
              data={filteredSuppliers}
              columns={columns}
              storageKey="suppliers-table"
              cardTemplate={cardTemplate}
              onRowClick={(supplier) => setEditingSupplier(supplier)}
              actions={(supplier) => (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSupplier(supplier);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement delete functionality
                    }}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              )}
            />
          </div>
        </main>

        {/* Edit Supplier Dialog */}
        <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редагування постачальника</DialogTitle>
              <DialogDescription>
                Змініть інформацію про постачальника
              </DialogDescription>
            </DialogHeader>
            {editingSupplier && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Назва *</label>
                    <input
                      type="text"
                      defaultValue={editingSupplier.name}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Повна назва</label>
                    <input
                      type="text"
                      defaultValue={editingSupplier.fullName || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Код ЄДРПОУ</label>
                    <input
                      type="text"
                      defaultValue={editingSupplier.taxCode || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Контактна особа</label>
                    <input
                      type="text"
                      defaultValue={editingSupplier.contactPerson || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email"
                      defaultValue={editingSupplier.email || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Телефон</label>
                    <input
                      type="text"
                      defaultValue={editingSupplier.phone || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Адреса</label>
                    <input
                      type="text"
                      defaultValue={editingSupplier.address || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Рейтинг</label>
                    <select 
                      defaultValue={editingSupplier.rating.toString()}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="1">1 зірка</option>
                      <option value="2">2 зірки</option>
                      <option value="3">3 зірки</option>
                      <option value="4">4 зірки</option>
                      <option value="5">5 зірок</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      defaultChecked={editingSupplier.isActive}
                      className="h-4 w-4 rounded border border-input"
                    />
                    <label className="text-sm font-medium">Активний</label>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Ви впевнені, що хочете видалити цього постачальника?')) {
                        // TODO: Implement delete functionality
                        toast({ title: "Функція видалення в розробці" });
                        setEditingSupplier(null);
                      }
                    }}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Видалити постачальника
                  </Button>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingSupplier(null)}
                    >
                      Скасувати
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                      onClick={() => {
                        // TODO: Implement save functionality
                        toast({ title: "Функція збереження в розробці" });
                        setEditingSupplier(null);
                      }}
                    >
                      Зберегти зміни
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Import XML Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Імпорт XML файлу</DialogTitle>
              <DialogDescription>
                Завантажте XML файл з постачальниками
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="xml-file-suppliers" className="text-sm font-medium">
                  Оберіть XML файл
                </label>
                <input
                  id="xml-file-suppliers"
                  type="file"
                  accept=".xml"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Скасувати
                </Button>
                <Button onClick={() => {
                  // TODO: Implement XML import logic
                  toast({ title: "Функція імпорту в розробці" });
                  setIsImportDialogOpen(false);
                }}>
                  Імпортувати
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}