import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  Palette,
  Type,
  Bold,
  Italic,
  Star
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// StarRating component for displaying rating
const StarRating = ({ rating, maxStars = 5 }: { rating: number; maxStars?: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }, (_, i) => {
        if (i < fullStars) {
          return <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />;
        } else if (i === fullStars && hasHalfStar) {
          return (
            <div key={i} className="relative">
              <Star className="h-4 w-4 text-gray-300" />
              <Star 
                className="h-4 w-4 fill-yellow-400 text-yellow-400 absolute top-0 left-0" 
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            </div>
          );
        } else {
          return <Star key={i} className="h-4 w-4 text-gray-300" />;
        }
      })}
      <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
    </div>
  );
};

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: number;
  minWidth?: number;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'rating' | 'custom';
}

export interface ColumnSettings {
  visible: boolean;
  filterable: boolean;
  textColor: string;
  backgroundColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
}

export interface DataTableSettings {
  pageSize: number;
  columnOrder: string[];
  columnWidths: Record<string, number>;
  columnSettings: Record<string, ColumnSettings>;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  viewMode: 'table' | 'cards';
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  rowBackgroundColor: string;
  rowTextColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  headerFontSize: number;
  headerFontWeight: 'normal' | 'bold';
  headerFontStyle: 'normal' | 'italic';
  showVerticalLines: boolean;
  enableRowHover: boolean;
}

interface DataTableProps {
  data: any[];
  columns: DataTableColumn[];
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: any) => void;
  actions?: (row: any) => React.ReactNode;
  title?: string;
  storageKey: string; // Unique key for saving settings
  cardTemplate?: (item: any) => React.ReactNode;
  expandableContent?: (item: any) => React.ReactNode;
  expandedItems?: Set<string | number>;
  onToggleExpand?: (itemId: string | number) => void;
  // Server pagination props
  searchTerm?: string;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  cardTemplate?: (item: any) => React.ReactNode;
  expandableContent?: (item: any) => React.ReactNode;
  expandedItems?: Set<string | number>;
  onToggleExpand?: (itemId: string | number) => void;
  // Server pagination props
  searchTerm?: string;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

const defaultColumnSettings: ColumnSettings = {
  visible: true,
  filterable: true,
  textColor: '#000000',
  backgroundColor: '#ffffff',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal'
};

const defaultSettings: DataTableSettings = {
  pageSize: 25,
  columnOrder: [],
  columnWidths: {},
  columnSettings: {},
  sortField: '',
  sortDirection: 'asc',
  viewMode: 'table',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  rowBackgroundColor: '#ffffff',
  rowTextColor: '#000000',
  headerBackgroundColor: '#f8fafc',
  headerTextColor: '#374151',
  headerFontSize: 14,
  headerFontWeight: 'bold',
  headerFontStyle: 'normal',
  showVerticalLines: true,
  enableRowHover: true
};

export function DataTable({
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = true,
  onSearch,
  onFilter,
  onSort,
  onRowClick,
  actions,
  title,
  storageKey,
  cardTemplate,
  expandableContent,
  expandedItems = new Set(),
  onToggleExpand
}: DataTableProps) {
  // Load settings from localStorage
  const [settings, setSettings] = useState<DataTableSettings>(() => {
    try {
      const saved = localStorage.getItem(`datatable-${storageKey}`);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(`datatable-${storageKey}`, JSON.stringify(settings));
  }, [settings, storageKey]);

  // Initialize column order and settings
  useEffect(() => {
    if (settings.columnOrder.length === 0) {
      setSettings(prev => ({
        ...prev,
        columnOrder: columns.map(col => col.key),
        columnSettings: columns.reduce((acc, col) => {
          acc[col.key] = { ...defaultColumnSettings };
          return acc;
        }, {} as Record<string, ColumnSettings>)
      }));
    }
  }, [columns, settings.columnOrder.length]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery && searchable) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item =>
          String(item[key]).toLowerCase().includes(String(value).toLowerCase())
        );
      }
    });

    return result;
  }, [data, searchQuery, filters, searchable]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!settings.sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[settings.sortField];
      const bVal = b[settings.sortField];
      
      if (aVal < bVal) return settings.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return settings.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, settings.sortField, settings.sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * settings.pageSize;
    return sortedData.slice(start, start + settings.pageSize);
  }, [sortedData, currentPage, settings.pageSize]);

  const totalPages = Math.ceil(sortedData.length / settings.pageSize);

  const handleSort = (columnKey: string) => {
    const newDirection = settings.sortField === columnKey && settings.sortDirection === 'asc' ? 'desc' : 'asc';
    setSettings(prev => ({
      ...prev,
      sortField: columnKey,
      sortDirection: newDirection
    }));
    onSort?.(columnKey, newDirection);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    onSearch?.(query);
  };

  const handleFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value === 'all' ? '' : value };
    setFilters(newFilters);
    setCurrentPage(1);
    onFilter?.(newFilters);
  };

  // Get visible columns based on settings
  const visibleColumns = useMemo(() => {
    return settings.columnOrder
      .map(key => columns.find(col => col.key === key))
      .filter((col): col is DataTableColumn => !!col && (settings.columnSettings[col.key]?.visible !== false));
  }, [columns, settings.columnOrder, settings.columnSettings]);

  const getSortIcon = (columnKey: string) => {
    if (settings.sortField !== columnKey) return <ArrowUpDown className="h-4 w-4" />;
    return settings.sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnKey) return;

    const newOrder = [...settings.columnOrder];
    const dragIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumnKey);

    newOrder.splice(dragIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);

    setSettings(prev => ({ ...prev, columnOrder: newOrder }));
    setDraggedColumn(null);
  };

  const renderTableView = () => (
    <div className={cn(
      "overflow-auto rounded-lg",
      settings.showVerticalLines ? "border" : ""
    )}>
      <table className="w-full">
        <thead
          className="border-b"
          style={{
            backgroundColor: settings.headerBackgroundColor,
            color: settings.headerTextColor,
            fontSize: `${settings.headerFontSize}px`,
            fontWeight: settings.headerFontWeight
          }}
        >
          <tr>
            {expandableContent && <th className="px-4 py-3 w-8"></th>}
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left cursor-pointer hover:bg-gray-50 resize-x",
                  settings.showVerticalLines ? "border-r last:border-r-0" : ""
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, column.key)}
                onDrop={(e) => handleDrop(e, column.key)}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => handleSort(column.key)}
                style={{
                  width: settings.columnWidths[column.key] || column.width,
                  minWidth: column.minWidth || 100
                }}
              >
                <div className="flex items-center gap-2">
                  <span>{column.label}</span>
                  {settings.sortField === column.key && (
                    settings.sortDirection === 'asc' ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </th>
            ))}
            {actions && (
              <th 
                className={cn(
                  "px-4 py-3 w-20",
                  settings.showVerticalLines ? "border-r-0" : ""
                )}
              >
                Дії
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={visibleColumns.length + (actions ? 1 : 0) + (expandableContent ? 1 : 0)} className="px-4 py-8 text-center">
                Завантаження...
              </td>
            </tr>
          ) : paginatedData.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length + (actions ? 1 : 0) + (expandableContent ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                Дані не знайдено
              </td>
            </tr>
          ) : (
            paginatedData.map((row, index) => {
              const itemId = row.id || index;
              const isExpanded = expandedItems.has(itemId);
              
              return (
                <React.Fragment key={itemId}>
                  <tr
                    className={cn(
                      "border-b transition-all duration-300 ease-in-out",
                      (onRowClick || expandableContent) && "cursor-pointer",
                      settings.enableRowHover && "hover:shadow-lg hover:bg-blue-50/50 hover:scale-[1.005] hover:border-blue-200"
                    )}
                    style={{
                      backgroundColor: settings.rowBackgroundColor,
                      color: settings.rowTextColor,
                      fontSize: `${settings.fontSize}px`,
                      fontWeight: settings.fontWeight,
                      fontStyle: settings.fontStyle
                    }}
                    onClick={() => {
                      if (expandableContent) {
                        onToggleExpand?.(itemId);
                      } else {
                        onRowClick?.(row);
                      }
                    }}
                  >
                    {expandableContent && (
                      <td className="px-4 py-3 w-8">
                        <ChevronRight 
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                      </td>
                    )}
                    {visibleColumns.map((column) => {
                  const columnSettings = settings.columnSettings[column.key] || defaultColumnSettings;
                  return (
                    <td 
                      key={column.key} 
                      className={cn(
                        "px-4 py-3",
                        settings.showVerticalLines ? "border-r last:border-r-0" : ""
                      )}
                      style={{
                        backgroundColor: columnSettings.backgroundColor,
                        color: columnSettings.textColor,
                        fontSize: `${columnSettings.fontSize}px`,
                        fontWeight: columnSettings.fontWeight,
                        fontStyle: columnSettings.fontStyle,
                        width: settings.columnWidths[column.key] || column.width,
                        minWidth: column.minWidth || 100
                      }}
                    >
                      {column.render ? 
                        column.render(row[column.key], row) : 
                        column.type === 'badge' ? 
                          <Badge variant="outline">{row[column.key]}</Badge> :
                        column.type === 'rating' ?
                          <StarRating rating={parseFloat(row[column.key]) || 0} /> :
                          String(row[column.key] || '')
                      }
                    </td>
                  );
                    })}
                    {actions && (
                      <td 
                        className={cn(
                          "px-4 py-3",
                          settings.showVerticalLines ? "border-r-0" : ""
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                  {expandableContent && isExpanded && (
                    <tr>
                      <td 
                        colSpan={visibleColumns.length + (actions ? 1 : 0) + (expandableContent ? 1 : 0)} 
                        className="px-4 py-4 bg-gray-50 border-b"
                      >
                        {expandableContent(row)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {loading ? (
        <div className="col-span-full text-center py-8">Завантаження...</div>
      ) : paginatedData.length === 0 ? (
        <div className="col-span-full text-center py-8 text-gray-500">Дані не знайдено</div>
      ) : (
        paginatedData.map((row, index) => (
          <Card 
            key={index} 
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              onRowClick && "cursor-pointer"
            )}
            style={{
              backgroundColor: settings.rowBackgroundColor,
              color: settings.rowTextColor,
              fontSize: `${settings.fontSize}px`,
              fontWeight: settings.fontWeight,
              fontStyle: settings.fontStyle
            }}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-4">
              {cardTemplate ? cardTemplate(row) : (
                <div className="space-y-2">
                  {visibleColumns.slice(0, 5).map((column) => {
                    const columnSettings = settings.columnSettings[column.key] || defaultColumnSettings;
                    if (!columnSettings.visible) return null;
                    
                    return (
                      <div key={column.key} className="flex justify-between items-center">
                        <span className="font-medium text-sm">{column.label}:</span>
                        <span className="text-sm">
                          {column.render ? 
                            column.render(row[column.key], row) : 
                            column.type === 'rating' ?
                              <StarRating rating={parseFloat(row[column.key]) || 0} /> :
                            column.type === 'badge' ?
                              <Badge variant="outline">{row[column.key]}</Badge> :
                              String(row[column.key] || '')
                          }
                        </span>
                      </div>
                    );
                  })}
                  {actions && !cardTemplate && (
                    <div className="pt-2 border-t flex justify-end">
                      <div className="flex gap-1">
                        {actions(row)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {title && <h2 className="text-2xl font-bold">{title}</h2>}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-lg p-1">
            <Button
              variant={settings.viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, viewMode: 'table' }))}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={settings.viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSettings(prev => ({ ...prev, viewMode: 'cards' }))}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>

          {/* Settings */}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Налаштування таблиці</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Column Settings */}
                <div>
                  <Label className="text-base font-semibold">Налаштування стовпців</Label>
                  <div className="space-y-4 mt-4">
                    {columns.map((column) => {
                      const columnSettings = settings.columnSettings[column.key] || defaultColumnSettings;
                      return (
                        <div key={column.key} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">{column.label}</Label>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={columnSettings.visible}
                                  onCheckedChange={(checked) =>
                                    setSettings(prev => ({
                                      ...prev,
                                      columnSettings: {
                                        ...prev.columnSettings,
                                        [column.key]: {
                                          ...columnSettings,
                                          visible: checked as boolean
                                        }
                                      }
                                    }))
                                  }
                                />
                                <Label className="text-sm">Відображати</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={columnSettings.filterable}
                                  onCheckedChange={(checked) =>
                                    setSettings(prev => ({
                                      ...prev,
                                      columnSettings: {
                                        ...prev.columnSettings,
                                        [column.key]: {
                                          ...columnSettings,
                                          filterable: checked as boolean
                                        }
                                      }
                                    }))
                                  }
                                />
                                <Label className="text-sm">Фільтрувати</Label>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm">Колір тексту</Label>
                              <Input
                                type="color"
                                value={columnSettings.textColor}
                                onChange={(e) =>
                                  setSettings(prev => ({
                                    ...prev,
                                    columnSettings: {
                                      ...prev.columnSettings,
                                      [column.key]: {
                                        ...columnSettings,
                                        textColor: e.target.value
                                      }
                                    }
                                  }))
                                }
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Колір фону</Label>
                              <Input
                                type="color"
                                value={columnSettings.backgroundColor}
                                onChange={(e) =>
                                  setSettings(prev => ({
                                    ...prev,
                                    columnSettings: {
                                      ...prev.columnSettings,
                                      [column.key]: {
                                        ...columnSettings,
                                        backgroundColor: e.target.value
                                      }
                                    }
                                  }))
                                }
                                className="h-8"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label className="text-sm">Розмір шрифту</Label>
                              <Select 
                                value={columnSettings.fontSize.toString()} 
                                onValueChange={(value) =>
                                  setSettings(prev => ({
                                    ...prev,
                                    columnSettings: {
                                      ...prev.columnSettings,
                                      [column.key]: {
                                        ...columnSettings,
                                        fontSize: parseInt(value)
                                      }
                                    }
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10">10px</SelectItem>
                                  <SelectItem value="12">12px</SelectItem>
                                  <SelectItem value="14">14px</SelectItem>
                                  <SelectItem value="16">16px</SelectItem>
                                  <SelectItem value="18">18px</SelectItem>
                                  <SelectItem value="20">20px</SelectItem>
                                  <SelectItem value="24">24px</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Жирність</Label>
                              <Select 
                                value={columnSettings.fontWeight} 
                                onValueChange={(value: 'normal' | 'bold') =>
                                  setSettings(prev => ({
                                    ...prev,
                                    columnSettings: {
                                      ...prev.columnSettings,
                                      [column.key]: {
                                        ...columnSettings,
                                        fontWeight: value
                                      }
                                    }
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">Звичайний</SelectItem>
                                  <SelectItem value="bold">Жирний</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Курсив</Label>
                              <Select 
                                value={columnSettings.fontStyle} 
                                onValueChange={(value: 'normal' | 'italic') =>
                                  setSettings(prev => ({
                                    ...prev,
                                    columnSettings: {
                                      ...prev.columnSettings,
                                      [column.key]: {
                                        ...columnSettings,
                                        fontStyle: value
                                      }
                                    }
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">Звичайний</SelectItem>
                                  <SelectItem value="italic">Курсив</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* General Font Settings */}
                <div>
                  <Label className="text-base font-semibold">Загальні налаштування шрифту</Label>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <Label className="text-sm">Розмір шрифту (рядки)</Label>
                      <Slider
                        value={[settings.fontSize]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, fontSize: value }))}
                        min={10}
                        max={24}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-xs text-center mt-1">{settings.fontSize}px</div>
                    </div>
                    <div>
                      <Label className="text-sm">Жирність</Label>
                      <Select value={settings.fontWeight} onValueChange={(value: 'normal' | 'bold') => setSettings(prev => ({ ...prev, fontWeight: value }))}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Звичайний</SelectItem>
                          <SelectItem value="bold">Жирний</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Стиль</Label>
                      <Select value={settings.fontStyle} onValueChange={(value: 'normal' | 'italic') => setSettings(prev => ({ ...prev, fontStyle: value }))}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Звичайний</SelectItem>
                          <SelectItem value="italic">Курсив</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-sm">Колір фону рядків</Label>
                      <Input
                        type="color"
                        value={settings.rowBackgroundColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, rowBackgroundColor: e.target.value }))}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Колір тексту рядків</Label>
                      <Input
                        type="color"
                        value={settings.rowTextColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, rowTextColor: e.target.value }))}
                        className="mt-1 h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Header Styling */}
                <div>
                  <Label className="text-base font-semibold">Оформлення заголовків</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label className="text-sm">Розмір шрифту: {settings.headerFontSize}px</Label>
                      <Slider
                        value={[settings.headerFontSize]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, headerFontSize: value }))}
                        min={10}
                        max={20}
                        step={1}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Жирність шрифту</Label>
                      <Select
                        value={settings.headerFontWeight}
                        onValueChange={(value: 'normal' | 'bold') => setSettings(prev => ({ ...prev, headerFontWeight: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Звичайний</SelectItem>
                          <SelectItem value="bold">Жирний</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Колір фону заголовків</Label>
                      <Input
                        type="color"
                        value={settings.headerBackgroundColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, headerBackgroundColor: e.target.value }))}
                        className="mt-1 h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Колір тексту заголовків</Label>
                      <Input
                        type="color"
                        value={settings.headerTextColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, headerTextColor: e.target.value }))}
                        className="mt-1 h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Settings */}
                <div>
                  <Label className="text-base font-semibold">Візуальні налаштування</Label>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={settings.showVerticalLines}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({ ...prev, showVerticalLines: checked as boolean }))
                        }
                      />
                      <Label className="text-sm">Показувати вертикальні лінії</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={settings.enableRowHover}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({ ...prev, enableRowHover: checked as boolean }))
                        }
                      />
                      <Label className="text-sm">Підсвітка рядка при наведенні</Label>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="flex flex-wrap items-center gap-4">
          {searchable && (
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Пошук..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}
          
          {filterable && visibleColumns.filter(col => settings.columnSettings[col.key]?.filterable === true).length > 0 && (
            <div className="flex gap-2">
              {visibleColumns.filter(col => settings.columnSettings[col.key]?.filterable === true).map((column) => (
                <Select key={column.key} onValueChange={(value) => handleFilter(column.key, value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={`Фільтр: ${column.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі</SelectItem>
                    {Array.from(new Set(data.map(item => String(item[column.key] || ''))))
                      .filter(Boolean)
                      .sort()
                      .map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data Display */}
      {settings.viewMode === 'table' ? renderTableView() : renderCardView()}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Показано {((currentPage - 1) * effectivePageSize) + 1}-{Math.min(currentPage * effectivePageSize, data.length)} з загальної кількості результатів
            </div>
            {onPageSizeChange && (
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-600">Рядків на сторінці:</Label>
                <Select
                  value={effectivePageSize.toString()}
                  onValueChange={(value) => {
                    onPageSizeChange(parseInt(value));
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              }).filter(Boolean)}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}