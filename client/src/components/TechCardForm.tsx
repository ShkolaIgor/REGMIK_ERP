import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";

const techCardSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  description: z.string().optional(),
  productId: z.number().min(1, "Виберіть продукт"),
  estimatedTime: z.number().min(1, "Час виконання повинен бути більше 0"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  status: z.enum(["active", "inactive"]),
});

const stepSchema = z.object({
  stepNumber: z.number().min(1),
  title: z.string().min(1, "Назва кроку обов'язкова"),
  description: z.string().min(1, "Опис кроку обов'язковий"),
  duration: z.number().min(1, "Тривалість повинна бути більше 0"),
  equipment: z.string().optional(),
  notes: z.string().optional(),
  // Нові поля для паралельного виконання
  departmentId: z.number().optional(),
  positionId: z.number().optional(),
  canRunParallel: z.boolean().default(false),
  prerequisiteSteps: z.array(z.number()).default([]),
  executionOrder: z.number().default(1),
});

const materialSchema = z.object({
  productId: z.number().min(1, "Виберіть продукт"),
  quantity: z.number().min(0.1, "Кількість повинна бути більше 0"),
  unit: z.string().min(1, "Одиниця виміру обов'язкова"),
});

type TechCardFormData = z.infer<typeof techCardSchema>;
type StepFormData = z.infer<typeof stepSchema>;
type MaterialFormData = z.infer<typeof materialSchema>;

interface TechCardFormProps {
  isOpen: boolean;
  onClose: () => void;
  techCard?: any;
}

export function TechCardForm({ isOpen, onClose, techCard }: TechCardFormProps) {
  const [steps, setSteps] = useState<StepFormData[]>(techCard?.steps || []);
  const [materials, setMaterials] = useState<MaterialFormData[]>(techCard?.materials || []);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [newStep, setNewStep] = useState<StepFormData>({
    stepNumber: steps.length + 1,
    title: "",
    description: "",
    duration: 0,
    equipment: "",
    notes: "",
    departmentId: undefined,
    positionId: undefined,
    canRunParallel: false,
    prerequisiteSteps: [],
    executionOrder: 1,
  });
  const [newMaterial, setNewMaterial] = useState<MaterialFormData>({
    productId: 0,
    quantity: 0,
    unit: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["/api/positions"],
  });

  const form = useForm<TechCardFormData>({
    resolver: zodResolver(techCardSchema),
    defaultValues: {
      name: techCard?.name || "",
      description: techCard?.description || "",
      productId: techCard?.productId || 0,
      estimatedTime: techCard?.estimatedTime || 0,
      difficulty: techCard?.difficulty || "medium",
      status: techCard?.status || "active",
    },
  });

  // Оновлюємо форму при зміні techCard
  useEffect(() => {
    if (techCard) {
      form.reset({
        name: techCard.name || "",
        description: techCard.description || "",
        productId: techCard.productId || 0,
        estimatedTime: techCard.estimatedTime || 0,
        difficulty: techCard.difficulty || "medium",
        status: techCard.status || "active",
      });
      
      // Ініціалізуємо кроки з перетворенням полів
      if (techCard.steps && Array.isArray(techCard.steps)) {
        const formattedSteps = techCard.steps.map((step: any) => ({
          stepNumber: step.stepNumber || 1,
          title: step.title || "",
          description: step.description || "",
          duration: step.duration || 0,
          equipment: step.equipment || "",
          notes: step.notes || "",
          departmentId: step.departmentId || step.department_id,
          positionId: step.positionId || step.position_id,
          canRunParallel: step.canRunParallel || step.can_run_parallel || false,
          prerequisiteSteps: step.prerequisiteSteps || (step.prerequisite_steps ? JSON.parse(step.prerequisite_steps) : []),
          executionOrder: step.executionOrder || step.execution_order || 1,
        }));
        setSteps(formattedSteps);
      } else {
        setSteps([]);
      }
      
      // Ініціалізуємо матеріали
      if (techCard.materials && Array.isArray(techCard.materials)) {
        const formattedMaterials = techCard.materials.map((material: any) => ({
          productId: material.productId || 0,
          quantity: parseFloat(material.quantity) || 0,
          unit: material.unit || "",
        }));
        setMaterials(formattedMaterials);
      } else {
        setMaterials([]);
      }
    } else {
      // Скидаємо форму для створення нової технологічної карти
      form.reset({
        name: "",
        description: "",
        productId: 0,
        estimatedTime: 0,
        difficulty: "medium",
        status: "active",
      });
      setSteps([]);
      setMaterials([]);
    }
  }, [techCard, form]);

  const createMutation = useMutation({
    mutationFn: async (data: TechCardFormData & { steps: StepFormData[]; materials: MaterialFormData[] }) => {
      console.log("Creating tech card via API request with data:", data);
      console.log("Making POST request to /api/tech-cards");
      try {
        const result = await apiRequest("/api/tech-cards", { method: "POST", body: data });
        console.log("API response:", result);
        return result;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tech-cards"] });
      toast({
        title: "Технологічну карту створено",
        description: "Карта успішно додана до системи",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити технологічну карту",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TechCardFormData & { steps: StepFormData[]; materials: MaterialFormData[] }) => {
      return await apiRequest(`/api/tech-cards/${techCard.id}`, { method: "PATCH", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tech-cards"] });
      toast({
        title: "Технологічну карту оновлено",
        description: "Зміни успішно збережено",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити технологічну карту",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TechCardFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form validation errors:", form.formState.errors);
    console.log("Steps:", steps);
    console.log("Materials:", materials);
    
    const fullData = { ...data, steps, materials };
    console.log("Full data to be sent:", fullData);
    
    if (techCard) {
      updateMutation.mutate(fullData);
    } else {
      createMutation.mutate(fullData);
    }
  };

  const addStep = () => {
    if (newStep.title && newStep.description && newStep.duration > 0) {
      setSteps([...steps, { ...newStep, stepNumber: steps.length + 1 }]);
      setNewStep({
        stepNumber: steps.length + 2,
        title: "",
        description: "",
        duration: 0,
        equipment: "",
        notes: "",
      });
    }
  };

  const removeStep = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    setSteps(updatedSteps.map((step, i) => ({ ...step, stepNumber: i + 1 })));
  };

  const moveStepUp = (index: number) => {
    if (index > 0) {
      const newSteps = [...steps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      setSteps(newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 })));
    }
  };

  const moveStepDown = (index: number) => {
    if (index < steps.length - 1) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      setSteps(newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 })));
    }
  };

  const editStep = (index: number) => {
    setEditingStepIndex(index);
    setNewStep({ ...steps[index] });
  };

  const saveStep = (index: number, updatedStep: StepFormData) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedStep, stepNumber: index + 1 };
    setSteps(updatedSteps);
    setEditingStepIndex(null);
    setNewStep({
      stepNumber: steps.length + 1,
      title: "",
      description: "",
      duration: 0,
      equipment: "",
      notes: "",
      departmentId: undefined,
      positionId: undefined,
      canRunParallel: false,
      prerequisiteSteps: [],
      executionOrder: 1,
    });
  };

  const cancelEditStep = () => {
    setEditingStepIndex(null);
    setNewStep({
      stepNumber: steps.length + 1,
      title: "",
      description: "",
      duration: 0,
      equipment: "",
      notes: "",
      departmentId: undefined,
      positionId: undefined,
      canRunParallel: false,
      prerequisiteSteps: [],
      executionOrder: 1,
    });
  };

  const addMaterial = () => {
    if (newMaterial.productId > 0 && newMaterial.quantity > 0 && newMaterial.unit) {
      setMaterials([...materials, newMaterial]);
      setNewMaterial({
        productId: 0,
        quantity: 0,
        unit: "",
      });
    }
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const getProductName = (productId: number) => {
    const product = products.find((p: any) => p.id === productId);
    return product?.name || "Невідомий продукт";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {techCard ? "Редагувати технологічну карту" : "Створити технологічну карту"}
          </DialogTitle>
          <DialogDescription>
            {techCard ? "Внесіть зміни до технологічної карти" : "Створіть нову технологічну карту з кроками виконання та необхідними матеріалами"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Основна інформація */}
          <Card>
            <CardHeader>
              <CardTitle>Основна інформація</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Назва карти</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Технологічна карта виробництва..."
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productId">Продукт</Label>
                  <Select
                    value={form.watch("productId")?.toString() || ""}
                    onValueChange={(value) => form.setValue("productId", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Виберіть продукт" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Час виконання (хв)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    {...form.register("estimatedTime", { valueAsNumber: true })}
                    placeholder="60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Складність</Label>
                  <Select
                    value={form.watch("difficulty")}
                    onValueChange={(value) => form.setValue("difficulty", value as "easy" | "medium" | "hard")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Легка</SelectItem>
                      <SelectItem value="medium">Середня</SelectItem>
                      <SelectItem value="hard">Складна</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Детальний опис технологічного процесу..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Матеріали */}
          <Card>
            <CardHeader>
              <CardTitle>Матеріали</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <Select
                    value={newMaterial.productId.toString()}
                    onValueChange={(value) => setNewMaterial({...newMaterial, productId: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Продукт" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Кількість"
                    value={newMaterial.quantity || ""}
                    onChange={(e) => setNewMaterial({...newMaterial, quantity: parseFloat(e.target.value) || 0})}
                  />
                  <Input
                    placeholder="Одиниця"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
                  />
                  <Button type="button" onClick={addMaterial}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {materials.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Продукт</TableHead>
                        <TableHead>Кількість</TableHead>
                        <TableHead>Одиниця</TableHead>
                        <TableHead>Дії</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material, index) => (
                        <TableRow key={index}>
                          <TableCell>{getProductName(material.productId)}</TableCell>
                          <TableCell>{material.quantity}</TableCell>
                          <TableCell>{material.unit}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeMaterial(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Кроки виконання */}
          <Card>
            <CardHeader>
              <CardTitle>Кроки виконання</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Основні поля кроку */}
                <div className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-3"
                    placeholder="Назва кроку"
                    value={newStep.title}
                    onChange={(e) => setNewStep({...newStep, title: e.target.value})}
                  />
                  <Input
                    className="col-span-4"
                    placeholder="Опис"
                    value={newStep.description}
                    onChange={(e) => setNewStep({...newStep, description: e.target.value})}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Хв"
                    value={newStep.duration || ""}
                    onChange={(e) => setNewStep({...newStep, duration: parseInt(e.target.value) || 0})}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Обладнання"
                    value={newStep.equipment}
                    onChange={(e) => setNewStep({...newStep, equipment: e.target.value})}
                  />
                  <Button type="button" onClick={addStep}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Додаткові поля для паралельного виконання */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3">
                    <select
                      className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
                      value={newStep.departmentId || ""}
                      onChange={(e) => setNewStep({...newStep, departmentId: e.target.value ? parseInt(e.target.value) : undefined})}
                    >
                      <option value="">Дільниця (опційно)</option>
                      {departments.map((dept: any) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <select
                      className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
                      value={newStep.positionId || ""}
                      onChange={(e) => setNewStep({...newStep, positionId: e.target.value ? parseInt(e.target.value) : undefined})}
                    >
                      <option value="">Посада (опційно)</option>
                      {positions.map((pos: any) => (
                        <option key={pos.id} value={pos.id}>{pos.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="canRunParallel"
                      checked={newStep.canRunParallel}
                      onChange={(e) => setNewStep({...newStep, canRunParallel: e.target.checked})}
                    />
                    <label htmlFor="canRunParallel" className="text-sm">Паралельно</label>
                  </div>
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Порядок"
                    value={newStep.executionOrder || ""}
                    onChange={(e) => setNewStep({...newStep, executionOrder: parseInt(e.target.value) || 1})}
                  />
                  <Input
                    className="col-span-2"
                    placeholder="Нотатки"
                    value={newStep.notes}
                    onChange={(e) => setNewStep({...newStep, notes: e.target.value})}
                  />
                </div>

                {steps.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>№</TableHead>
                        <TableHead>Назва</TableHead>
                        <TableHead>Опис</TableHead>
                        <TableHead>Час</TableHead>
                        <TableHead>Дільниця</TableHead>
                        <TableHead>Посада</TableHead>
                        <TableHead>Паралельно</TableHead>
                        <TableHead>Порядок</TableHead>
                        <TableHead>Дії</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {steps.map((step, index) => {
                        const department = departments.find((d: any) => d.id === step.departmentId);
                        const position = positions.find((p: any) => p.id === step.positionId);
                        const isEditing = editingStepIndex === index;
                        
                        if (isEditing) {
                          return (
                            <TableRow key={index} className="bg-muted/50">
                              <TableCell>{step.stepNumber}</TableCell>
                              <TableCell>
                                <Input
                                  value={newStep.title}
                                  onChange={(e) => setNewStep({...newStep, title: e.target.value})}
                                  placeholder="Назва кроку"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={newStep.description}
                                  onChange={(e) => setNewStep({...newStep, description: e.target.value})}
                                  placeholder="Опис"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={newStep.duration || ""}
                                  onChange={(e) => setNewStep({...newStep, duration: parseInt(e.target.value) || 0})}
                                  placeholder="Час"
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <select
                                  className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
                                  value={newStep.departmentId || ""}
                                  onChange={(e) => setNewStep({...newStep, departmentId: e.target.value ? parseInt(e.target.value) : undefined})}
                                >
                                  <option value="">Дільниця</option>
                                  {departments.map((dept: any) => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell>
                                <select
                                  className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
                                  value={newStep.positionId || ""}
                                  onChange={(e) => setNewStep({...newStep, positionId: e.target.value ? parseInt(e.target.value) : undefined})}
                                >
                                  <option value="">Посада</option>
                                  {positions.map((pos: any) => (
                                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={newStep.canRunParallel}
                                  onChange={(e) => setNewStep({...newStep, canRunParallel: e.target.checked})}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={newStep.executionOrder || ""}
                                  onChange={(e) => setNewStep({...newStep, executionOrder: parseInt(e.target.value) || 1})}
                                  className="w-16"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => saveStep(index, newStep)}
                                    title="Зберегти"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEditStep}
                                    title="Скасувати"
                                  >
                                    ✕
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{step.stepNumber}</TableCell>
                            <TableCell>{step.title}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{step.description}</TableCell>
                            <TableCell>{step.duration} хв</TableCell>
                            <TableCell>{department?.name || "-"}</TableCell>
                            <TableCell>{position?.name || "-"}</TableCell>
                            <TableCell>{step.canRunParallel ? "✓" : "-"}</TableCell>
                            <TableCell>{step.executionOrder}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editStep(index)}
                                  title="Редагувати крок"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveStepUp(index)}
                                  disabled={index === 0}
                                  title="Перемістити вгору"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveStepDown(index)}
                                  disabled={index === steps.length - 1}
                                  title="Перемістити вниз"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeStep(index)}
                                  title="Видалити крок"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Скасувати
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {techCard ? "Оновити" : "Створити"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}