import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";

const componentFormSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  sku: z.string().min(1, "SKU обов'язковий"),
  description: z.string().optional(),
  categoryId: z.number().nullable().optional(),
  supplier: z.string().optional(),
  costPrice: z.string().min(1, "Ціна обов'язкова"),
  unitId: z.number().default(1),
  minStock: z.number().nullable().optional(),
  maxStock: z.number().nullable().optional(),
  isActive: z.boolean().default(true)
});

type ComponentFormData = z.infer<typeof componentFormSchema>;

interface ComponentFormProps {
  defaultValues?: Partial<ComponentFormData>;
  onSubmit: (data: ComponentFormData) => void;
  isLoading?: boolean;
}

export function ComponentForm({ defaultValues, onSubmit, isLoading }: ComponentFormProps) {
  const form = useForm<ComponentFormData>({
    resolver: zodResolver(componentFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      categoryId: null,
      supplier: "",
      costPrice: "",
      unitId: 1,
      minStock: null,
      maxStock: null,
      isActive: true,
      ...defaultValues
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/component-categories"],
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Назва *</FormLabel>
                <FormControl>
                  <Input placeholder="Назва компонента" {...field} />
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
                <FormControl>
                  <Input placeholder="SKU компонента" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Категорія</FormLabel>
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
                    {categories.map((category: any) => (
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
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Постачальник</FormLabel>
                <FormControl>
                  <Input placeholder="Назва постачальника" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ціна за одиницю *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Одиниця виміру *</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">шт</SelectItem>
                    <SelectItem value="2">кг</SelectItem>
                    <SelectItem value="3">л</SelectItem>
                    <SelectItem value="4">м</SelectItem>
                    <SelectItem value="5">м²</SelectItem>
                    <SelectItem value="6">м³</SelectItem>
                    <SelectItem value="7">т</SelectItem>
                    <SelectItem value="8">пач</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Мінімальний запас</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0" 
                    value={field.value?.toString() || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Максимальний запас</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0" 
                    value={field.value?.toString() || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Активний компонент</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
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
                  placeholder="Опис компонента..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Зберігаємо..." : "Зберегти компонент"}
          </Button>
        </div>
      </form>
    </Form>
  );
}