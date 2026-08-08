import { LoaderCircle } from "lucide-react";

export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
