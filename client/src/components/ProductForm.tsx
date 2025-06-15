import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertProductSchema, type InsertProduct } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateSKU } from "@/lib/utils";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any; // For editing
  isViewMode?: boolean; // For view-only mode
}

export function ProductForm({ isOpen, onClose, product, isViewMode = false }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: product?.name || "",
      sku: product?.sku || "",
      description: product?.description || "",
      barcode: product?.barcode || "",
      categoryId: product?.categoryId || null,
      costPrice: product?.costPrice || "0",
      retailPrice: product?.retailPrice || "0",
      photo: product?.photo || null,
      isActive: product?.isActive !== undefined ? product.isActive : true,

    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      console.log('Resetting form with product:', product);
      form.reset({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        barcode: product.barcode || "",
        categoryId: product.categoryId || null,
        costPrice: product.costPrice || "0",
        retailPrice: product.retailPrice || "0",
        photo: product.photo || null,
        isActive: product.isActive !== undefined ? product.isActive : true,

      });
    } else {
      form.reset({
        name: "",
        sku: "",
        description: "",
        barcode: "",
        categoryId: null,
        costPrice: "0",
        retailPrice: "0",
        photo: null,
        isActive: true,

      });
    }
  }, [product, form]);

  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      return await apiRequest("/api/products", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Успіх",
        description: "Товар успішно додано",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося додати товар",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      return await apiRequest(`/api/products/${product.id}`, { method: "PUT", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Успіх",
        description: "Товар успішно оновлено",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити товар",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    if (product && product.id) {
      updateProductMutation.mutate(data);
    } else {
      createProductMutation.mutate(data);
    }
  };

  const generateAutoSKU = () => {
    const name = form.getValues("name");
    const categoryId = form.getValues("categoryId");
    const category = categories?.find((c: any) => c.id === categoryId);
    
    if (name) {
      const sku = generateSKU(name, category?.name);
      form.setValue("sku", sku);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewMode ? "Переглянути товар" : (product ? "Редагувати товар" : "Додати новий товар")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва товару *</FormLabel>
                    <FormControl>
                      <Input placeholder="Введіть назву товару" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU *</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input placeholder="Унікальний код товару" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateAutoSKU}
                        disabled={!form.getValues("name")}
                      >
                        Генерувати
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Опис</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Детальний опис товару"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категорія *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть категорію" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Собівартість *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="retailPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Роздрібна ціна *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Штрих-код</FormLabel>
                  <FormControl>
                    <Input placeholder="Сканувати або ввести" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Фото товару</FormLabel>
                  <div className="space-y-4">
                    {field.value && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                        <img 
                          src={field.value} 
                          alt="Фото товару" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => field.onChange(null)}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              field.onChange(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        disabled={isViewMode}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Оберіть файл зображення (JPG, PNG, GIF)
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Статус товару</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {field.value ? "Товар активний та доступний для продажу" : "Товар неактивний та прихований від продажу"}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isViewMode}
                    />
                  </FormControl>
                </FormItem>
              )}
            />



            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                {isViewMode ? "Закрити" : "Скасувати"}
              </Button>
              {!isViewMode && (
                <Button
                  type="submit"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  {createProductMutation.isPending || updateProductMutation.isPending
                    ? "Збереження..."
                    : product
                    ? "Оновити товар"
                    : "Зберегти товар"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
