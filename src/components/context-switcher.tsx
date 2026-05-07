import { UserCog, Check, Shield, ConciergeBell, Stethoscope } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/hooks/use-store";
import type { AppRole, UserContext } from "@/lib/mock-store";

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

export function ContextSwitcher() {
  const store = useStore();
  const session = store.session;
  if (!session) return null;

  const contexts = store.availableContexts;
  const activeKey = ctxKey({ role: session.role, professionalId: session.professionalId });
  const activePro = session.professionalId
    ? store.professionals.find((p) => p.id === session.professionalId)
    : null;

  // Mostra contextos por papel disponível + um item por profissional vinculado
  const proContexts = contexts.filter((c) => c.role === "profissional" && c.professionalId);
  const adminCtx = contexts.find((c) => c.role === "admin");
  const recepcaoCtx = contexts.find((c) => c.role === "recepcao");

  const hasMultiple =
    contexts.length > 1 ||
    (proContexts.length > 0 && (adminCtx || recepcaoCtx));

  const ActiveIcon = roleIcon[session.role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/85 hover:bg-sidebar-accent/60 transition-smooth"
        title="Trocar contexto"
      >
        <UserCog className="h-4 w-4" />
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs font-medium truncate">
            {roleLabel[session.role]}
            {activePro ? ` · ${activePro.name.split(" ")[0]}` : ""}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">{store.clinic.name}</div>
        </div>
        <ActiveIcon className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">
          <div className="font-semibold">{store.clinic.name}</div>
          <div className="text-muted-foreground font-normal mt-0.5">
            Contexto: {roleLabel[session.role]}
            {activePro ? ` — ${activePro.name}` : ""}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!hasMultiple && (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            Sem contextos adicionais
          </DropdownMenuItem>
        )}
        {adminCtx && (
          <ContextItem
            ctx={adminCtx}
            label="Modo Admin"
            active={activeKey === ctxKey(adminCtx)}
          />
        )}
        {recepcaoCtx && (
          <ContextItem
            ctx={recepcaoCtx}
            label="Modo Recepção"
            active={activeKey === ctxKey(recepcaoCtx)}
          />
        )}
        {proContexts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
              Profissionais
            </DropdownMenuLabel>
            {proContexts.map((c) => {
              const pro = store.professionals.find((p) => p.id === c.professionalId);
              if (!pro) return null;
              return (
                <ContextItem
                  key={ctxKey(c)}
                  ctx={c}
                  label={pro.name}
                  active={activeKey === ctxKey(c)}
                />
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ContextItem({
  ctx,
  label,
  active,
}: {
  ctx: UserContext;
  label: string;
  active: boolean;
}) {
  const store = useStore();
  const Icon = roleIcon[ctx.role];
  return (
    <DropdownMenuItem
      onClick={() => {
        if (active) return;
        store.switchContext(ctx);
      }}
      className="text-sm"
    >
      <Icon className="h-4 w-4 opacity-70" />
      <span className="flex-1 truncate">{label}</span>
      {active && <Check className="h-4 w-4 text-primary" />}
    </DropdownMenuItem>
  );
}