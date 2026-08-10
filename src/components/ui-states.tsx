import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { statusFor, STATUS_LABEL } from "@/lib/edupilot-types";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function CardSkeletons({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="surface flex flex-col items-center gap-3 border-destructive/30 px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-destructive">Something went wrong</h3>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

export function MasteryBar({ value }: { value: number }) {
  const tone =
    value >= 80 ? "bg-success" : value >= 60 ? "bg-primary" : value >= 45 ? "bg-warning" : "bg-destructive";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function StatusBadge({ mastery, status }: { mastery: number; status?: string }) {
  const key = (status && status in STATUS_LABEL ? status : statusFor(mastery)) as keyof typeof STATUS_LABEL;
  const tone =
    key === "mastered"
      ? "border-success/40 bg-success/10 text-success"
      : key === "improving"
        ? "border-primary/40 bg-primary/10 text-primary"
        : key === "needs_practice"
          ? "border-warning/50 bg-warning/15 text-warning-foreground"
          : key === "not_started"
            ? "border-border bg-muted text-muted-foreground"
            : "border-destructive/40 bg-destructive/10 text-destructive";
  return (
    <Badge variant="outline" className={cn("font-medium", tone)}>
      {STATUS_LABEL[key]}
    </Badge>
  );
}
