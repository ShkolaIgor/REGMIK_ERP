import React, { useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';

interface Column {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
}

interface ResizableTableProps {
  columns: Column[];
  data: any[];
  tableName: string;
  onColumnWidthChange?: (columnKey: string, width: number) => void;
  children?: (item: any, index: number) => React.ReactNode;
}

export const ResizableTable: React.FC<ResizableTableProps> = ({
  columns,
  data,
  tableName,
  onColumnWidthChange,
  children
}) => {
  const { user } = useAuth();
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const startPosRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Завантаження збережених ширин стовпців
  useEffect(() => {
    if (!user) return;

    const loadColumnWidths = async () => {
      try {
        const response = await fetch(`/api/column-widths/${tableName}`);
        if (response.ok) {
          const widths = await response.json();
          const widthMap: { [key: string]: number } = {};
          widths.forEach((w: any) => {
            widthMap[w.columnName] = w.width;
          });
          setColumnWidths(widthMap);
        }
      } catch (error) {
        console.error('Failed to load column widths:', error);
      }
    };

    loadColumnWidths();
  }, [user, tableName]);

  // Збереження ширини стовпця
  const saveColumnWidth = async (columnKey: string, width: number) => {
    if (!user) return;

    try {
      await fetch('/api/column-widths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName,
          columnName: columnKey,
          width
        })
      });
    } catch (error) {
      console.error('Failed to save column width:', error);
    }
  };

  // Початок зміни розміру
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setIsResizing(columnKey);
    startPosRef.current = e.clientX;
    
    const currentWidth = columnWidths[columnKey] || 
      columns.find(c => c.key === columnKey)?.width || 150;
    startWidthRef.current = currentWidth;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Зміна розміру
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const diff = e.clientX - startPosRef.current;
    const newWidth = Math.max(50, startWidthRef.current + diff); // Мінімальна ширина 50px
    
    const column = columns.find(c => c.key === isResizing);
    if (column?.maxWidth && newWidth > column.maxWidth) return;
    if (column?.minWidth && newWidth < column.minWidth) return;

    setColumnWidths(prev => ({
      ...prev,
      [isResizing]: newWidth
    }));
  };

  // Завершення зміни розміру
  const handleMouseUp = () => {
    if (isResizing) {
      const finalWidth = columnWidths[isResizing];
      if (finalWidth) {
        saveColumnWidth(isResizing, finalWidth);
        onColumnWidthChange?.(isResizing, finalWidth);
      }
    }

    setIsResizing(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Отримання ширини стовпця
  const getColumnWidth = (column: Column) => {
    return columnWidths[column.key] || column.width || 150;
  };

  return (
    <div className="relative overflow-auto">
      <Table ref={tableRef} className="min-w-full table-fixed">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className="relative border-r bg-gray-50"
                style={{ 
                  width: `${getColumnWidth(column)}px`,
                  minWidth: `${column.minWidth || 50}px`,
                  maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined
                }}
              >
                <div className="flex items-center justify-between pr-2">
                  <span className="truncate">{column.label}</span>
                  {column.resizable !== false && (
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 hover:opacity-70 flex items-center justify-center"
                      onMouseDown={(e) => handleMouseDown(e, column.key)}
                      title="Перетягніть для зміни ширини"
                    >
                      <div className="w-0.5 h-4 bg-gray-400"></div>
                    </div>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {children ? (
            data.map((item, index) => children(item, index))
          ) : (
            data.map((item, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    style={{ width: `${getColumnWidth(column)}px` }}
                    className="border-r truncate"
                  >
                    {item[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Курсор для зміни розміру */}
      {isResizing && (
        <div 
          className="fixed inset-0 cursor-col-resize bg-blue-100 bg-opacity-20" 
          style={{ zIndex: 9999 }}
          onMouseUp={handleMouseUp}
        />
      )}
    </div>
  );
};