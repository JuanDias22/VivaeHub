import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FinancialBadge } from "@/components/financial-badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  ACTIVITY_LABEL,
  GOAL_LABEL,
} from "@/lib/mock-store";
import { FileText, ClipboardList, Activity, History, Phone, CalendarDays } from "lucide-react";

export function PatientSheet({
  patientId,
  onClose,
}: {
  patientId: string | null;
  onClose: () => void;
}) {
  const store = useStore();
  const patient = store.patients.find((p) => p.id === patientId);
  const finStatus = patientId ? store.getPatientFinancialStatus(patientId) : "nao_associado";
  const member = patient?.memberId ? store.members.find((m) => m.id === patient.memberId) : null;

  const apptHistory = patient
    ? store.appointments
        .filter((a) => a.patientId === patient.id)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    : [];

  return (
    <Sheet open={!!patientId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {patient && (
          <>
            <SheetHeader className="space-y-2">
              <SheetTitle className="text-xl">{patient.name}</SheetTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {patient.phone}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(patient.birthDate), "dd/MM/yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FinancialBadge status={finStatus} />
                {member && (
                  <span className="text-xs text-muted-foreground">
                    Associado: {member.name}
                  </span>
                )}
              </div>
            </SheetHeader>

            <Tabs defaultValue="historico" className="mt-6">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="historico" className="text-xs">
                  <History className="h-3 w-3 mr-1" /> Histórico
                </TabsTrigger>
                <TabsTrigger value="anamnese" className="text-xs">
                  <ClipboardList className="h-3 w-3 mr-1" /> Anamnese
                </TabsTrigger>
                <TabsTrigger value="exames" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" /> Exames
                </TabsTrigger>
                <TabsTrigger value="anotacoes" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" /> Anotações
                </TabsTrigger>
              </TabsList>

              {/* HISTÓRICO — linha do tempo */}
              <TabsContent value="historico" className="mt-4">
                {apptHistory.length === 0 ? (
                  <EmptyState text="Nenhum atendimento registrado." />
                ) : (
                  <div className="relative pl-5">
                    <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
                    <div className="space-y-4">
                      {apptHistory.map((a) => {
                        const pro = store.professionals.find((p) => p.id === a.professionalId);
                        const area = store.areas.find((ar) => ar.id === pro?.areaId);
                        const past = new Date(a.date) < new Date();
                        return (
                          <div key={a.id} className="relative">
                            <div
                              className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background"
                              style={{ background: pro?.color }}
                            />
                            <div className="rounded-lg border bg-card p-3">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(a.date), "dd MMM yyyy 'às' HH:mm", {
                                    locale: ptBR,
                                  })}
                                </div>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {past ? "Realizada" : "Agendada"}
                                </span>
                              </div>
                              <div className="text-sm font-medium">{pro?.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {area?.name} · {a.modality ?? "presencial"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ANAMNESE */}
              <TabsContent value="anamnese" className="mt-4">
                {!patient.anamnesis ? (
                  <EmptyState text="Anamnese ainda não preenchida. O paciente pode preencher pelo Portal do Paciente." />
                ) : (
                  <div className="space-y-3 text-sm">
                    <Field label="Preenchida em">
                      {format(new Date(patient.anamnesis.filledAt), "dd/MM/yyyy")}
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Idade">{patient.anamnesis.age ?? "—"}</Field>
                      <Field label="Sexo">{patient.anamnesis.sex ?? "—"}</Field>
                    </div>
                    <Field label="Objetivo">
                      {patient.anamnesis.goal ? GOAL_LABEL[patient.anamnesis.goal] : "—"}
                    </Field>
                    <Field label="Atividade física">
                      {patient.anamnesis.activity
                        ? ACTIVITY_LABEL[patient.anamnesis.activity]
                        : "—"}
                    </Field>
                    <Field label="Doenças">{patient.anamnesis.diseases || "—"}</Field>
                    <Field label="Alergias">{patient.anamnesis.allergies || "—"}</Field>
                    <Field label="Medicamentos">{patient.anamnesis.medications || "—"}</Field>
                    <Field label="Cirurgias">{patient.anamnesis.surgeries || "—"}</Field>
                    <Field label="Hábitos alimentares">
                      {patient.anamnesis.eatingHabits || "—"}
                    </Field>
                    <Field label="Avaliação física desejada">
                      {patient.anamnesis.evaluation === "dobras"
                        ? "Dobras cutâneas"
                        : patient.anamnesis.evaluation === "bioimpedancia"
                          ? "Bioimpedância"
                          : "—"}
                    </Field>
                  </div>
                )}
              </TabsContent>

              {/* EXAMES */}
              <TabsContent value="exames" className="mt-4">
                {patient.exams.length === 0 ? (
                  <EmptyState text="Nenhum exame anexado." />
                ) : (
                  <div className="space-y-2">
                    {patient.exams.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{ex.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(ex.sizeKb / 1024).toFixed(2)} MB ·{" "}
                            {format(new Date(ex.uploadedAt), "dd/MM/yyyy")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ANOTAÇÕES */}
              <TabsContent value="anotacoes" className="mt-4">
                <NotesPanel patientId={patient.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function NotesPanel({ patientId }: { patientId: string }) {
  const store = useStore();
  const [content, setContent] = useState("");
  const [proId, setProId] = useState("");
  const patient = store.patients.find((p) => p.id === patientId);

  function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!patient || !proId || !content.trim()) return;
    store.addPatientNote(patient.id, proId, content);
    setContent("");
    toast.success("Anotação adicionada ao prontuário");
  }
  if (!patient) return null;

  return (
    <>
      <form onSubmit={addNote} className="space-y-3 p-3 rounded-lg border bg-muted/30 mb-4">
        <Select value={proId} onValueChange={setProId}>
          <SelectTrigger>
            <SelectValue placeholder="Profissional responsável" />
          </SelectTrigger>
          <SelectContent>
            {store.professionals.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Anotações da consulta..."
          rows={3}
        />
        <Button type="submit" size="sm" className="gradient-primary w-full">
          Adicionar ao prontuário
        </Button>
      </form>

      {patient.notes.length === 0 ? (
        <EmptyState text="Nenhuma anotação ainda." />
      ) : (
        <div className="space-y-3">
          {patient.notes.map((n) => {
            const pro = store.professionals.find((x) => x.id === n.professionalId);
            return (
              <div key={n.id} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{pro?.name}</span>
                  <span>{format(new Date(n.date), "dd MMM yyyy", { locale: ptBR })}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{n.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground text-center py-8">{text}</div>;
}
