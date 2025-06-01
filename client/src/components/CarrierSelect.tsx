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
}

export function CarrierSelect({ value, onValueChange, placeholder = "Оберіть перевізника" }: CarrierSelectProps) {
  const { data: carriers = [], isLoading } = useQuery<Carrier[]>({
    queryKey: ["/api/carriers"],
  });

  const activeCarriers = carriers.filter(carrier => carrier.isActive);

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
        {activeCarriers.map((carrier) => (
          <SelectItem key={carrier.id} value={carrier.id.toString()}>
            <div className="flex items-center justify-between w-full">
              <span>{carrier.name}</span>
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
        {activeCarriers.length === 0 && (
          <SelectItem value="" disabled>
            Немає доступних перевізників
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}