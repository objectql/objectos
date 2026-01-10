import { cn } from "@objectos/ui";

export function Spinner({ className }: { className?: string }) {
    return (
        <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", className)}>
            <span className="sr-only">Loading...</span>
        </div>
    );
}
