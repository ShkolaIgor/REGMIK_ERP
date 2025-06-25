import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Search, Package, DollarSign, Warehouse, ShoppingCart, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function Scanner() {
  const [scannedCode, setScannedCode] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const { data: components = [] } = useQuery({
    queryKey: ["/api/components"],
  });

  const searchByBarcode = (barcode: string) => {
    setIsSearching(true);
    setScannedCode(barcode);

    // Пошук в товарах
    const productResults = (Array.isArray(products) ? products : products?.data || []).filter((product: any) => 
      product.barcode === barcode || 
      product.sku === barcode ||
      product.name.toLowerCase().includes(barcode.toLowerCase())
    );

    // Пошук в компонентах
    const componentResults = components.filter((component: any) => 
      component.sku === barcode ||
      component.partNumber === barcode ||
      component.name.toLowerCase().includes(barcode.toLowerCase())
    );

    // Об'єднання результатів
    const allResults = [
      ...productResults.map((item: any) => ({ ...item, type: 'product' })),
      ...componentResults.map((item: any) => ({ ...item, type: 'component' }))
    ];

    setSearchResults(allResults);
    setIsSearching(false);

    if (allResults.length === 0) {
      toast({
        title: "Товар не знайдено",
        description: `Не знайдено товарів з кодом: ${barcode}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Знайдено товари",
        description: `Знайдено ${allResults.length} товар(ів) за кодом: ${barcode}`,
      });
    }
  };

  const getInventoryInfo = (productId: number) => {
    const inventoryItems = inventory.filter((inv: any) => inv.productId === productId);
    const totalQuantity = inventoryItems.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
    return { totalQuantity, inventoryItems };
  };

  const handleScanResult = (barcode: string) => {
    searchByBarcode(barcode);
  };

  const handleManualSearch = () => {
    if (scannedCode.trim()) {
      searchByBarcode(scannedCode.trim());
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Сканер штрих-кодів</h1>
          <p className="text-gray-600">Швидкий пошук товарів та компонентів за штрих-кодом</p>
        </div>
      </div>

      {/* Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Сканування камерою
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarcodeScanner
              onScanResult={handleScanResult}
              title="Сканер товарів"
              description="Наведіть камеру на штрих-код товару"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Ручний пошук
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Введіть штрих-код або SKU..."
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
              />
              <Button onClick={handleManualSearch} disabled={!scannedCode.trim()}>
                Пошук
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Введіть штрих-код, SKU або частину назви для пошуку товару
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Результати пошуку ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>SKU/Артикул</TableHead>
                  <TableHead>Штрих-код</TableHead>
                  <TableHead>Ціна</TableHead>
                  <TableHead>На складі</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((item: any) => {
                  const inventoryInfo = item.type === 'product' ? getInventoryInfo(item.id) : null;
                  
                  return (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <Badge variant={item.type === 'product' ? 'default' : 'secondary'}>
                          {item.type === 'product' ? 'Товар' : 'Компонент'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku || item.partNumber || '-'}</TableCell>
                      <TableCell>{item.barcode || '-'}</TableCell>
                      <TableCell>
                        {item.type === 'product' 
                          ? formatCurrency(parseFloat(item.retailPrice)) 
                          : formatCurrency(parseFloat(item.costPrice))
                        }
                      </TableCell>
                      <TableCell>
                        {item.type === 'product' && inventoryInfo ? (
                          <div className="space-y-1">
                            <div className="font-medium">{inventoryInfo.totalQuantity} {item.unit}</div>
                            {inventoryInfo.inventoryItems.length > 1 && (
                              <div className="text-sm text-muted-foreground">
                                На {inventoryInfo.inventoryItems.length} складах
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.type === 'product' && inventoryInfo ? (
                          <Badge variant={inventoryInfo.totalQuantity > 0 ? 'default' : 'destructive'}>
                            {inventoryInfo.totalQuantity > 0 ? 'В наявності' : 'Немає в наявності'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Компонент</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Загальна кількість товарів</p>
                <p className="text-2xl font-semibold text-gray-900">{Array.isArray(products) ? products.length : products?.data?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Загальна кількість компонентів</p>
                <p className="text-2xl font-semibold text-gray-900">{components.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Записів інвентаризації</p>
                <p className="text-2xl font-semibold text-gray-900">{inventory.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Інструкції по використанню</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Сканування камерою:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Натисніть "Почати сканування"</li>
                <li>• Наведіть камеру на штрих-код</li>
                <li>• Тримайте телефон рівно і на відстані 15-20 см</li>
                <li>• Переконайтеся, що штрих-код добре освітлений</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Ручний пошук:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Введіть штрих-код, SKU або артикул</li>
                <li>• Можна вводити частину назви товару</li>
                <li>• Натисніть Enter або кнопку "Пошук"</li>
                <li>• Пошук працює по товарах і компонентах</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}