import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings, Hash, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SerialNumberSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localGlobalSettings, setLocalGlobalSettings] = useState<any>({
    useCrossNumbering: false,
    globalTemplate: "",
    globalPrefix: "",
    nextSerialNumber: 1,
    resetCounterPeriod: "never"
  });

  // Fetch global settings
  const { data: globalSettings, isLoading: globalLoading } = useQuery({
    queryKey: ['/api/serial-number-settings'],
  });

  // Initialize local state when global settings are loaded
  useEffect(() => {
    if (globalSettings) {
      setLocalGlobalSettings({
        useCrossNumbering: globalSettings.useCrossNumbering || false,
        globalTemplate: globalSettings.globalTemplate || "",
        globalPrefix: globalSettings.globalPrefix || "",
        nextSerialNumber: globalSettings.nextSerialNumber || 1,
        resetCounterPeriod: globalSettings.resetCounterPeriod || "never"
      });
    }
  }, [globalSettings]);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Update global settings mutation
  const updateGlobalMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/serial-number-settings', {
        method: 'PATCH',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/serial-number-settings'] });
      toast({
        title: "Успіх",
        description: "Глобальні налаштування оновлено",
      });
    },
    onError: (error) => {
      console.error('Error updating global settings:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити глобальні налаштування",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/categories/${id}`, {
        method: 'PATCH',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити категорію",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-8">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Глобальні налаштування серійних номерів
          </CardTitle>
          <CardDescription>
            Налаштуйте загальні параметри для генерації серійних номерів
          </CardDescription>
        </CardHeader>
        <CardContent>
          {globalLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Завантаження налаштувань...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Enable Cross Numbering */}
              <div className="flex items-center justify-between">
                <Label htmlFor="use-cross-numbering" className="text-base">
                  Використовувати сквозну нумерацію
                </Label>
                <Switch
                  id="use-cross-numbering"
                  checked={localGlobalSettings?.useCrossNumbering || false}
                  onCheckedChange={async (checked) => {
                    setLocalGlobalSettings({...localGlobalSettings, useCrossNumbering: checked});
                    
                    // If cross numbering is disabled, automatically disable global numbering for all categories
                    if (!checked && categories) {
                      for (const category of categories) {
                        if (category.useGlobalNumbering) {
                          await updateCategoryMutation.mutateAsync({
                            id: category.id,
                            data: { useGlobalNumbering: false }
                          });
                        }
                      }
                    }
                  }}
                  disabled={updateGlobalMutation.isPending}
                />
              </div>

              {localGlobalSettings?.useCrossNumbering && (
                <>
                  {/* Global Template */}
                  <div className="space-y-2">
                    <Label htmlFor="global-template">Глобальний шаблон серійного номера</Label>
                    <Input
                      id="global-template"
                      value={localGlobalSettings?.globalTemplate || ''}
                      placeholder="{prefix}-{year}-{counter:6}"
                      onChange={(e) => {
                        setLocalGlobalSettings({
                          ...localGlobalSettings,
                          globalTemplate: e.target.value
                        });
                      }}
                    />
                    <p className="text-sm text-gray-500">
                      Використовуйте: {"{prefix}"} - префікс, {"{year}"} - рік, {"{month}"} - місяць, {"{counter:N}"} - лічильник з N цифр
                    </p>
                  </div>

                  {/* Global Prefix */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="global-prefix">Глобальний префікс</Label>
                      <Input
                        id="global-prefix"
                        value={localGlobalSettings?.globalPrefix || ''}
                        placeholder="SN"
                        onChange={(e) => {
                          setLocalGlobalSettings({
                            ...localGlobalSettings,
                            globalPrefix: e.target.value
                          });
                        }}
                      />
                    </div>
                    
                  </div>

                  {/* Counter Display and Next Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-counter">Поточний лічильник</Label>
                      <Input
                        id="current-counter"
                        type="number"
                        value={localGlobalSettings?.currentGlobalCounter || 0}
                        disabled
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                      <p className="text-xs text-gray-500">Останній використаний номер</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="next-serial">Наступний серійний номер</Label>
                      <Input
                        id="next-serial"
                        type="number"
                        value={localGlobalSettings?.nextSerialNumber || ((localGlobalSettings?.currentGlobalCounter || 0) + 1)}
                        onChange={(e) => {
                          setLocalGlobalSettings({
                            ...localGlobalSettings, 
                            nextSerialNumber: parseInt(e.target.value) || ((localGlobalSettings?.currentGlobalCounter || 0) + 1)
                          });
                        }}
                      />
                      <p className="text-xs text-gray-500">Можна змінити наступний номер</p>
                    </div>
                  </div>

                  {/* Reset Counter Period */}
                  <div className="space-y-2">
                    <Label htmlFor="reset-counter-period">Період скидання лічильника</Label>
                    <Select
                      value={localGlobalSettings?.resetCounterPeriod || 'never'}
                      onValueChange={(value) => {
                        setLocalGlobalSettings({
                          ...localGlobalSettings,
                          resetCounterPeriod: value
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Виберіть період" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Ніколи</SelectItem>
                        <SelectItem value="yearly">Щорічно</SelectItem>
                        <SelectItem value="monthly">Щомісячно</SelectItem>
                        <SelectItem value="daily">Щоденно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="flex justify-start pt-4">
                <Button 
                  size="sm" 
                  disabled={updateGlobalMutation.isPending}
                  onClick={() => {
                    if (localGlobalSettings) {
                      updateGlobalMutation.mutate(localGlobalSettings);
                    }
                  }}
                >
                  {updateGlobalMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Зберегти глобальні налаштування
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Налаштування за категоріями
          </CardTitle>
          <CardDescription>
            Налаштуйте індивідуальні шаблони серійних номерів для кожної категорії товарів
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Завантаження категорій...</span>
            </div>
          ) : categories && Array.isArray(categories) && categories.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {categories.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((category: any) => (
                  <div key={category.id} className="p-4 border rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800">
                    <div className="space-y-2">
                      <h4 className="font-medium text-base">{category.name}</h4>
                      {category.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`category-${category.id}-use-serial`} className="text-sm">
                          Використовувати серійні номери
                        </Label>
                        <Switch
                          id={`category-${category.id}-use-serial`}
                          checked={category.useSerialNumbers === true}
                          onCheckedChange={(checked) => {
                            updateCategoryMutation.mutate({
                              id: category.id,
                              data: { useSerialNumbers: checked }
                            });
                          }}
                          disabled={updateCategoryMutation.isPending}
                        />
                      </div>
                      
                      {category.useSerialNumbers && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <Label htmlFor={`category-${category.id}-use-global`} className="text-sm">
                                Використовувати глобальну нумерацію
                              </Label>
                              {!localGlobalSettings?.useCrossNumbering && (
                                <span className="text-xs text-gray-400">
                                  Недоступно - увімкніть сквозну нумерацію
                                </span>
                              )}
                            </div>
                            <Switch
                              id={`category-${category.id}-use-global`}
                              checked={category.useGlobalNumbering === true && localGlobalSettings?.useCrossNumbering}
                              onCheckedChange={(checked) => {
                                if (localGlobalSettings?.useCrossNumbering) {
                                  updateCategoryMutation.mutate({
                                    id: category.id,
                                    data: { useGlobalNumbering: checked }
                                  });
                                }
                              }}
                              disabled={updateCategoryMutation.isPending || !localGlobalSettings?.useCrossNumbering}
                            />
                          </div>

                          {!category.useGlobalNumbering && (
                            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="space-y-2">
                                <Label htmlFor={`category-${category.id}-template`} className="text-xs">
                                  Шаблон серійного номера
                                </Label>
                                <Input
                                  id={`category-${category.id}-template`}
                                  defaultValue={category.serialNumberTemplate || ''}
                                  placeholder="{prefix}-{year}-{counter:4}"
                                  className="h-8 text-sm"
                                  onBlur={(e) => {
                                    updateCategoryMutation.mutate({
                                      id: category.id,
                                      data: { serialNumberTemplate: e.target.value }
                                    });
                                  }}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                  <Label htmlFor={`category-${category.id}-prefix`} className="text-xs">
                                    Префікс
                                  </Label>
                                  <Input
                                    id={`category-${category.id}-prefix`}
                                    defaultValue={category.serialNumberPrefix || ''}
                                    placeholder="CAT"
                                    className="h-8 text-sm"
                                    onBlur={(e) => {
                                      updateCategoryMutation.mutate({
                                        id: category.id,
                                        data: { serialNumberPrefix: e.target.value }
                                      });
                                    }}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor={`category-${category.id}-start`} className="text-xs">
                                    Стартовий номер
                                  </Label>
                                  <Input
                                    id={`category-${category.id}-start`}
                                    type="number"
                                    defaultValue={category.serialNumberStartNumber || 1}
                                    placeholder="1"
                                    className="h-8 text-sm"
                                    onBlur={(e) => {
                                      updateCategoryMutation.mutate({
                                        id: category.id,
                                        data: { serialNumberStartNumber: parseInt(e.target.value) || 1 }
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-start">
                <Button 
                  size="sm" 
                  disabled={updateCategoryMutation.isPending}
                  onClick={() => {
                    toast({
                      title: "Успіх",
                      description: "Налаштування категорій збережено",
                    });
                  }}
                >
                  {updateCategoryMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Зберегти налаштування категорій
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Категорії не знайдено
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}