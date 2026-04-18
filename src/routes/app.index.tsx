import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  HeartHandshake,
  Wallet,
  CalendarCheck,
  TrendingUp,
  ConciergeBell,
  Activity,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FinancialBadge } from "@/components/financial-badge";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const store = useStore();
  const today = new Date();

  const todayAppts = store.appointments
    .filter((a) => isSameDay(new Date(a.date), today) && a.status !== "cancelado")
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const waiting = store.reception.filter((r) => r.status === "aguardando").length;

  const monthRevenue = store.finance
    .filter((e) => e.status === "pago" && new Date(e.date).getMonth() === today.getMonth())
    .reduce((s, e) => s + e.amount, 0);

  const activeMembers = store.members.filter((m) => m.active).length;
  const delinquentMembers = store.members.filter((m) =>
    m.payments.some((p) => p.status === "pendente"),
  );

  // atendimentos por área (hoje)
  const byArea = store.areas.map((ar) => {
    const proIds = store.professionals.filter((p) => p.areaId === ar.id).map((p) => p.id);
    const count = todayAppts.filter((a) => proIds.includes(a.professionalId)).length;
    return { area: ar, count };
  });

  const stats = [
    {
      label: "Pacientes",
      value: store.patients.length,
      icon: Users,
      hint: "Cadastrados",
      tone: "primary" as const,
    },
    {
      label: "Hoje",
      value: todayAppts.length,
      icon: CalendarCheck,
      hint: format(today, "EEEE, dd 'de' MMM", { locale: ptBR }),
      tone: "accent" as const,
    },
    {
      label: "Aguardando",
      value: waiting,
      icon: ConciergeBell,
      hint: "Na recepção agora",
      tone: "warning" as const,
    },
    {
      label: "Associados ativos",
      value: activeMembers,
      icon: HeartHandshake,
      hint: `${delinquentMembers.length} inadimplente(s)`,
      tone: "success" as const,
    },
    {
      label: "Faturamento mês",
      value: monthRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: Wallet,
      hint: "Recebido",
      tone: "primary" as const,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Olá, ${store.clinic.name}`}
        description="Visão geral da sua operação hoje."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const iconCls =
            s.tone === "primary"
              ? "gradient-primary text-primary-foreground shadow-glow"
              : s.tone === "success"
                ? "bg-success/15 text-success"
                : s.tone === "warning"
                  ? "bg-warning/15 text-warning"
                  : "bg-accent text-accent-foreground";
          return (
            <Card
              key={s.label}
              className="p-5 shadow-soft border-border/60 hover:shadow-elegant transition-smooth"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                    {s.label}
                  </div>
                  <div className="text-2xl font-semibold mt-2 tracking-tight">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">{s.hint}</div>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${iconCls}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Pacientes do dia</h3>
              <p className="text-xs text-muted-foreground">
                {todayAppts.length} consulta(s) programada(s)
              </p>
            </div>
            <Link
              to="/app/agenda"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver agenda completa →
            </Link>
          </div>

          {todayAppts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma consulta agendada para hoje.
            </div>
          ) : (
            <div className="space-y-2">
              {todayAppts.map((a) => {
                const pt = store.patients.find((p) => p.id === a.patientId);
                const pro = store.professionals.find((p) => p.id === a.professionalId);
                const fin = store.getPatientFinancialStatus(a.patientId);
                const r = store.reception.find((x) => x.appointmentId === a.id);
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-smooth"
                  >
                    <div className="text-sm font-medium tabular-nums w-14">
                      {format(new Date(a.date), "HH:mm")}
                    </div>
                    <div className="h-8 w-1 rounded-full" style={{ background: pro?.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{pt?.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {pro?.name} · {pro?.specialty}
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <FinancialBadge status={fin} size="xs" />
                    </div>
                    <Badge
                      variant={
                        r?.status === "em_atendimento"
                          ? "default"
                          : r?.status === "finalizado"
                            ? "secondary"
                            : a.status === "confirmado"
                              ? "default"
                              : "secondary"
                      }
                      className={
                        r?.status === "em_atendimento"
                          ? "bg-primary text-primary-foreground"
                          : r?.status === "aguardando"
                            ? "bg-warning text-warning-foreground"
                            : a.status === "confirmado"
                              ? "bg-success text-success-foreground"
                              : ""
                      }
                    >
                      {r?.status === "em_atendimento"
                        ? "atendendo"
                        : r?.status === "aguardando"
                          ? "aguardando"
                          : r?.status === "finalizado"
                            ? "finalizado"
                            : a.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {/* Atendimentos por área */}
          <Card className="p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Atendimentos por área (hoje)</h3>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {byArea.map(({ area, count }) => {
                const max = Math.max(1, ...byArea.map((x) => x.count));
                const pct = (count / max) * 100;
                return (
                  <div key={area.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: area.color }} />
                        {area.name}
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-smooth"
                        style={{ width: `${pct}%`, background: area.color }}
                      />
                    </div>
                  </div>
                );
              })}
              {byArea.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Cadastre áreas em Profissionais.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Inadimplentes</h3>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {delinquentMembers.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.phone}</div>
                  </div>
                  <Badge variant="outline" className="text-warning border-warning/40">
                    R$ {m.monthlyFee}
                  </Badge>
                </div>
              ))}
              {delinquentMembers.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Tudo em dia! 🎉
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
