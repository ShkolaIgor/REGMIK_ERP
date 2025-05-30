import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertCategorySchema, type InsertCategory, type Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryForm({ open, onOpenChange, category }: CategoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      return await apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Успіх",
        description: "Категорію успішно створено",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити категорію",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      return await apiRequest("PATCH", `/api/categories/${category!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Успіх",
        description: "Категорію успішно оновлено",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити категорію",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCategory) => {
    if (category) {
      updateCategoryMutation.mutate(data);
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Редагувати категорію" : "Створити нову категорію"}
          </DialogTitle>
          <DialogDescription>
            {category 
              ? "Оновіть інформацію про категорію товарів" 
              : "Додайте нову категорію для організації товарів"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Назва категорії *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Наприклад: Електроніка"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Опис</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Опишіть категорію товарів..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Скасувати
              </Button>
              <Button 
                type="submit" 
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending
                  ? "Збереження..."
                  : category
                  ? "Оновити"
                  : "Створити"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}