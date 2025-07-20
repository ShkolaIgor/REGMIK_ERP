import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "spinner" | "dots" | "pulse" | "refresh";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  blur?: boolean;
}

export function LoadingOverlay({ 
  isLoading, 
  text = "Завантаження...", 
  children, 
  className,
  variant = "spinner",
  color = "primary",
  blur = true
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center z-50 rounded-lg transition-all duration-300",
            "bg-background/90 dark:bg-background/95",
            blur && "backdrop-blur-sm",
            "animate-fade-in"
          )}
        >
          <div className="animate-scale-in">
            <LoadingSpinner 
              text={text} 
              variant={variant}
              color={color}
              size="lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: "spinner" | "dots" | "pulse" | "refresh";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}

export function LoadingButton({ 
  isLoading = false, 
  loadingText, 
  children, 
  disabled,
  className,
  variant = "spinner",
  color = "primary",
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200",
        "focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        isLoading && "cursor-wait",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isLoading && (
          <LoadingSpinner 
            size="sm" 
            variant={variant}
            color={color}
          />
        )}
        <span className={cn(
          "transition-all duration-200",
          isLoading && "animate-fade-in"
        )}>
          {isLoading && loadingText ? loadingText : children}
        </span>
      </div>
    </button>
  );
}