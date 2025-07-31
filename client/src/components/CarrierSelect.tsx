import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Carrier {
  id: number;
  name: string;
  serviceType: string | null;
  isActive: boolean;
}

interface CarrierSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  isEditMode?: boolean;
}

export function CarrierSelect({ value, onValueChange, placeholder = "Оберіть перевізника", isEditMode = false }: CarrierSelectProps) {
  // Завантажуємо активних перевізників для створення нових замовлень
  const { data: activeCarriers = [], isLoading: isLoadingActive } = useQuery<Carrier[]>({
    queryKey: ["/api/carriers/active"],
    enabled: !isEditMode, // Не завантажуємо активних в режимі редагування
  });

  // Завантажуємо всіх перевізників для режиму редагування
  const { data: allCarriers = [], isLoading: isLoadingAll } = useQuery<Carrier[]>({
    queryKey: ["/api/carriers"],
    enabled: isEditMode, // Завантажуємо всіх тільки в режимі редагування
  });

  const isLoading = isEditMode ? isLoadingAll : isLoadingActive;
  const carriers = isEditMode ? allCarriers : activeCarriers;

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Завантаження..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {carriers.map((carrier) => (
          <SelectItem key={carrier.id} value={carrier.id.toString()}>
            <div className="flex items-center justify-between w-full">
              <span>
                {carrier.name}
                {isEditMode && !carrier.isActive && (
                  <span className="text-gray-500 text-sm ml-1">(неактивний)</span>
                )}
              </span>
              {carrier.serviceType && (
                <span className="text-xs text-gray-500 ml-2">
                  {carrier.serviceType === "express" && "Експрес"}
                  {carrier.serviceType === "standard" && "Стандартна"}
                  {carrier.serviceType === "freight" && "Вантажна"}
                  {carrier.serviceType === "international" && "Міжнародна"}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
        {carriers.length === 0 && (
          <SelectItem value="no-carriers" disabled>
            Немає доступних перевізників
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}