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
  FileText,
  Star
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { TableLoadingState, LoadingState } from '@/components/ui/loading-state';
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
  render?: (value: any, row: any) => React.ReactNode;
  width?: number;
  minWidth?: number;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'rating' | 'custom';
}

export interface ColumnSettings {
  visible: boolean;
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
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: any) => void;
  actions?: (row: any) => React.ReactNode;
  title?: string;
  description?: string;
  storageKey: string; // Unique key for saving settings
  cardTemplate?: (item: any) => React.ReactNode;
  expandableContent?: (item: any) => React.ReactNode;
  expandedItems?: Set<string | number>;
  onToggleExpand?: (itemId: string | number) => void;
  // Server-side pagination props
  serverPagination?: {
    enabled: boolean;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

const defaultColumnSettings: ColumnSettings = {
  visible: true,
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
  showVerticalLines: false,
  enableRowHover: true
};

export function DataTable({
  data,
  columns,
  loading = false,
  onSort,
  onRowClick,
  actions,
  title,
  description,
  storageKey,
  cardTemplate,
  expandableContent,
  expandedItems = new Set(),
  onToggleExpand,
  serverPagination
}: DataTableProps) {
  // Load settings from localStorage
  const [settings, setSettings] = useState<DataTableSettings>(() => {
    try {
      const saved = localStorage.getItem(`datatable-${storageKey}`);
      const loadedSettings = saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
      return loadedSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(`datatable-${storageKey}`, JSON.stringify(settings));
  }, [settings, storageKey]);

  // Initialize column order and settings
  useEffect(() => {
    const currentColumnKeys = columns.map(col => col.key);
    const existingKeys = settings.columnOrder;
    
    // Check if we need to add new columns or initialize from scratch
    const missingColumns = currentColumnKeys.filter(key => !existingKeys.includes(key));
    const hasNewColumns = missingColumns.length > 0;
    const isEmpty = settings.columnOrder.length === 0;
    
    if (isEmpty || hasNewColumns) {
      setSettings(prev => {
        // For empty settings, use all columns
        if (isEmpty) {
          return {
            ...prev,
            columnOrder: currentColumnKeys,
            columnSettings: currentColumnKeys.reduce((acc, col) => {
              acc[col] = { ...defaultColumnSettings };
              return acc;
            }, {} as Record<string, ColumnSettings>)
          };
        }
        
        // For existing settings with new columns, add the new ones at the end
        return {
          ...prev,
          columnOrder: [...prev.columnOrder, ...missingColumns],
          columnSettings: {
            ...prev.columnSettings,
            ...missingColumns.reduce((acc, col) => {
              acc[col] = { ...defaultColumnSettings };
              return acc;
            }, {} as Record<string, ColumnSettings>)
          }
        };
      });
    }
  }, [columns]);

  // Optimized sort for large datasets
  const sortedData = useMemo(() => {
    if (!settings.sortField) return data;

    return [...data].sort((a, b) => {
      const aVal = a[settings.sortField];
      const bVal = b[settings.sortField];
      
      // Optimized comparison for different data types
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return settings.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      const result = String(aVal).localeCompare(String(bVal));
      return settings.sortDirection === 'asc' ? result : -result;
    });
  }, [data, settings.sortField, settings.sortDirection]);

  // Pagination logic: use server-side if enabled, otherwise client-side
  const paginatedData = useMemo(() => {
    if (serverPagination?.enabled) {
      // Server-side pagination: use data as-is (already paginated by server)
      return sortedData;
    } else {
      // Client-side pagination: slice data
      const start = (currentPage - 1) * settings.pageSize;
      const end = start + settings.pageSize;
      return sortedData.slice(start, end);
    }
  }, [sortedData, currentPage, settings.pageSize, serverPagination]);
  
  // Reduce default page size for large datasets (only for client-side pagination)
  useEffect(() => {
    if (!serverPagination?.enabled && data.length > 10000 && settings.pageSize > 200) {
      setSettings(prev => ({ ...prev, pageSize: 100 }));
    }
  }, [data.length, settings.pageSize, serverPagination]);

  // Calculate pagination info based on mode
  const paginationInfo = useMemo(() => {
    if (serverPagination?.enabled) {
      return {
        totalPages: serverPagination.totalPages,
        totalItems: serverPagination.totalItems,
        currentPage: serverPagination.currentPage,
        pageSize: serverPagination.pageSize
      };
    } else {
      return {
        totalPages: Math.ceil(sortedData.length / settings.pageSize),
        totalItems: sortedData.length,
        currentPage: currentPage,
        pageSize: settings.pageSize
      };
    }
  }, [sortedData.length, settings.pageSize, currentPage, serverPagination]);
  
  // Pagination info calculated for current mode

  const handleSort = (columnKey: string) => {
    const newDirection = settings.sortField === columnKey && settings.sortDirection === 'asc' ? 'desc' : 'asc';
    setSettings(prev => ({
      ...prev,
      sortField: columnKey,
      sortDirection: newDirection
    }));
    onSort?.(columnKey, newDirection);
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
      "overflow-x-auto rounded-lg",
      settings.showVerticalLines ? "border" : ""
    )}>
      <table className="w-full">
        <thead
          className={cn(
            "border-b",
            settings.headerFontWeight === 'bold' ? 'font-bold' : 'font-normal',
            settings.headerFontStyle === 'italic' ? 'italic' : 'not-italic'
          )}
          style={{
            backgroundColor: settings.headerBackgroundColor,
            color: settings.headerTextColor,
            fontSize: `${settings.headerFontSize}px`,
            fontWeight: `${settings.headerFontWeight} !important`,
            fontStyle: settings.headerFontStyle
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
            Array.from({ length: settings.pageSize }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b animate-fade-in" style={{ animationDelay: `${rowIndex * 0.05}s` }}>
                {expandableContent && (
                  <td className="px-4 py-3 w-8">
                    <Skeleton className="h-4 w-4" shimmer />
                  </td>
                )}
                {visibleColumns.map((column, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <Skeleton 
                      className="h-4 w-full" 
                      shimmer
                      style={{ animationDelay: `${(rowIndex * visibleColumns.length + colIndex) * 0.02}s` }}
                    />
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 w-20">
                    <div className="flex gap-1">
                      <Skeleton className="h-6 w-6 rounded" shimmer />
                      <Skeleton className="h-6 w-6 rounded" shimmer />
                    </div>
                  </td>
                )}
              </tr>
            ))
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
              
              const MainRow = (
                <tr
                  key={`row-${itemId}`}
                  className={cn(
                    "border-b transition-all duration-300 ease-in-out",
                    (onRowClick || expandableContent) && "cursor-pointer",
                    settings.enableRowHover && "hover:shadow-lg hover:bg-blue-50/50 hover:scale-[1.005] hover:border-blue-200",
                    settings.fontWeight === 'bold' ? 'font-bold' : 'font-normal',
                    settings.fontStyle === 'italic' ? 'italic' : 'not-italic'
                  )}
                  style={{
                    backgroundColor: settings.rowBackgroundColor,
                    color: settings.rowTextColor,
                    fontSize: `${settings.fontSize}px`,
                    fontWeight: `${settings.fontWeight} !important`,
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
                const cellValue = row[column.key];
                return (
                  <td 
                    key={column.key} 
                    className={cn(
                      "px-4 py-3",
                      settings.showVerticalLines ? "border-r last:border-r-0" : "",
                      columnSettings.fontWeight === 'bold' ? 'font-bold' : 'font-normal',
                      columnSettings.fontStyle === 'italic' ? 'italic' : 'not-italic'
                    )}
                    style={{
                      backgroundColor: columnSettings.backgroundColor,
                      color: columnSettings.textColor,
                      fontSize: `${columnSettings.fontSize}px`,
                      fontWeight: `${columnSettings.fontWeight} !important`,
                      fontStyle: columnSettings.fontStyle,
                      width: settings.columnWidths[column.key] || column.width,
                      minWidth: column.minWidth || 100
                    }}
                  >
                    {column.render ? 
                      column.render(cellValue, row) : 
                      column.type === 'badge' ? 
                        <Badge variant="outline">{cellValue}</Badge> :
                      column.type === 'rating' ?
                        <StarRating rating={parseFloat(cellValue) || 0} /> :
                        String(cellValue || '')
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
              );

              const ExpandedRow = isExpanded && expandableContent && (
                <tr key={`expanded-${itemId}`}>
                  <td 
                    colSpan={visibleColumns.length + (actions ? 1 : 0) + (typeof expandableContent === 'function' ? 1 : 0)}
                    className="px-0 py-0 border-b"
                  >
                    {expandableContent(row)}
                  </td>
                </tr>
              );

              return [MainRow, ExpandedRow].filter(Boolean);
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {loading ? (
        Array.from({ length: settings.pageSize }).map((_, index) => (
          <Card 
            key={index} 
            className="hover:shadow-md transition-all duration-300 animate-fade-in" 
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-3">             
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" shimmer />
                  <Skeleton className="h-4 w-1/2" shimmer />
                </div>
                <Skeleton className="h-6 w-16" shimmer />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" shimmer />
              <Skeleton className="h-4 w-5/6" shimmer />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-3 w-1/3" shimmer />
                    <Skeleton className="h-3 w-1/4" shimmer />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1 rounded" shimmer />
                <Skeleton className="h-8 w-8 rounded" shimmer />
              </div>
            </CardContent>
          </Card>
        ))
      ) : paginatedData.length === 0 ? (
        <div className="col-span-full text-center py-8 text-gray-500">Дані не знайдено</div>
      ) : (
        paginatedData.map((row, index) => (
          cardTemplate ? (
            // Коли використовується cardTemplate, рендеримо його без зовнішнього Card
            <div 
              key={index}
              className={cn(
                onRowClick && "cursor-pointer",
                settings.fontWeight === 'bold' ? 'font-bold' : 'font-normal',
                settings.fontStyle === 'italic' ? 'italic' : 'not-italic'
              )}
              style={{
                fontSize: `${settings.fontSize}px`,
                fontWeight: `${settings.fontWeight} !important`,
                fontStyle: settings.fontStyle
              }}
              onClick={() => onRowClick?.(row)}
            >
              {cardTemplate(row)}
            </div>
          ) : (
            // Для стандартних карток використовуємо Card від DataTable
            <Card 
              key={index} 
              className={cn(
                "cursor-pointer hover:shadow-md transition-shadow min-h-[280px] flex flex-col",
                onRowClick && "cursor-pointer",
                settings.fontWeight === 'bold' ? 'font-bold' : 'font-normal',
                settings.fontStyle === 'italic' ? 'italic' : 'not-italic'
              )}
              style={{
                backgroundColor: settings.rowBackgroundColor,
                color: settings.rowTextColor,
                fontSize: `${settings.fontSize}px`,
                fontWeight: `${settings.fontWeight} !important`,
                fontStyle: settings.fontStyle
              }}
              onClick={() => onRowClick?.(row)}
            >
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  {visibleColumns.slice(0, 6).map((column) => {
                    const columnSettings = settings.columnSettings[column.key] || defaultColumnSettings;
                    if (!columnSettings.visible) return null;
                    
                    return (
                      <div key={column.key} className="flex justify-between items-start gap-2">
                        <span className="font-medium text-sm text-muted-foreground min-w-0 flex-shrink-0">{column.label}:</span>
                        <div className="text-sm text-right min-w-0 flex-1">
                          {column.render ? 
                            column.render(row[column.key], row) : 
                            column.type === 'rating' ?
                              <StarRating rating={parseFloat(row[column.key]) || 0} /> :
                            column.type === 'badge' ?
                              <Badge variant="outline">{row[column.key]}</Badge> :
                              <span className="break-words">{String(row[column.key] || '')}</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                  {actions && (
                    <div className="pt-3 mt-auto border-t flex justify-end">
                      <div className="flex gap-1">
                        {actions(row)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        ))
      )}
    </div>
  );

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl">
       <div className="p-4">     
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">     
        
        <div className="p-4">    
        <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          {description && <p className="text-gray-400">{description}</p>}
        </div>
        </div>
        </div>
        
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
                                  <SelectItem value="13">13px</SelectItem>
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

      {/* Data Display */}
      {settings.viewMode === 'table' ? renderTableView() : renderCardView()}

      {/* Pagination */}
      {paginationInfo.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Показано {((paginationInfo.currentPage - 1) * paginationInfo.pageSize) + 1}-{Math.min(paginationInfo.currentPage * paginationInfo.pageSize, paginationInfo.totalItems)} з {paginationInfo.totalItems} результатів
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
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (serverPagination?.enabled) {
                  serverPagination.onPageChange(1);
                } else {
                  setCurrentPage(1);
                }
              }}
              disabled={paginationInfo.currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (serverPagination?.enabled) {
                  serverPagination.onPageChange(Math.max(1, paginationInfo.currentPage - 1));
                } else {
                  setCurrentPage(Math.max(1, paginationInfo.currentPage - 1));
                }
              }}
              disabled={paginationInfo.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                let pageNum;
                if (paginationInfo.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (paginationInfo.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (paginationInfo.currentPage >= paginationInfo.totalPages - 2) {
                  pageNum = paginationInfo.totalPages - 4 + i;
                } else {
                  pageNum = paginationInfo.currentPage - 2 + i;
                }
                
                if (pageNum < 1 || pageNum > paginationInfo.totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={paginationInfo.currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (serverPagination?.enabled) {
                        serverPagination.onPageChange(pageNum);
                      } else {
                        setCurrentPage(pageNum);
                      }
                    }}
                  >
                    {pageNum}
                  </Button>
                );
              }).filter(Boolean)}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (serverPagination?.enabled) {
                  serverPagination.onPageChange(Math.min(paginationInfo.totalPages, paginationInfo.currentPage + 1));
                } else {
                  setCurrentPage(Math.min(paginationInfo.totalPages, paginationInfo.currentPage + 1));
                }
              }}
              disabled={paginationInfo.currentPage === paginationInfo.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (serverPagination?.enabled) {
                  serverPagination.onPageChange(paginationInfo.totalPages);
                } else {
                  setCurrentPage(paginationInfo.totalPages);
                }
              }}
              disabled={paginationInfo.currentPage === paginationInfo.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  );
}