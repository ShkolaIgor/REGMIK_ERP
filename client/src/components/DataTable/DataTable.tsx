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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  Palette,
  Type,
  Bold,
  Italic
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: number;
  minWidth?: number;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'custom';
}

export interface DataTableSettings {
  pageSize: number;
  columnOrder: string[];
  columnWidths: Record<string, number>;
  columnVisibility: Record<string, boolean>;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  viewMode: 'table' | 'cards';
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  rowBackgroundColor: string;
  rowTextColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  headerFontSize: number;
  headerFontWeight: 'normal' | 'bold';
  headerFontStyle: 'normal' | 'italic';
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
}

const defaultSettings: DataTableSettings = {
  pageSize: 25,
  columnOrder: [],
  columnWidths: {},
  columnVisibility: {},
  sortField: '',
  sortDirection: 'asc',
  viewMode: 'table',
  fontSize: 14,
  fontFamily: 'system',
  fontWeight: 'normal',
  fontStyle: 'normal',
  rowBackgroundColor: '#ffffff',
  rowTextColor: '#000000',
  headerBackgroundColor: '#f8fafc',
  headerTextColor: '#374151',
  headerFontSize: 14,
  headerFontWeight: 'bold',
  headerFontStyle: 'normal'
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
  cardTemplate
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

  // Initialize column order and visibility
  useEffect(() => {
    if (settings.columnOrder.length === 0) {
      setSettings(prev => ({
        ...prev,
        columnOrder: columns.map(col => col.key),
        columnVisibility: columns.reduce((acc, col) => {
          acc[col.key] = true;
          return acc;
        }, {} as Record<string, boolean>)
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
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    onFilter?.(newFilters);
  };

  const orderedColumns = useMemo(() => {
    return settings.columnOrder
      .map(key => columns.find(col => col.key === key))
      .filter(Boolean) as DataTableColumn[];
  }, [columns, settings.columnOrder]);

  const visibleColumns = orderedColumns.filter(col => settings.columnVisibility[col.key]);

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
    <div className="overflow-auto border rounded-lg">
      <table className="w-full">
        <thead
          className="border-b"
          style={{
            backgroundColor: settings.headerBackgroundColor,
            color: settings.headerTextColor,
            fontSize: `${settings.headerFontSize}px`,
            fontWeight: settings.headerFontWeight,
            fontStyle: settings.headerFontStyle
          }}
        >
          <tr>
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left cursor-pointer select-none border-r last:border-r-0"
                style={{ 
                  width: settings.columnWidths[column.key] || column.width,
                  minWidth: column.minWidth || 100
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, column.key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, column.key)}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  <span>{column.label}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
            {actions && <th className="px-4 py-3 w-20">Дії</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={visibleColumns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center">
                Завантаження...
              </td>
            </tr>
          ) : paginatedData.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                Дані не знайдено
              </td>
            </tr>
          ) : (
            paginatedData.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  "border-b hover:bg-gray-50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                style={{
                  backgroundColor: settings.rowBackgroundColor,
                  color: settings.rowTextColor,
                  fontSize: `${settings.fontSize}px`,
                  fontFamily: settings.fontFamily,
                  fontWeight: settings.fontWeight,
                  fontStyle: settings.fontStyle
                }}
                onClick={() => onRowClick?.(row)}
              >
                {visibleColumns.map((column) => (
                  <td key={column.key} className="px-4 py-3 border-r last:border-r-0">
                    {column.render ? 
                      column.render(row[column.key], row) : 
                      column.type === 'badge' ? 
                        <Badge variant="outline">{row[column.key]}</Badge> :
                        String(row[column.key] || '')
                    }
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
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
              fontFamily: settings.fontFamily,
              fontWeight: settings.fontWeight,
              fontStyle: settings.fontStyle
            }}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-4">
              {cardTemplate ? cardTemplate(row) : (
                <div className="space-y-2">
                  {visibleColumns.slice(0, 3).map((column) => (
                    <div key={column.key} className="flex justify-between">
                      <span className="font-medium">{column.label}:</span>
                      <span>
                        {column.render ? 
                          column.render(row[column.key], row) : 
                          String(row[column.key] || '')
                        }
                      </span>
                    </div>
                  ))}
                  {actions && (
                    <div className="pt-2 border-t">
                      {actions(row)}
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
                {/* Column Visibility */}
                <div>
                  <Label className="text-base font-semibold">Відображення стовпців</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {columns.map((column) => (
                      <div key={column.key} className="flex items-center space-x-2">
                        <Checkbox
                          checked={settings.columnVisibility[column.key]}
                          onCheckedChange={(checked) =>
                            setSettings(prev => ({
                              ...prev,
                              columnVisibility: {
                                ...prev.columnVisibility,
                                [column.key]: checked as boolean
                              }
                            }))
                          }
                        />
                        <Label>{column.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row Styling */}
                <div>
                  <Label className="text-base font-semibold">Оформлення рядків</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Розмір шрифту: {settings.fontSize}px</Label>
                      <Slider
                        value={[settings.fontSize]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, fontSize: value }))}
                        min={10}
                        max={20}
                        step={1}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Тип шрифту</Label>
                      <Select
                        value={settings.fontFamily}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, fontFamily: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">Системний</SelectItem>
                          <SelectItem value="serif">Serif</SelectItem>
                          <SelectItem value="sans-serif">Sans-serif</SelectItem>
                          <SelectItem value="monospace">Monospace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Жирність шрифту</Label>
                      <Select
                        value={settings.fontWeight}
                        onValueChange={(value: 'normal' | 'bold') => setSettings(prev => ({ ...prev, fontWeight: value }))}
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
                      <Label>Стиль шрифту</Label>
                      <Select
                        value={settings.fontStyle}
                        onValueChange={(value: 'normal' | 'italic') => setSettings(prev => ({ ...prev, fontStyle: value }))}
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

                {/* Header Styling */}
                <div>
                  <Label className="text-base font-semibold">Оформлення заголовків</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label>Розмір шрифту: {settings.headerFontSize}px</Label>
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
                      <Label>Жирність шрифту</Label>
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
          
          {filterable && (
            <div className="flex gap-2">
              {columns.filter(col => col.filterable).map((column) => (
                <Input
                  key={column.key}
                  placeholder={`Фільтр по ${column.label}`}
                  value={filters[column.key] || ''}
                  onChange={(e) => handleFilter(column.key, e.target.value)}
                  className="w-40"
                />
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
              Показано {((currentPage - 1) * settings.pageSize) + 1}-{Math.min(currentPage * settings.pageSize, sortedData.length)} з {sortedData.length} результатів
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600">Рядків на сторінці:</Label>
              <Select
                value={settings.pageSize.toString()}
                onValueChange={(value) => {
                  setSettings(prev => ({ ...prev, pageSize: parseInt(value) }));
                  setCurrentPage(1);
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
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              }).filter(Boolean)}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
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