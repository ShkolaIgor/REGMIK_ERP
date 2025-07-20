import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  variant?: "spinner" | "dots" | "pulse" | "refresh";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  text,
  variant = "spinner",
  color = "primary"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const colorClasses = {
    primary: "text-blue-600 border-blue-600",
    secondary: "text-gray-600 border-gray-600", 
    success: "text-green-600 border-green-600",
    warning: "text-yellow-600 border-yellow-600",
    error: "text-red-600 border-red-600"
  };

  const renderSpinner = () => {
    switch (variant) {
      case "refresh":
        return (
          <RefreshCw
            className={cn(
              "animate-spin",
              sizeClasses[size],
              colorClasses[color]
            )}
          />
        );
      
      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-current animate-bounce",
                  size === "sm" ? "h-1 w-1" : size === "md" ? "h-2 w-2" : size === "lg" ? "h-3 w-3" : "h-4 w-4",
                  colorClasses[color]
                )}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "0.6s"
                }}
              />
            ))}
          </div>
        );
      
      case "pulse":
        return (
          <div
            className={cn(
              "rounded-full bg-current animate-ping",
              sizeClasses[size],
              colorClasses[color]
            )}
          />
        );
      
      default:
        return (
          <Loader2
            className={cn(
              "animate-spin",
              sizeClasses[size],
              colorClasses[color]
            )}
          />
        );
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        {renderSpinner()}
      </div>
      {text && (
        <span className={cn(
          "text-sm font-medium tracking-wide transition-all duration-300",
          "text-gray-600 dark:text-gray-400",
          variant === "dots" ? "animate-pulse" : "animate-fade-in"
        )}>
          {text}
        </span>
      )}
    </div>
  );
}