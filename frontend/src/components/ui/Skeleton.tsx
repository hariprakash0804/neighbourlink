import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "clay" | "neu" | "default";
  shape?: "rectangle" | "circle" | "rounded";
}

export function Skeleton({
  variant = "default",
  shape = "rounded",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse",
        // Shape styling
        shape === "circle" && "rounded-full",
        shape === "rounded" && "rounded-2xl",
        shape === "rectangle" && "rounded-none",
        
        // Morphism variant styling
        variant === "default" && "bg-text-muted/15 dark:bg-white/10",
        variant === "glass" && "glass border border-white/10 bg-white/5",
        variant === "clay" && "bg-gradient-to-br from-white/10 to-white/5 shadow-clay border border-white/5",
        variant === "neu" && "bg-surface-secondary shadow-neu-inset dark:bg-surface-tertiary",
        
        className
      )}
      {...props}
    />
  );
}
