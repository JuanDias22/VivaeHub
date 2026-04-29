import { useState, type ReactNode } from "react";
import { useStore } from "@/hooks/use-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { CalendarOff, Trash2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type Reason = "falta" | "ferias" | "licenca" | "outro";

const REASON_LABEL: Record<Reason, string> = {
  falta: "Falta",
  ferias: "Férias",
  licenca: "Licença",
  outro: "Outro",
};

export function BlockScheduleDialog({
  trigger,
  professionalId,
  defaultDate,
  lockProfessional = false,
}: {
  trigger: ReactNode;
  professionalId?: string;
  defaultDate?: Date;
  lockProfessional?: boolean;
}) {
  const store = useStore();
  const [open, setOpen] = useState(false);

  const initialPro =
    professionalId ?? store.activeProfessionalId ?? store.professionals[0]?.id ?? "";
  const baseDate = defaultDate ?? new Date();

  const [proId, setProId] = useState(initialPro);
  const [kind, setKind] = useState<"slot" | "day" | "range">("day");
  const [startDate, setStartDate] = useState(format(baseDate, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("08:00");
  const [endDate, setEndDate] = useState(format(addDays(baseDate, 1), "yyyy-MM-dd"));
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState<Reason>("ferias");
  const [note, setNote] = useState("");

  const blocks = proId ? store.getBlocksForProfessional(proId) : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!proId) {
      toast.error("Selecione um profissional");
      return;
    }
    let startIso: string;
    let endIso: string;
    if (kind === "slot") {
      startIso = new Date(`${startDate}T${startTime}:00`).toISOString();
      endIso = new Date(`${startDate}T${endTime}:00`).toISOString();
    } else if (kind === "day") {
      startIso = new Date(`${startDate}T00:00:00`).toISOString();
      endIso = new Date(`${startDate}T23:59:59`).toISOString();
    } else {
      startIso = new Date(`${startDate}T00:00:00`).toISOString();
      endIso = new Date(`${endDate}T23:59:59`).toISOString();
    }
    if (new Date(endIso) <= new Date(startIso)) {
      toast.error("Data/hora final deve ser depois da inicial");
      return;
    }
    const reasonText = note.trim()
      ? `${REASON_LABEL[reason]} — ${note.trim()}`
      : REASON_LABEL[reason];
    store.addBlock({
      professionalId: proId,
      kind,
      start: startIso,
      end: endIso,
      reason: reasonText,
    });

    // Marcar consultas existentes como afetadas
    const sMs = new Date(startIso).getTime();
    const eMs = new Date(endIso).getTime();
    const affected = store.appointments.filter(
      (a) =>
        a.professionalId === proId &&
        a.status !== "cancelado" &&
        new Date(a.date).getTime() < eMs &&
        new Date(a.date).getTime() + a.durationMin * 60_000 > sMs,
    );
    affected.forEach((a) => {
      const tag = "[Afetada por indisponibilidade]";
      const prevNotes = a.notes ?? "";
      if (!prevNotes.includes(tag)) {
        store.updateAppointmentNotes(a.id, `${tag} ${prevNotes}`.trim());
      }
    });

    toast.success(
      affected.length > 0
        ? `Período bloqueado · ${affected.length} consulta(s) marcadas como afetadas`
        : "Período bloqueado",
    );
    setNote("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-destructive" />
            Bloquear agenda
          </DialogTitle>
          <DialogDescription>
            Indisponibilidade do profissional. Diferente de cancelar consulta — controla a
            agenda inteira.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {!lockProfessional && (
            <div className="space-y-1.5">
              <Label>Profissional</Label>
              <Select value={proId} onValueChange={setProId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {store.professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slot">Horário específico</SelectItem>
                <SelectItem value="day">Dia inteiro</SelectItem>
                <SelectItem value="range">Férias / intervalo de datas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {kind === "slot" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-3">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {kind === "day" && (
            <div className="space-y-1.5">
              <Label>Dia</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          )}

          {kind === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as Reason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="falta">Falta</SelectItem>
                <SelectItem value="ferias">Férias</SelectItem>
                <SelectItem value="licenca">Licença</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Observação (opcional)</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: viagem internacional"
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="gradient-primary">
              Bloquear período
            </Button>
          </DialogFooter>
        </form>

        {blocks.length > 0 && (
          <div className="border-t pt-3 mt-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Bloqueios atuais
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] py-0 h-4">
                        {b.kind === "slot" ? "Horário" : b.kind === "day" ? "Dia" : "Período"}
                      </Badge>
                      <span className="font-medium truncate">{b.reason ?? "—"}</span>
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      {format(new Date(b.start), "dd/MM HH:mm", { locale: ptBR })} →{" "}
                      {format(new Date(b.end), "dd/MM HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      store.removeBlock(b.id);
                      toast.success("Bloqueio removido");
                    }}
                    className="text-muted-foreground hover:text-destructive transition-smooth"
                    title="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}