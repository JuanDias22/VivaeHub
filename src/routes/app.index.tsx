import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Heart,
  Wallet,
  CalendarCheck,
  ConciergeBell,
  Activity,
  Stethoscope,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContributionBadge } from "@/components/financial-badge";

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
  const inService = store.reception.filter((r) => r.status === "em_atendimento").length;

  const monthRaised = store.finance
    .filter(
      (e) =>
        e.type === "contribuicao" &&
        new Date(e.date).getMonth() === today.getMonth() &&
        new Date(e.date).getFullYear() === today.getFullYear(),
    )
    .reduce((s, e) => s + e.amount, 0);
  const totalRaised = store.getTotalRaised();

  const contribuintes = store.patients.filter((p) => p.isContributor).length;
  const naoContribuintes = store.patients.length - contribuintes;
  const contribPct = store.patients.length
    ? Math.round((contribuintes / store.patients.length) * 100)
    : 0;

  // atendimentos por área (hoje)
  const byArea = store.areas.map((ar) => {
    const proIds = store.professionals.filter((p) => p.areaId === ar.id).map((p) => p.id);
    const count = todayAppts.filter((a) => proIds.includes(a.professionalId)).length;
    return { area: ar, count };
  });

  const stats = [
    {
      label: "Pacientes do dia",
      value: todayAppts.length,
      icon: CalendarCheck,
      hint: format(today, "EEEE, dd 'de' MMM", { locale: ptBR }),
      tone: "primary" as const,
    },
    {
      label: "Aguardando",
      value: waiting,
      icon: ConciergeBell,
      hint: "Na recepção agora",
      tone: "warning" as const,
    },
    {
      label: "Em atendimento",
      value: inService,
      icon: Stethoscope,
      hint: "Acontecendo agora",
      tone: "accent" as const,
    },
    {
      label: "Contribuintes",
      value: `${contribuintes}/${store.patients.length}`,
      icon: Heart,
      hint: `${contribPct}% dos pacientes`,
      tone: "success" as const,
    },
    {
      label: "Arrecadado no mês",
      value: monthRaised.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: Wallet,
      hint: `Total: ${totalRaised.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      tone: "primary" as const,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Olá, ${store.clinic.name}`}
        description="Visão geral da sua operação hoje no VivaeHub."
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
                      {pt && <ContributionBadge status={pt.isContributor} size="xs" />}
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

          {/* Contribuintes vs não contribuintes */}
          <Card className="p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Contribuição</h3>
              <Heart className="h-4 w-4 text-success" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-3 w-3 text-success fill-current" /> Contribuintes
                  </span>
                  <span className="font-medium">{contribuintes}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-smooth"
                    style={{ width: `${contribPct}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {naoContribuintes} paciente(s) não contribui(em).{" "}
                <Link to="/app/associados" className="text-primary hover:underline">
                  Ver detalhes →
                </Link>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">Total arrecadado</div>
                <div className="text-xl font-semibold tabular-nums text-primary">
                  {totalRaised.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Resumo secundário */}
      <Card className="p-5 shadow-soft mt-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Pacientes</div>
              <div className="text-lg font-semibold">{store.patients.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Profissionais</div>
              <div className="text-lg font-semibold">{store.professionals.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Consultas totais</div>
              <div className="text-lg font-semibold">{store.appointments.length}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
