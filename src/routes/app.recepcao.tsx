import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ConciergeBell,
  Phone,
  Clock,
  Stethoscope,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { FinancialBadge } from "@/components/financial-badge";

export const Route = createFileRoute("/app/recepcao")({
  component: Recepcao,
});

function Recepcao() {
  const store = useStore();
  const today = new Date();

  const todayAppts = store.appointments
    .filter((a) => isSameDay(new Date(a.date), today) && a.status !== "cancelado")
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const groups = {
    aguardando: [] as typeof todayAppts,
    em_atendimento: [] as typeof todayAppts,
    finalizado: [] as typeof todayAppts,
    naoChegou: [] as typeof todayAppts,
  };

  for (const a of todayAppts) {
    const r = store.reception.find((x) => x.appointmentId === a.id);
    if (!r) groups.naoChegou.push(a);
    else if (r.status === "aguardando") groups.aguardando.push(a);
    else if (r.status === "em_atendimento") groups.em_atendimento.push(a);
    else groups.finalizado.push(a);
  }

  return (
    <div>
      <PageHeader
        title="Recepção"
        description={`Fila de espera de hoje — ${format(today, "dd 'de' MMMM", { locale: ptBR })}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Programados" value={todayAppts.length} tone="muted" />
        <KpiCard label="Aguardando" value={groups.aguardando.length} tone="warning" />
        <KpiCard label="Em atendimento" value={groups.em_atendimento.length} tone="primary" />
        <KpiCard label="Finalizados" value={groups.finalizado.length} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Column
          title="Não chegaram"
          icon={<Clock className="h-4 w-4" />}
          appointments={groups.naoChegou}
          renderAction={(a) => (
            <Button
              size="sm"
              className="gradient-primary"
              onClick={() => {
                store.checkIn(a.id);
                toast.success("Check-in realizado");
              }}
            >
              <ConciergeBell className="h-3 w-3 mr-1" /> Marcar chegada
            </Button>
          )}
        />
        <Column
          title="Aguardando atendimento"
          icon={<ConciergeBell className="h-4 w-4 text-warning" />}
          appointments={groups.aguardando}
          renderAction={(a) => {
            const r = store.reception.find((x) => x.appointmentId === a.id);
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (r) {
                    store.callPatient(r.id);
                    toast.success("Paciente chamado");
                  }
                }}
              >
                <PlayCircle className="h-3 w-3 mr-1" /> Chamar
              </Button>
            );
          }}
        />
        <Column
          title="Em atendimento"
          icon={<Stethoscope className="h-4 w-4 text-primary" />}
          appointments={groups.em_atendimento}
          renderAction={(a) => {
            const r = store.reception.find((x) => x.appointmentId === a.id);
            return (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (r) {
                    store.finishReception(r.id);
                    toast.success("Atendimento finalizado");
                  }
                }}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" /> Finalizar
              </Button>
            );
          }}
        />
        <Column
          title="Finalizados"
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
          appointments={groups.finalizado}
          renderAction={() => null}
        />
      </div>
    </div>
  );
}

function Column({
  title,
  icon,
  appointments,
  renderAction,
}: {
  title: string;
  icon: React.ReactNode;
  appointments: ReturnType<typeof useStore>["appointments"];
  renderAction: (a: ReturnType<typeof useStore>["appointments"][number]) => React.ReactNode;
}) {
  const store = useStore();

  return (
    <Card className="p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3 pb-3 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          {icon} {title}
        </h3>
        <Badge variant="secondary">{appointments.length}</Badge>
      </div>
      {appointments.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">Vazio</div>
      ) : (
        <div className="space-y-2">
          {appointments.map((a) => {
            const pt = store.patients.find((p) => p.id === a.patientId);
            const pro = store.professionals.find((p) => p.id === a.professionalId);
            const area = store.areas.find((ar) => ar.id === pro?.areaId);
            return (
              <div
                key={a.id}
                className="rounded-lg border bg-card p-3 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="text-sm font-semibold tabular-nums w-12">
                  {format(new Date(a.date), "HH:mm")}
                </div>
                <div className="h-8 w-1 rounded-full hidden sm:block" style={{ background: pro?.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{pt?.name}</div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {pt?.phone}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] py-0 h-4">
                      {area?.name ?? pro?.specialty}
                    </Badge>
                    {pt && <FinancialBadge status={pt.isContributor} size="xs" />}
                  </div>
                </div>
                <div>{renderAction(a)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "primary" | "warning" | "success";
}) {
  const cls =
    tone === "primary"
      ? "gradient-primary text-primary-foreground"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : tone === "success"
          ? "bg-success/15 text-success"
          : "bg-muted text-muted-foreground";

  return (
    <Card className="p-4 shadow-soft flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cls}`}>
        <ConciergeBell className="h-5 w-5" />
      </div>
    </Card>
  );
}
