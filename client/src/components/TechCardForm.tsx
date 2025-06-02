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
  baseTechCardId: z.number().optional(),
  isBaseCard: z.boolean().default(true),
  modificationNote: z.string().optional(),
  estimatedTime: z.number().min(0, "Час виконання не може бути від'ємним"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  status: z.enum(["active", "inactive"]),
  createdBy: z.string().optional(),
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
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
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

  const { data: baseTechCards = [] } = useQuery({
    queryKey: ["/api/tech-cards"],
    select: (data: any[]) => data.filter(card => card.isBaseCard !== false),
  });

  const form = useForm<TechCardFormData>({
    resolver: zodResolver(techCardSchema),
    defaultValues: {
      name: techCard?.name || "",
      description: techCard?.description || "",
      productId: techCard?.productId || 0,
      baseTechCardId: techCard?.baseTechCardId || undefined,
      isBaseCard: techCard?.isBaseCard !== false,
      modificationNote: techCard?.modificationNote || "",
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
        baseTechCardId: techCard.baseTechCardId || undefined,
        isBaseCard: techCard.isBaseCard !== false,
        modificationNote: techCard.modificationNote || "",
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
        
        // Автоматично обчислюємо час виконання як суму часу кроків
        const totalTime = formattedSteps.reduce((sum, step) => sum + (step.duration || 0), 0);
        form.setValue("estimatedTime", totalTime);
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
    
    // Очистити поля модифікації якщо це базова карта
    if (data.isBaseCard) {
      data.baseTechCardId = undefined;
      data.modificationNote = "";
    }
    
    // Якщо немає кроків але є ручно введений час - зберегти його
    if (steps.length === 0 && data.estimatedTime > 0) {
      // Зберігаємо час як є
    } else if (steps.length > 0) {
      // Перерахувати час на основі кроків
      const totalTime = steps.reduce((sum, step) => sum + step.duration, 0);
      data.estimatedTime = totalTime;
    }
    
    const fullData = { ...data, steps, materials };
    console.log("Full data to be sent:", fullData);
    
    if (techCard && techCard.id) {
      updateMutation.mutate(fullData);
    } else {
      createMutation.mutate(fullData);
    }
  };

  const addStep = () => {
    if (newStep.title && newStep.description && newStep.duration > 0) {
      const updatedSteps = [...steps, { ...newStep, stepNumber: steps.length + 1 }];
      setSteps(updatedSteps);
      
      // Автоматично оновлюємо загальний час виконання
      const totalTime = updatedSteps.reduce((sum, step) => sum + step.duration, 0);
      form.setValue("estimatedTime", totalTime);
      
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
    const renumberedSteps = updatedSteps.map((step, i) => ({ ...step, stepNumber: i + 1 }));
    setSteps(renumberedSteps);
    
    // Автоматично оновлюємо загальний час виконання
    const totalTime = renumberedSteps.reduce((sum, step) => sum + step.duration, 0);
    form.setValue("estimatedTime", totalTime);
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
    
    // Автоматично оновлюємо загальний час виконання
    const totalTime = updatedSteps.reduce((sum, step) => sum + step.duration, 0);
    form.setValue("estimatedTime", totalTime);
    
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

  const handleStepDoubleClick = (index: number) => {
    setEditingStepIndex(index);
    const step = steps[index];
    setNewStep({ ...step });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedStepIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedStepIndex === null) return;

    const newSteps = [...steps];
    const draggedStep = newSteps[draggedStepIndex];
    
    newSteps.splice(draggedStepIndex, 1);
    newSteps.splice(dropIndex, 0, draggedStep);
    
    const renumberedSteps = newSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }));
    
    setSteps(renumberedSteps);
    
    // Автоматично оновлюємо загальний час виконання
    const totalTime = renumberedSteps.reduce((sum, step) => sum + step.duration, 0);
    form.setValue("estimatedTime", totalTime);
    
    setDraggedStepIndex(null);
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
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>
            {techCard ? "Редагувати технологічну карту" : "Створити технологічну карту"}
          </DialogTitle>
          <DialogDescription>
            {techCard ? "Внесіть зміни до технологічної карти" : "Створіть нову технологічну карту з кроками виконання та необхідними матеріалами"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
          {/* Основна інформація */}
          <Card>
            <CardHeader>
              <CardTitle>Основна інформація</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Інформація про створювача */}
              {techCard && techCard.createdBy && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Створено користувачем</Label>
                    <p className="text-sm text-gray-800">{techCard.createdBy}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Дата створення</Label>
                    <p className="text-sm text-gray-800">
                      {techCard.createdAt ? new Date(techCard.createdAt).toLocaleDateString('uk-UA') : 'Не вказано'}
                    </p>
                  </div>
                </div>
              )}

              {/* Поля модифікацій */}
              <div className="grid grid-cols-1 gap-4 border-t pt-4 mt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isBaseCard"
                    {...form.register("isBaseCard")}
                    className="rounded"
                  />
                  <Label htmlFor="isBaseCard">Це базова технологічна карта</Label>
                </div>

                {!form.watch("isBaseCard") && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="baseTechCardId">Базова технологічна карта</Label>
                      <Select
                        value={form.watch("baseTechCardId")?.toString() || ""}
                        onValueChange={(value) => form.setValue("baseTechCardId", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Виберіть базову карту" />
                        </SelectTrigger>
                        <SelectContent>
                          {baseTechCards.map((card: any) => (
                            <SelectItem key={card.id} value={card.id.toString()}>
                              {card.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modificationNote">Примітка про модифікацію</Label>
                      <Textarea
                        id="modificationNote"
                        {...form.register("modificationNote")}
                        placeholder="Опишіть відмінності від базової карти..."
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </div>
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
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Назва кроку"
                      value={newStep.title}
                      onChange={(e) => setNewStep({...newStep, title: e.target.value})}
                    />
                    <Input
                      type="number"
                      placeholder="Час"
                      value={newStep.duration || ""}
                      onChange={(e) => setNewStep({...newStep, duration: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <Input
                    placeholder="Опис кроку"
                    value={newStep.description}
                    onChange={(e) => setNewStep({...newStep, description: e.target.value})}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Обладнання (необов'язково)"
                      value={newStep.equipment}
                      onChange={(e) => setNewStep({...newStep, equipment: e.target.value})}
                    />
                    <Button type="button" onClick={addStep} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Додати крок
                    </Button>
                  </div>
                </div>

                {/* Додаткові поля для паралельного виконання */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="canRunParallel"
                        checked={newStep.canRunParallel}
                        onChange={(e) => setNewStep({...newStep, canRunParallel: e.target.checked})}
                      />
                      <label htmlFor="canRunParallel" className="text-sm">Паралельне виконання</label>
                    </div>
                    <Input
                      type="number"
                      placeholder="Порядок виконання"
                      value={newStep.executionOrder || ""}
                      onChange={(e) => setNewStep({...newStep, executionOrder: parseInt(e.target.value) || 1})}
                    />
                    <Input
                      placeholder="Нотатки"
                      value={newStep.notes}
                      onChange={(e) => setNewStep({...newStep, notes: e.target.value})}
                    />
                  </div>
                </div>

                {steps.length > 0 && (
                  <div className="space-y-2 sm:hidden">
                    {/* Мобільний вигляд - картки */}
                    {steps.map((step, index) => {
                      const department = departments.find((d: any) => d.id === step.departmentId);
                      const position = positions.find((p: any) => p.id === step.positionId);
                      const isEditing = editingStepIndex === index;
                      
                      return (
                        <Card key={index} className={isEditing ? "bg-muted/50" : ""}>
                          <CardContent className="p-3">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Крок {step.stepNumber}</span>
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
                                </div>
                                <Input
                                  value={newStep.title}
                                  onChange={(e) => setNewStep({...newStep, title: e.target.value})}
                                  placeholder="Назва кроку"
                                />
                                <Input
                                  value={newStep.description}
                                  onChange={(e) => setNewStep({...newStep, description: e.target.value})}
                                  placeholder="Опис"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    type="number"
                                    value={newStep.duration || ""}
                                    onChange={(e) => setNewStep({...newStep, duration: parseInt(e.target.value) || 0})}
                                    placeholder="Час (хв)"
                                  />
                                  <Input
                                    type="number"
                                    value={newStep.executionOrder || ""}
                                    onChange={(e) => setNewStep({...newStep, executionOrder: parseInt(e.target.value) || 1})}
                                    placeholder="Порядок"
                                  />
                                </div>
                                <div className="grid grid-cols-1 gap-2">
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
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={newStep.canRunParallel}
                                    onChange={(e) => setNewStep({...newStep, canRunParallel: e.target.checked})}
                                  />
                                  <label className="text-sm">Паралельне виконання</label>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="space-y-2 cursor-pointer"
                                onDoubleClick={() => handleStepDoubleClick(index)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                      <span 
                                        className="font-medium text-blue-600 cursor-move select-none"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index)}
                                        title="Перетягніть для зміни порядку"
                                      >
                                        {step.stepNumber}
                                      </span>
                                      <h4 
                                        className="font-medium flex-grow"
                                        onDoubleClick={() => handleStepDoubleClick(index)}
                                        title="Подвійне клацання для редагування"
                                      >
                                        {step.title}
                                      </h4>
                                    </div>
                                    <p 
                                      className="text-sm text-muted-foreground"
                                      onDoubleClick={() => handleStepDoubleClick(index)}
                                      title="Подвійне клацання для редагування"
                                    >
                                      {step.description}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeStep(index)}
                                    title="Видалити крок"
                                    className="ml-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <div>Час: {step.duration}</div>
                                  {department && <div>Дільниця: {department.name}</div>}
                                  {position && <div>Посада: {position.name}</div>}
                                  {step.canRunParallel && <div>Паралельне виконання</div>}
                                  <div>Порядок: {step.executionOrder}</div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
                
                {steps.length > 0 && (
                  <div className="hidden sm:block w-full">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">№</TableHead>
                          <TableHead className="w-1/4">Назва</TableHead>
                          <TableHead className="w-1/3">Опис</TableHead>
                          <TableHead className="w-20">Час</TableHead>
                          <TableHead className="w-24">Дільниця</TableHead>
                          <TableHead className="w-24">Посада</TableHead>
                          <TableHead className="w-16">Пар.</TableHead>
                          <TableHead className="w-20">Пор.</TableHead>
                          <TableHead className="w-16">Дії</TableHead>
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
                          <TableRow 
                            key={index}
                            className="cursor-pointer hover:bg-muted/50"
                            onDoubleClick={() => handleStepDoubleClick(index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                          >
                            <TableCell 
                              className="font-medium text-blue-600 cursor-move select-none"
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              title="Перетягніть для зміни порядку"
                            >
                              {step.stepNumber}
                            </TableCell>
                            <TableCell 
                              className="whitespace-normal break-words p-3"
                              onDoubleClick={() => handleStepDoubleClick(index)}
                              title="Подвійне клацання для редагування"
                            >
                              {step.title}
                            </TableCell>
                            <TableCell 
                              className="whitespace-normal break-words p-3"
                              onDoubleClick={() => handleStepDoubleClick(index)}
                              title="Подвійне клацання для редагування"
                            >
                              {step.description}
                            </TableCell>
                            <TableCell className="text-center">{step.duration}</TableCell>
                            <TableCell>{department?.name || "-"}</TableCell>
                            <TableCell>{position?.name || "-"}</TableCell>
                            <TableCell>{step.canRunParallel ? "✓" : "-"}</TableCell>
                            <TableCell>{step.executionOrder}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeStep(index)}
                                title="Видалити крок"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    </Table>
                  </div>
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