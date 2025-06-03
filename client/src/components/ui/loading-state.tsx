import { LoadingSpinner } from "./loading-spinner";
import { Skeleton, ChartSkeleton, ListSkeleton, CardSkeleton } from "./skeleton";

export { ChartSkeleton, ListSkeleton, CardSkeleton, Skeleton };

interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "chart" | "list" | "card";
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
  items?: number;
  columns?: number;
}

export function LoadingState({ 
  type = "spinner",
  size = "md",
  text = "Завантаження...",
  className,
  items = 5,
  columns = 4
}: LoadingStateProps) {
  switch (type) {
    case "skeleton":
      return <Skeleton className={className} />;
    case "chart":
      return <ChartSkeleton />;
    case "list":
      return <ListSkeleton items={items} />;
    case "card":
      return <CardSkeleton />;
    case "spinner":
    default:
      return (
        <LoadingSpinner 
          size={size} 
          text={text} 
          className={className}
        />
      );
  }
}

// Specific loading states for different sections
export function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

export function TableLoadingState({ rows = 10, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="p-4">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FormLoadingState() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}