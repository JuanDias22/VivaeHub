import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  HeartHandshake,
  Wallet,
  Stethoscope,
  LogOut,
  Activity,
  MessageCircle,
} from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/app/pacientes", label: "Pacientes", icon: Users },
  { to: "/app/associados", label: "Associados", icon: HeartHandshake },
  { to: "/app/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/app/profissionais", label: "Profissionais", icon: Stethoscope },
  { to: "/app/whatsapp", label: "WhatsApp", icon: MessageCircle },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">{store.clinic.name}</div>
            <div className="text-xs text-muted-foreground">Plano Pro</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-smooth",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-soft"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => {
              store.logout();
              window.location.href = "/login";
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60 transition-smooth"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
          <div className="mt-2 px-3 text-xs text-muted-foreground truncate">
            {store.clinic.ownerEmail}
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md gradient-primary">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="text-sm font-semibold">{store.clinic.name}</div>
        </div>
        <div className="flex overflow-x-auto px-2 pb-2 gap-1 scrollbar-none">
          {nav.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap transition-smooth",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="flex-1 md:ml-0 pt-24 md:pt-0">
        <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1400px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
