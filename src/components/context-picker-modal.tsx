import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, ConciergeBell, Stethoscope, Check } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import type { AppRole, UserContext } from "@/lib/mock-store";
import { cn } from "@/lib/utils";

const roleLabel: Record<AppRole, string> = {
  admin: "Admin",
  recepcao: "Recepção",
  profissional: "Profissional",
};
const roleIcon: Record<AppRole, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  recepcao: ConciergeBell,
  profissional: Stethoscope,
};

function ctxKey(c: UserContext) {
  return `${c.role}:${c.professionalId ?? ""}`;
}

export function ContextPickerModal() {
  const store = useStore();
  const [selected, setSelected] = useState<UserContext | null>(null);

  const open =
    !!store.session &&
    !store.contextChosen &&
    store.availableContexts.length > 1;

  if (!open) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha o contexto de acesso</DialogTitle>
          <DialogDescription>
            Você possui múltiplos contextos nesta clínica. Selecione com qual deseja entrar agora —
            poderá alternar a qualquer momento pelo menu lateral.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {store.availableContexts.map((c) => {
            const Icon = roleIcon[c.role];
            const pro = c.professionalId
              ? store.professionals.find((p) => p.id === c.professionalId)
              : null;
            const isSelected = selected && ctxKey(selected) === ctxKey(c);
            return (
              <button
                key={ctxKey(c)}
                onClick={() => setSelected(c)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-smooth hover:bg-accent",
                  isSelected && "border-primary bg-accent",
                )}
              >
                <Icon className="h-5 w-5 opacity-70" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {roleLabel[c.role]}
                    {pro ? ` — ${pro.name}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">{store.clinic.name}</div>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end mt-4">
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) store.switchContext(selected);
            }}
          >
            Entrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}