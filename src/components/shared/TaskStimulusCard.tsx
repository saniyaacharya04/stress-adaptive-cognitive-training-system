import { cn } from "@/lib/utils";

interface TaskStimulusCardProps {
  content: string;
  color?: string;
  size?: "md" | "lg" | "xl";
  className?: string;
}

export function TaskStimulusCard({ 
  content, 
  color,
  size = "lg",
  className 
}: TaskStimulusCardProps) {
  const sizeClasses = {
    md: "w-32 h-32 text-5xl",
    lg: "w-48 h-48 text-7xl",
    xl: "w-64 h-64 text-8xl",
  };

  return (
    <div 
      className={cn(
        "glass-card flex items-center justify-center font-bold rounded-3xl transition-all duration-300 animate-scale-in",
        sizeClasses[size],
        className
      )}
      style={{ color: color || undefined }}
    >
      {content}
    </div>
  );
}
