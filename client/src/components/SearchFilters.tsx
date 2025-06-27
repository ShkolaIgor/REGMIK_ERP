import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: {
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
}

export function SearchFilters({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Пошук...",
  filters = []
}: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Search Field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder={searchPlaceholder}
          className="w-80 pl-10"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Dropdowns */}
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">{filter.label}:</label>
          <Select value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={`Всі ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}