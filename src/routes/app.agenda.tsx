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

export const Route = createFileRoute("/app/agenda")({
  component: Agenda,
});

function Agenda() {
  const store = useStore();
  const [view, setView] = useState<"dia" | "semana">("dia");
  const [current, setCurrent] = useState<Date>(startOfDay(new Date()));
  const [proFilter, setProFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const days = useMemo(() => {
    if (view === "dia") return [current];
    const start = startOfWeek(current, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [view, current]);

  const visibleAppts = store.appointments.filter(
    (a) => proFilter === "all" || a.professionalId === proFilter,
  );

  function shift(dir: number) {
    setCurrent((d) => addDays(d, dir * (view === "dia" ? 1 : 7)));
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Organize consultas, envie confirmações e gerencie a rotina."
        action={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrent(startOfDay(new Date()))}
            >
              Hoje
            </Button>
            <NewAppointmentDialog open={open} onOpenChange={setOpen} defaultDate={current} />
          </>
        }
      />

      <Card className="p-3 md:p-4 shadow-soft mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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

          <div className="flex items-center gap-2">
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

              {dayAppts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mb-2 opacity-40" />
                  <div className="text-xs">Sem consultas</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayAppts.map((a) => (
                    <AppointmentCard key={a.id} appointmentId={a.id} />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentCard({ appointmentId }: { appointmentId: string }) {
  const store = useStore();
  const a = store.appointments.find((x) => x.id === appointmentId);
  if (!a) return null;
  const pt = store.patients.find((p) => p.id === a.patientId);
  const pro = store.professionals.find((p) => p.id === a.professionalId);

  return (
    <div className="group rounded-lg border bg-card p-3 hover:shadow-soft transition-smooth">
      <div className="flex items-start gap-3">
        <div className="text-sm font-semibold tabular-nums">
          {format(new Date(a.date), "HH:mm")}
        </div>
        <div className="h-full w-1 rounded-full self-stretch" style={{ background: pro?.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{pt?.name}</div>
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
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => {
            store.updateAppointmentStatus(a.id, "confirmado");
            toast.success("Consulta confirmada");
          }}
        >
          <Check className="h-3 w-3 mr-1" /> Confirmar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => {
            store.sendReminder(a.id);
            toast.success("Lembrete enviado via WhatsApp");
          }}
        >
          <MessageCircle className="h-3 w-3 mr-1" /> Lembrar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-destructive"
          onClick={() => {
            store.updateAppointmentStatus(a.id, "cancelado");
            toast.success("Consulta cancelada");
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
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
                {store.professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.specialty}
                  </SelectItem>
                ))}
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
