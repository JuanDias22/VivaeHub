import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";

export function FinancialBadge({
  status,
  size = "sm",
}: {
  status: "adimplente" | "inadimplente" | "nao_associado";
  size?: "xs" | "sm";
}) {
  const sz = size === "xs" ? "text-[10px] px-1.5 py-0 h-4" : "text-xs";
  if (status === "adimplente") {
    return (
      <Badge variant="outline" className={cn("border-success/40 text-success gap-1", sz)}>
        <CheckCircle2 className="h-3 w-3" /> Adimplente
      </Badge>
    );
  }
  if (status === "inadimplente") {
    return (
      <Badge variant="outline" className={cn("border-destructive/40 text-destructive gap-1", sz)}>
        <AlertCircle className="h-3 w-3" /> Inadimplente
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("text-muted-foreground gap-1", sz)}>
      <UserMinus className="h-3 w-3" /> Não associado
    </Badge>
  );
}
