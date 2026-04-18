import { Badge } from "@/components/ui/badge";
import { Heart, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ContributionStatus = "contribuinte" | "nao_contribuinte";

/**
 * Badge visual para status de contribuição voluntária do paciente.
 * Aceita o status diretamente ou um boolean (isContributor).
 */
export function ContributionBadge({
  status,
  size = "sm",
}: {
  status: ContributionStatus | boolean;
  size?: "xs" | "sm";
}) {
  const isContrib = status === true || status === "contribuinte";
  const sz = size === "xs" ? "text-[10px] px-1.5 py-0 h-4 gap-0.5" : "text-xs gap-1";
  if (isContrib) {
    return (
      <Badge variant="outline" className={cn("border-success/40 text-success", sz)}>
        <Heart className="h-3 w-3 fill-current" /> Contribuinte
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("text-muted-foreground", sz)}>
      <Circle className="h-3 w-3" /> Não contribui
    </Badge>
  );
}

// Backwards-compat alias used in existing imports.
export const FinancialBadge = ContributionBadge;
