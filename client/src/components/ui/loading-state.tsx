import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";
import { Skeleton } from "./skeleton";

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
  variant?: "overlay" | "skeleton" | "spinner" | "replace";
  text?: string;
  rows?: number;
  shimmer?: boolean;
}

export function LoadingState({
  isLoading,
  children,
  loadingComponent,
  className,
  variant = "overlay",
  text = "Завантаження...",
  rows = 5,
  shimmer = true
}: LoadingStateProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  if (loadingComponent) {
    return <div className={cn("animate-fade-in", className)}>{loadingComponent}</div>;
  }

  switch (variant) {
    case "skeleton":
      return (
        <div className={cn("space-y-3 animate-fade-in", className)}>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-12 w-full"
              shimmer={shimmer}
            />
          ))}
        </div>
      );

    case "spinner":
      return (
        <div className={cn("flex items-center justify-center py-12 animate-fade-in", className)}>
          <LoadingSpinner
            text={text}
            variant="spinner"
            color="primary"
            size="lg"
          />
        </div>
      );

    case "replace":
      return (
        <div className={cn("animate-scale-in", className)}>
          <LoadingSpinner
            text={text}
            variant="dots"
            color="primary"
            size="md"
          />
        </div>
      );

    case "overlay":
    default:
      return (
        <div className={cn("relative", className)}>
          {children}
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg animate-fade-in">
            <div className="animate-scale-in">
              <LoadingSpinner
                text={text}
                variant="spinner"
                color="primary"
                size="lg"
              />
            </div>
          </div>
        </div>
      );
  }
}

// Specialized loading components for common use cases
export function TableLoadingState({ rows = 5, shimmer = true }: { rows?: number; shimmer?: boolean }) {
  return (
    <div className="space-y-2 animate-fade-in">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 items-center p-4 border rounded-lg">
          <Skeleton className="h-4 w-8" shimmer={shimmer} />
          <Skeleton className="h-4 flex-1" shimmer={shimmer} />
          <Skeleton className="h-4 w-24" shimmer={shimmer} />
          <Skeleton className="h-4 w-16" shimmer={shimmer} />
          <Skeleton className="h-8 w-20" shimmer={shimmer} />
        </div>
      ))}
    </div>
  );
}

export function CardLoadingState({ shimmer = true }: { shimmer?: boolean }) {
  return (
    <div className="p-6 border rounded-lg space-y-4 animate-fade-in">
      <Skeleton className="h-6 w-2/3" shimmer={shimmer} />
      <Skeleton className="h-4 w-full" shimmer={shimmer} />
      <Skeleton className="h-4 w-3/4" shimmer={shimmer} />
      <div className="flex space-x-2 pt-2">
        <Skeleton className="h-8 w-20" shimmer={shimmer} />
        <Skeleton className="h-8 w-16" shimmer={shimmer} />
      </div>
    </div>
  );
}

export function FormLoadingState({ fields = 4, shimmer = true }: { fields?: number; shimmer?: boolean }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" shimmer={shimmer} />
          <Skeleton className="h-10 w-full" shimmer={shimmer} />
        </div>
      ))}
      <div className="flex space-x-2 pt-4">
        <Skeleton className="h-10 w-20" shimmer={shimmer} />
        <Skeleton className="h-10 w-20" shimmer={shimmer} />
      </div>
    </div>
  );
}

export function DashboardCardLoading({ shimmer = true }: { shimmer?: boolean }) {
  return (
    <div className="p-6 bg-white rounded-lg border shadow-sm space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" shimmer={shimmer} />
        <Skeleton className="h-6 w-6 rounded-full" shimmer={shimmer} />
      </div>
      <Skeleton className="h-8 w-20" shimmer={shimmer} />
      <Skeleton className="h-3 w-full" shimmer={shimmer} />
    </div>
  );
}

