import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Edit2, Trash2, Package2, CheckCircle, Grid3X3, DollarSign, Layers, Search, Scan, Printer, Download, AlertTriangle, ShoppingCart } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  barcode: string | null;
  categoryId: number | null;
  costPrice: string;
  retailPrice: string;
  photo: string | null;
  productType: string;
  unit: string;
  minStock: number | null;
  maxStock: number | null;
  isActive: boolean | null;
  createdAt: Date;
}

interface ImportJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  processed: number;
  imported: number;
  skipped: number;
  errors: string[];
  details: Array<{
    name: string;
    status: 'imported' | 'updated' | 'skipped' | 'error';
    message?: string;
  }>;
  totalRows: number;
}

export default function ProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: products = [], isLoading, isError } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  // Filter products
  const filteredProducts = products.filter((product: Product) => {
    // Search by name, SKU, or description
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filter by category
    const matchesCategory = categoryFilter === "all" || 
      (categoryFilter === "null" && !product.categoryId) ||
      (product.categoryId && product.categoryId.toString() === categoryFilter);

    // Filter by status
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && product.isActive) ||
      (statusFilter === "inactive" && !product.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Event handlers
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteAlert(true);
  };

  const columns = [
    {
      key: "sku",
      label: "SKU",
      width: "15%"
    },
    {
      key: "name", 
      label: "Назва",
      width: "30%"
    },
    {
      key: "costPrice",
      label: "Ціна закупки",
      width: "15%",
      render: (item: Product) => `${parseFloat(item.costPrice).toLocaleString('uk-UA')} ₴`
    },
    {
      key: "retailPrice",
      label: "Роздрібна ціна", 
      width: "15%",
      render: (item: Product) => `${parseFloat(item.retailPrice).toLocaleString('uk-UA')} ₴`
    },
    {
      key: "isActive",
      label: "Статус",
      width: "10%",
      render: (item: Product) => (
        <Badge variant={item.isActive ? "default" : "secondary"}>
          {item.isActive ? "Активний" : "Неактивний"}
        </Badge>
      )
    }
  ];

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <Package2 className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                  Каталог товарів
                </h1>
                <p className="text-green-100 text-xl font-medium">Управління продуктами, категоріями та цінами</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                onChange={() => {}}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
              >
                <Upload className="w-5 h-5 mr-2" />
                Імпорт XML
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold">
                    <Plus className="w-5 h-5 mr-2" />
                    Новий товар
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-8 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Всього товарів</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                <Package2 className="h-6 w-6 text-green-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{products.length}</div>
              <p className="text-xs text-green-600 mt-1">у каталозі</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-sky-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Активні</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                <CheckCircle className="h-6 w-6 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{products.filter((p: Product) => p.isActive).length}</div>
              <p className="text-xs text-blue-600 mt-1">в продажу</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Категорії</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                <Grid3X3 className="h-6 w-6 text-purple-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">{categories.length}</div>
              <p className="text-xs text-purple-600 mt-1">різних типів</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Середня ціна</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-300">
                <DollarSign className="h-6 w-6 text-orange-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {products.length > 0 
                  ? Math.round(products.reduce((sum: number, p: Product) => sum + parseFloat(p.retailPrice), 0) / products.length)
                  : 0} ₴
              </div>
              <p className="text-xs text-orange-600 mt-1">за товар</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="w-full px-8 py-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Пошук товарів за назвою, SKU, описом..."
              filters={[
                {
                  key: "category",
                  label: "Категорія",
                  value: categoryFilter,
                  onChange: setCategoryFilter,
                  options: [
                    { value: "all", label: "Всі категорії" },
                    { value: "null", label: "Без категорії" },
                    ...categories.map((category: any) => ({
                      value: category.id.toString(),
                      label: category.name
                    }))
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

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <DataTable
              data={filteredProducts}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="Товарів не знайдено"
              storageKey="products"
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Підтвердження видалення</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити товар "{productToDelete?.name}"? 
              Цю дію не можна скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                // Handle delete mutation here
                setShowDeleteAlert(false);
                setProductToDelete(null);
              }}
            >
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}