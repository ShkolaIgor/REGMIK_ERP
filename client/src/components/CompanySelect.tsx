import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { Building2 } from "lucide-react";

type Company = {
  id: number;
  name: string;
  fullName: string | null;
  isActive: boolean;
  isDefault: boolean;
};

interface CompanySelectProps {
  form: UseFormReturn<any>;
  name: string;
  label?: string;
  required?: boolean;
  onValueChange?: (value: string) => void;
}

export function CompanySelect({ 
  form, 
  name, 
  label = "Компанія", 
  required = false,
  onValueChange 
}: CompanySelectProps) {
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    select: (data) => data.filter(company => company.isActive)
  });

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <Select 
            onValueChange={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }} 
            value={field.value}
            disabled={isLoading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Завантаження..." : "Оберіть компанію"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  <div className="flex items-center gap-2">
                    {company.name}
                    {company.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-1 rounded">
                        за замовчуванням
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Hook для отримання компанії за замовчуванням
export function useDefaultCompany() {
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"]
  });

  return companies.find(company => company.isDefault && company.isActive);
}