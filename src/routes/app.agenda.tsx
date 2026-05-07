import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MessageCircle,
  Check,
  X,
  ConciergeBell,
  Phone,
  History,
  ArrowRight,
  CalendarOff,
  AlertTriangle,
} from "lucide-react";
import {
  addDays,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { FinancialBadge } from "@/components/financial-badge";
import { BlockScheduleDialog } from "@/components/block-schedule-dialog";
import { AgendaProInsights } from "@/components/pro-insights";

export const Route = createFileRoute("/app/agenda")({
  component: Agenda,
});

function Agenda() {
  const store = useStore();
  const [view, setView] = useState<"dia" | "semana">("dia");
  const [current, setCurrent] = useState<Date>(startOfDay(new Date()));
  const [proFilter, setProFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null);

  const days = useMemo(() => {
    if (view === "dia") return [current];
    const start = startOfWeek(current, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [view, current]);

  const visibleAppts = store.appointments.filter((a) => {
    if (proFilter !== "all" && a.professionalId !== proFilter) return false;
    if (areaFilter !== "all") {
      const pro = store.professionals.find((p) => p.id === a.professionalId);
      if (pro?.areaId !== areaFilter) return false;
    }
    if (
      store.session?.role === "profissional" &&
      store.session.professionalId &&
      a.professionalId !== store.session.professionalId
    ) {
      return false;
    }
    return true;
  });

  function shift(dir: number) {
    setCurrent((d) => addDays(d, dir * (view === "dia" ? 1 : 7)));
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Clique em um agendamento para ver paciente, histórico e status financeiro."
        action={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrent(startOfDay(new Date()))}
            >
              Hoje
            </Button>
            <BlockScheduleDialog
              defaultDate={current}
              professionalId={proFilter !== "all" ? proFilter : undefined}
              trigger={
                <Button variant="outline" size="sm">
                  <CalendarOff className="h-4 w-4 mr-1" /> Bloquear período
                </Button>
              }
            />
            <NewAppointmentDialog open={open} onOpenChange={setOpen} defaultDate={current} />
          </>
        }
      />

      <AgendaProInsights />

      <Card className="p-3 md:p-4 shadow-soft mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => shift(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 text-sm font-medium min-w-[200px] text-center">
              {view === "dia"
                ? format(current, "EEEE, dd 'de' MMMM", { locale: ptBR })
                : `${format(days[0], "dd MMM", { locale: ptBR })} – ${format(days[6], "dd MMM yyyy", { locale: ptBR })}`}
            </div>
            <Button variant="ghost" size="icon" onClick={() => shift(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {store.areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={proFilter} onValueChange={setProFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos profissionais</SelectItem>
                {store.professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-md border bg-muted/40 p-0.5">
              <button
                onClick={() => setView("dia")}
                className={
                  "px-3 py-1 text-xs rounded transition-smooth " +
                  (view === "dia"
                    ? "bg-background shadow-soft font-medium"
                    : "text-muted-foreground")
                }
              >
                Dia
              </button>
              <button
                onClick={() => setView("semana")}
                className={
                  "px-3 py-1 text-xs rounded transition-smooth " +
                  (view === "semana"
                    ? "bg-background shadow-soft font-medium"
                    : "text-muted-foreground")
                }
              >
                Semana
              </button>
            </div>
          </div>
        </div>
      </Card>

      <div className={view === "dia" ? "" : "grid grid-cols-1 md:grid-cols-7 gap-3"}>
        {days.map((day) => {
          const dayAppts = visibleAppts
            .filter((a) => isSameDay(new Date(a.date), day))
            .sort((a, b) => +new Date(a.date) - +new Date(b.date));

          const dayStart = startOfDay(day).getTime();
          const dayEnd = dayStart + 24 * 60 * 60_000;
          const dayBlocks = store.scheduleBlocks.filter((b) => {
            if (proFilter !== "all" && b.professionalId !== proFilter) return false;
            if (areaFilter !== "all") {
              const pro = store.professionals.find((p) => p.id === b.professionalId);
              if (pro?.areaId !== areaFilter) return false;
            }
            const bs = new Date(b.start).getTime();
            const be = new Date(b.end).getTime();
            return bs < dayEnd && be > dayStart;
          });

          return (
            <Card key={day.toISOString()} className="p-4 shadow-soft min-h-[300px]">
              <div className="flex items-center justify-between mb-3 pb-3 border-b">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {format(day, "EEEE", { locale: ptBR })}
                  </div>
                  <div className="text-lg font-semibold">
                    {format(day, "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                </div>
                <Badge variant="secondary">{dayAppts.length}</Badge>
              </div>

              {dayBlocks.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {dayBlocks.map((b) => {
                    const pro = store.professionals.find((p) => p.id === b.professionalId);
                    return (
                      <div
                        key={b.id}
                        className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-xs"
                      >
                        <CalendarOff className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-destructive">
                            {b.kind === "day"
                              ? "Dia bloqueado"
                              : b.kind === "range"
                                ? "Período de indisponibilidade"
                                : `Bloqueado ${format(new Date(b.start), "HH:mm")}–${format(new Date(b.end), "HH:mm")}`}
                          </div>
                          <div className="text-muted-foreground truncate">
                            {pro?.name} · {b.reason ?? "Indisponível"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            store.removeBlock(b.id);
                            toast.success("Bloqueio removido");
                          }}
                          className="text-muted-foreground hover:text-destructive transition-smooth"
                          title="Remover bloqueio"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {dayAppts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mb-2 opacity-40" />
                  <div className="text-xs">Sem consultas</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayAppts.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appointmentId={a.id}
                      onSelect={() => setSelectedAppt(a.id)}
                    />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <AppointmentDetailSheet
        appointmentId={selectedAppt}
        onClose={() => setSelectedAppt(null)}
      />
    </div>
  );
}

function AppointmentCard({
  appointmentId,
  onSelect,
}: {
  appointmentId: string;
  onSelect: () => void;
}) {
  const store = useStore();
  const a = store.appointments.find((x) => x.id === appointmentId);
  if (!a) return null;
  const pt = store.patients.find((p) => p.id === a.patientId);
  const pro = store.professionals.find((p) => p.id === a.professionalId);
  const checkedIn = store.reception.some((r) => r.appointmentId === a.id);
  const isContrib = pt?.isContributor ?? false;
  const affected = (a.notes ?? "").includes("[Afetada por indisponibilidade]");

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-lg border bg-card p-3 hover:shadow-soft hover:border-primary/40 transition-smooth"
    >
      <div className="flex items-start gap-3">
        <div className="text-sm font-semibold tabular-nums">
          {format(new Date(a.date), "HH:mm")}
        </div>
        <div className="h-full w-1 rounded-full self-stretch" style={{ background: pro?.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate flex items-center gap-1.5">
            {pt?.name}
            {isContrib && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-success"
                title="Contribuinte"
              />
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{pro?.name}</div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={
                a.status === "confirmado"
                  ? "border-success/40 text-success"
                  : a.status === "pendente"
                    ? "border-warning/40 text-warning"
                    : "border-destructive/40 text-destructive"
              }
            >
              {a.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{a.durationMin}min</span>
            {checkedIn && (
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px] py-0 h-4">
                <ConciergeBell className="h-2.5 w-2.5 mr-0.5" /> Check-in
              </Badge>
            )}
            {affected && (
              <Badge
                variant="outline"
                className="border-destructive/40 text-destructive text-[10px] py-0 h-4"
                title="Afetada por indisponibilidade do profissional"
              >
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Indisponível
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function AppointmentDetailSheet({
  appointmentId,
  onClose,
}: {
  appointmentId: string | null;
  onClose: () => void;
}) {
  const store = useStore();
  const a = appointmentId ? store.appointments.find((x) => x.id === appointmentId) : null;
  if (!a) {
    return (
      <Sheet open={false} onOpenChange={(v) => !v && onClose()}>
        <SheetContent />
      </Sheet>
    );
  }
  const pt = store.patients.find((p) => p.id === a.patientId);
  const pro = store.professionals.find((p) => p.id === a.professionalId);
  const area = store.areas.find((ar) => ar.id === pro?.areaId);
  const history = pt
    ? store.appointments
        .filter((x) => x.patientId === pt.id && x.id !== a.id)
        .sort((x, y) => +new Date(y.date) - +new Date(x.date))
        .slice(0, 4)
    : [];
  const checkedIn = store.reception.some((r) => r.appointmentId === a.id);

  return (
    <Sheet open={true} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Agendamento</SheetTitle>
          <div className="text-sm text-muted-foreground">
            {format(new Date(a.date), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </div>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Paciente */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground font-medium text-sm">
                {pt?.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{pt?.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {pt?.phone}
                </div>
                <div className="mt-2">
                  {pt && <FinancialBadge status={pt.isContributor} />}
                </div>
              </div>
            </div>
          </Card>

          {/* Profissional / área */}
          <div className="rounded-lg border p-3 bg-card">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Profissional
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: pro?.color }} />
              <div className="font-medium text-sm">{pro?.name}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {pro?.specialty} · {area?.name} · {a.modality ?? "presencial"}
            </div>
          </div>

          {/* Histórico rápido */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <History className="h-3 w-3" /> Últimos atendimentos
            </div>
            {history.length === 0 ? (
              <div className="text-xs text-muted-foreground py-3">
                Sem histórico anterior.
              </div>
            ) : (
              <div className="space-y-1.5">
                {history.map((h) => {
                  const hpro = store.professionals.find((p) => p.id === h.professionalId);
                  return (
                    <div key={h.id} className="flex items-center gap-2 text-xs">
                      <span className="tabular-nums text-muted-foreground">
                        {format(new Date(h.date), "dd/MM/yy")}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: hpro?.color }} />
                      <span className="flex-1 truncate">{hpro?.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {a.notes && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Observações
              </div>
              <div className="text-sm">{a.notes}</div>
            </div>
          )}

          {/* Ações */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                store.updateAppointmentStatus(a.id, "confirmado");
                toast.success("Consulta confirmada");
              }}
            >
              <Check className="h-3 w-3 mr-1" /> Confirmar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                store.sendReminder(a.id);
                toast.success("Lembrete enviado via WhatsApp");
              }}
            >
              <MessageCircle className="h-3 w-3 mr-1" /> Lembrete
            </Button>
            <Button
              size="sm"
              className="col-span-2 gradient-primary"
              disabled={checkedIn}
              onClick={() => {
                store.checkIn(a.id);
                toast.success("Check-in realizado · enviado para Recepção");
              }}
            >
              <ArrowRight className="h-3 w-3 mr-1" />{" "}
              {checkedIn ? "Já está na recepção" : "Marcar chegada (check-in)"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="col-span-2 text-destructive"
              onClick={() => {
                store.updateAppointmentStatus(a.id, "cancelado");
                toast.success("Consulta cancelada");
                onClose();
              }}
            >
              <X className="h-3 w-3 mr-1" /> Cancelar consulta
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NewAppointmentDialog({
  open,
  onOpenChange,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate: Date;
}) {
  const store = useStore();
  const [patientId, setPatientId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");
  const [modality, setModality] = useState<"presencial" | "online">("presencial");
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !professionalId) return;
    const iso = new Date(`${date}T${time}:00`).toISOString();
    store.addAppointment({
      patientId,
      professionalId,
      date: iso,
      durationMin: 45,
      status: "pendente",
      modality,
      notes,
    });
    toast.success("Consulta agendada — confirmação enviada via WhatsApp");
    onOpenChange(false);
    setPatientId("");
    setProfessionalId("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Novo agendamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {store.patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Profissional</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {store.professionals.map((p) => {
                  const area = store.areas.find((a) => a.id === p.areaId);
                  return (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {area?.name ?? p.specialty}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Modalidade</Label>
            <Select value={modality} onValueChange={(v) => setModality(v as "presencial" | "online")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="gradient-primary">
              Agendar e enviar confirmação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
