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
                style={{ 
                  clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' 
                }}
              />
            </div>
          );
        } else {
          return <Star key={i} className="h-4 w-4 text-gray-300" />;
        }
      })}
    </div>
  );
};

interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'badge' | 'rating';
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableSettings {
  viewMode: 'table' | 'cards';
  pageSize: number;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  columnOrder: string[];
  columnSettings: Record<string, {
    visible: boolean;
    width?: number;
  }>;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  rowBackgroundColor: string;
  rowTextColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  headerFontSize: number;
  headerFontWeight: string;
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
  storageKey?: string;
  cardTemplate?: (row: any) => React.ReactNode;
  expandableContent?: (row: any) => React.ReactNode;
  expandedItems?: Set<any>;
  onToggleExpand?: (id: any) => void;
}

const defaultColumnSettings = {
  visible: true,
  width: 150
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
  storageKey = 'datatable',
  cardTemplate,
  expandableContent,
  expandedItems = new Set(),
  onToggleExpand
}: DataTableProps) {
  // Get initial settings from localStorage or defaults
  const getInitialSettings = (): DataTableSettings => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(`${storageKey}-settings`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            columnOrder: parsed.columnOrder || columns.map(c => c.key),
            columnSettings: {
              ...Object.fromEntries(columns.map(c => [c.key, defaultColumnSettings])),
              ...parsed.columnSettings
            }
          };
        } catch (e) {
          console.warn('Failed to parse saved settings:', e);
        }
      }
    }
    
    return {
      viewMode: 'table',
      pageSize: 10,
      sortField: null,
      sortDirection: 'asc',
      columnOrder: columns.map(c => c.key),
      columnSettings: Object.fromEntries(columns.map(c => [c.key, defaultColumnSettings])),
      fontSize: 14,
      fontWeight: 'normal',
      fontStyle: 'normal',
      rowBackgroundColor: '#ffffff',
      rowTextColor: '#000000',
      headerBackgroundColor: '#f8fafc',
      headerTextColor: '#1e293b',
      headerFontSize: 14,
      headerFontWeight: 'bold',
      showVerticalLines: true,
      enableRowHover: true
    };
  };

  const [settings, setSettings] = useState<DataTableSettings>(getInitialSettings);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(`${storageKey}-settings`, JSON.stringify(settings));
    }
  }, [settings, storageKey]);

  // Sort and filter data
  const sortedData = useMemo(() => {
    if (!settings.sortField) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[settings.sortField!];
      const bVal = b[settings.sortField!];
      
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      
      return settings.sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [data, settings.sortField, settings.sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / settings.pageSize);
  const startIndex = (currentPage - 1) * settings.pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + settings.pageSize);

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

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

  const handleSort = (columnKey: string) => {
    if (!columns.find(c => c.key === columnKey)?.sortable) return;
    
    const newDirection = settings.sortField === columnKey && settings.sortDirection === 'asc' ? 'desc' : 'asc';
    setSettings(prev => ({
      ...prev,
      sortField: columnKey,
      sortDirection: newDirection
    }));
    
    onSort?.(columnKey, newDirection);
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
      "h-full flex flex-col overflow-hidden rounded-lg",
      settings.showVerticalLines ? "border" : ""
    )}>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead
            className="border-b sticky top-0 z-10"
            style={{
              backgroundColor: settings.headerBackgroundColor,
              color: settings.headerTextColor,
              fontSize: `${settings.headerFontSize}px`,
              fontWeight: settings.headerFontWeight
            }}
          >
            <tr>
              {expandableContent && (
                <th className="px-4 py-3 w-10"></th>
              )}
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left font-medium cursor-pointer select-none transition-colors",
                    column.sortable && "hover:bg-gray-100",
                    settings.showVerticalLines && "border-r"
                  )}
                  style={{ width: settings.columnSettings[column.key]?.width }}
                  onClick={() => handleSort(column.key)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, column.key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 w-20 text-center">Дії</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: settings.pageSize }).map((_, index) => (
                <tr key={index} className="border-b">
                  {expandableContent && (
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-4" />
                    </td>
                  )}
                  {visibleColumns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 w-20">
                      <div className="flex gap-1">
                        <Skeleton className="h-6 w-6" />
                        <Skeleton className="h-6 w-6" />
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
                
                return (
                  <React.Fragment key={`row-${itemId}`}>
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
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            {isExpanded ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </div>
                        </td>
                      )}
                      {visibleColumns.map((column) => (
                        <td key={column.key} className={cn("px-4 py-3", settings.showVerticalLines && "border-r")}>
                          {column.render ? 
                            column.render(row[column.key], row) : 
                            column.type === 'rating' ?
                              <StarRating rating={parseFloat(row[column.key]) || 0} /> :
                            column.type === 'badge' ?
                              <Badge variant="outline">{row[column.key]}</Badge> :
                              row[column.key]
                          }
                        </td>
                      ))}
                      {actions && (
                        <td className="px-4 py-3 w-20">
                          <div className="flex gap-1 justify-center">
                            {actions(row)}
                          </div>
                        </td>
                      )}
                    </tr>
                    {/* Expanded row content */}
                    {isExpanded && expandableContent && (
                      <tr>
                        <td 
                          colSpan={visibleColumns.length + (actions ? 1 : 0) + (typeof expandableContent === 'function' ? 1 : 0)}
                          className="px-0 py-0 border-b"
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
    </div>
  );

  const renderCardView = () => (
    <div className="h-full overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
        {loading ? (
          Array.from({ length: settings.pageSize }).map((_, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : paginatedData.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">Дані не знайдено</div>
        ) : (
          paginatedData.map((row, index) => (
            <Card 
              key={index} 
              className={cn(
                "cursor-pointer hover:shadow-md transition-shadow min-h-[280px] flex flex-col",
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
              <CardContent className="p-6 flex-1 flex flex-col">
                {cardTemplate ? cardTemplate(row) : (
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
                    {actions && !cardTemplate && (
                      <div className="pt-3 mt-auto border-t flex justify-end">
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
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl">
      {/* Header - компактний */}
      <div className="p-4 flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              {title && <h2 className="text-xl font-bold">{title}</h2>}
              {description && <p className="text-sm text-gray-500">{description}</p>}
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
                  {/* Settings content */}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Data Display - займає весь доступний простір */}
      <div className="flex-1 min-h-0">
        {settings.viewMode === 'table' ? renderTableView() : renderCardView()}
      </div>

      {/* Pagination - компактна */}
      {(totalPages > 1 || sortedData.length > settings.pageSize) && (
        <div className="flex-shrink-0 px-4 py-3 border-t">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
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
        </div>
      )}
    </div>
  );
}