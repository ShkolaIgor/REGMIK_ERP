import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Unit {
  id: number;
  name: string;
  shortName: string;
  type: string;
  description: string | null;
}

interface UnitSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  filterByType?: string;
  disabled?: boolean;
}

export function UnitSelect({ 
  value, 
  onValueChange, 
  placeholder = "Оберіть одиницю виміру",
  filterByType,
  disabled = false
}: UnitSelectProps) {
  const { data: units = [], isLoading } = useQuery({
    queryKey: ["/api/units"],
  });

  // Фільтруємо одиниці за типом, якщо вказано
  const filteredUnits = filterByType 
    ? units.filter((unit: Unit) => unit.type === filterByType)
    : units;

  // Групуємо одиниці за типами для кращого відображення
  const groupedUnits = filteredUnits.reduce((acc: Record<string, Unit[]>, unit: Unit) => {
    if (!acc[unit.type]) {
      acc[unit.type] = [];
    }
    acc[unit.type].push(unit);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    weight: "Вага",
    volume: "Об'єм", 
    length: "Довжина",
    area: "Площа",
    count: "Кількість",
    time: "Час",
    electrical: "Електричні",
    temperature: "Температура"
  };

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
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.keys(groupedUnits).length === 0 ? (
          <SelectItem value="no-units" disabled>
            Одиниці не знайдено
          </SelectItem>
        ) : (
          Object.entries(groupedUnits).map(([type, typeUnits]) => (
            <div key={type}>
              {Object.keys(groupedUnits).length > 1 && (
                <div className="px-2 py-1.5 text-sm font-semibold text-gray-700 bg-gray-50">
                  {typeLabels[type] || type}
                </div>
              )}
              {typeUnits.map((unit) => (
                <SelectItem key={unit.id} value={unit.shortName}>
                  <div className="flex items-center justify-between w-full">
                    <span>{unit.name}</span>
                    <span className="text-sm text-gray-500 ml-2">{unit.shortName}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))
        )}
      </SelectContent>
    </Select>
  );
}