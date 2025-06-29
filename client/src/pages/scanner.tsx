import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, DollarSign, Warehouse, ShoppingCart, Camera, QrCode, Barcode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SearchFilters } from "@/components/SearchFilters";

export default function Scanner() {
  const [searchQuery, setSearchQuery] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: components = [] } = useQuery({
    queryKey: ["/api/components"],
  });

  const searchByBarcode = (barcode: string) => {
    setIsSearching(true);
    setScannedCode(barcode);

    // Пошук в товарах та компонентах
    const productResults = (products as any[]).filter((product: any) => 
      product.barcode === barcode || 
      product.sku === barcode ||
      product.name?.toLowerCase().includes(barcode.toLowerCase())
    );

    const componentResults = (components as any[]).filter((component: any) => 
      component.sku === barcode ||
      component.partNumber === barcode ||
      component.name?.toLowerCase().includes(barcode.toLowerCase())
    );

    const allResults = [...productResults, ...componentResults];
    setSearchResults(allResults);
    setIsSearching(false);

    if (allResults.length === 0) {
      toast({
        title: "Не знайдено",
        description: `Товар з кодом "${barcode}" не знайдено`,
        variant: "destructive",
      });
    }
  };

  const handleManualSearch = () => {
    if (searchQuery.trim()) {
      searchByBarcode(searchQuery.trim());
    }
  };

  // Фільтровані результати
  const filteredResults = searchResults.filter((item: any) => {
    const matchesSearch = !searchQuery || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <QrCode className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                  Сканер штрих-кодів
                </h1>
                <p className="text-cyan-100 text-xl font-medium">Швидкий пошук товарів та компонентів за штрих-кодами</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleManualSearch}
                disabled={isSearching}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                {isSearching ? "Пошук..." : "Пошук"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-teal-600" />
                    <p className="text-sm text-teal-700 font-medium">Товарів</p>
                  </div>
                  <p className="text-3xl font-bold text-teal-900 mb-1">{(products as any[])?.length || 0}</p>
                  <p className="text-xs text-teal-600">У базі даних</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-4 h-4 text-cyan-600" />
                    <p className="text-sm text-cyan-700 font-medium">Компонентів</p>
                  </div>
                  <p className="text-3xl font-bold text-cyan-900 mb-1">{(components as any[])?.length || 0}</p>
                  <p className="text-xs text-cyan-600">У каталозі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <ShoppingCart className="w-8 h-8 text-white" />
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
                    <Search className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Знайдено</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{filteredResults.length}</p>
                  <p className="text-xs text-blue-600">Результатів пошуку</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Search className="w-8 h-8 text-white" />
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
                    <QrCode className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Останній код</p>
                  </div>
                  <p className="text-lg font-bold text-purple-900 mb-1">{scannedCode || "—"}</p>
                  <p className="text-xs text-purple-600">Сканований код</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введіть штрих-код або SKU для пошуку..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
              />
              <Button onClick={handleManualSearch} disabled={isSearching}>
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? "Пошук..." : "Пошук"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Результати сканування ({filteredResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {scannedCode ? "Товар не знайдено за вказаним кодом" : "Відскануйте штрих-код або введіть код для пошуку"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResults.map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <QrCode className="h-5 w-5 text-teal-600" />
                        <div>
                          <h3 className="font-semibold">{item.name || "Без назви"}</h3>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.sku || "Не вказано"} | Штрих-код: {item.barcode || "Відсутній"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-teal-100 text-teal-800">
                          {item.category || "Товар"}
                        </Badge>
                        {item.salePrice && (
                          <Badge className="bg-green-100 text-green-800">
                            ₴{parseFloat(item.salePrice).toLocaleString('uk-UA')}
                          </Badge>
                        )}
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