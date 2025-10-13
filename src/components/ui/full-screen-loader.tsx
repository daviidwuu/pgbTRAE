import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils";

interface FullScreenLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function FullScreenLoader({ 
  className, 
  size = "lg",
  text 
}: FullScreenLoaderProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 
          className={cn(
            "animate-spin text-primary",
            sizeClasses[size]
          )} 
        />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}