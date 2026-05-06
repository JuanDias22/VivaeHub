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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ContributionBadge } from "@/components/financial-badge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { formatDateOnly } from "@/lib/date-utils";
import {
  CONDITION_LABEL,
  DIABETES_TYPE_LABEL,
  type AnamnesisField,
  type AreaAnamnesis,
} from "@/lib/mock-store";
import { FileText, History, Phone, CalendarDays, Save, Pencil, Trash2 } from "lucide-react";

export function PatientSheet({
  patientId,
  onClose,
}: {
  patientId: string | null;
  onClose: () => void;
}) {
  const store = useStore();
  const patient = store.patients.find((p) => p.id === patientId);
  const responsible = patient?.professionalId
    ? store.professionals.find((p) => p.id === patient.professionalId)
    : null;
  const lastContrib = patient ? store.getLastContribution(patient.id) : undefined;

  const apptHistory = patient
    ? store.appointments
        .filter((a) => a.patientId === patient.id)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    : [];

  const [editOpen, setEditOpen] = useState(false);

  return (
    <Sheet open={!!patientId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {patient && (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <SheetTitle className="text-xl">{patient.name}</SheetTitle>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover paciente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação remove {patient.name} e todos os agendamentos vinculados. Não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            store.removePatient(patient.id);
                            toast.success("Paciente removido");
                            onClose();
                          }}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {patient.phone}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDateOnly(patient.birthDate, "dd/MM/yyyy")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ContributionBadge status={patient.isContributor} />
                {patient.isContributor && patient.contributionAmount && (
                  <span className="text-xs text-muted-foreground">
                    R$ {patient.contributionAmount.toFixed(2)}/mês
                  </span>
                )}
                {responsible && (
                  <span className="text-xs text-muted-foreground">
                    · Resp.: {responsible.name}
                  </span>
                )}
                {lastContrib && (
                  <span className="text-xs text-muted-foreground">
                    · Últ. contrib.: {formatDateOnly(lastContrib.date, "dd/MM/yyyy")}
                  </span>
                )}
              </div>
            </SheetHeader>

            <Tabs defaultValue="clinico" className="mt-6">
              <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full h-auto">
                <TabsTrigger value="clinico" className="text-xs">Clínico</TabsTrigger>
                {store.areas.map((a) => (
                  <TabsTrigger key={a.id} value={`area-${a.id}`} className="text-xs">
                    {a.name}
                  </TabsTrigger>
                ))}
                <TabsTrigger value="historico" className="text-xs">
                  <History className="h-3 w-3 mr-1" /> Histórico
                </TabsTrigger>
              </TabsList>

              {/* CLÍNICO — visível para todos, alimentado pelo cadastro APAD */}
              <TabsContent value="clinico" className="mt-4 space-y-4">
                <ClinicoView patientId={patient.id} />
              </TabsContent>

              {/* Uma aba por área */}
              {store.areas.map((a) => (
                <TabsContent key={a.id} value={`area-${a.id}`} className="mt-4 space-y-4">
                  <AreaPanel patientId={patient.id} areaId={a.id} />
                </TabsContent>
              ))}

              {/* HISTÓRICO */}
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
                                  {format(new Date(a.date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
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
            </Tabs>
            <EditPatientDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              patientId={patient.id}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function EditPatientDialog({
  open, onOpenChange, patientId,
}: { open: boolean; onOpenChange: (v: boolean) => void; patientId: string }) {
  const store = useStore();
  const pt = store.patients.find((p) => p.id === patientId);
  const [name, setName] = useState(pt?.name ?? "");
  const [phone, setPhone] = useState(pt?.phone ?? "");
  const [email, setEmail] = useState(pt?.email ?? "");
  const [birthDate, setBirthDate] = useState(pt?.birthDate ?? "");
  const [professionalId, setProfessionalId] = useState<string>(pt?.professionalId ?? "none");
  const [isContributor, setIsContributor] = useState(!!pt?.isContributor);

  if (!pt) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    store.updatePatient(patientId, {
      name,
      phone,
      email: email || undefined,
      birthDate,
      professionalId: professionalId === "none" ? undefined : professionalId,
      isContributor,
    });
    toast.success("Paciente atualizado");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v && pt) {
          setName(pt.name);
          setPhone(pt.phone);
          setEmail(pt.email ?? "");
          setBirthDate(pt.birthDate);
          setProfessionalId(pt.professionalId ?? "none");
          setIsContributor(!!pt.isContributor);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Data de nascimento</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail (opcional)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Profissional responsável</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
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
          <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/30">
            <Checkbox checked={isContributor} onCheckedChange={(v) => setIsContributor(!!v)} />
            <span className="text-sm">Paciente contribuinte</span>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClinicoView({ patientId }: { patientId: string }) {
  const store = useStore();
  const pt = store.patients.find((p) => p.id === patientId);
  if (!pt) return null;
  const { personal, health } = pt;
  const conds = health?.conditions
    ? (Object.entries(health.conditions) as Array<[keyof typeof CONDITION_LABEL, boolean]>)
        .filter(([, v]) => v)
        .map(([k]) => CONDITION_LABEL[k])
    : [];

  return (
    <>
      <div className="rounded-lg border p-4 bg-card space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Identificação</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="RG">{personal?.rg || "—"}</Field>
          <Field label="CPF">{personal?.cpf || "—"}</Field>
          <Field label="Profissão">{personal?.profession || "—"}</Field>
          <Field label="E-mail">{pt.email || "—"}</Field>
          <Field label="Tel. fixo">{personal?.landline || "—"}</Field>
          <Field label="Celular">{pt.phone}</Field>
        </div>
      </div>

      <div className="rounded-lg border p-4 bg-card space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Endereço</div>
        <div className="text-sm">
          {[personal?.street, personal?.number, personal?.complement].filter(Boolean).join(", ") || "—"}
          {personal?.district && <span className="text-muted-foreground"> · {personal.district}</span>}
          <div className="text-muted-foreground">
            {[personal?.city, personal?.state, personal?.cep].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 bg-card space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Saúde</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Tipo">
            {health?.diabetesType ? DIABETES_TYPE_LABEL[health.diabetesType] : "—"}
          </Field>
          <Field label="Diagnóstico">{health?.diagnosisYear || "—"}</Field>
          <Field label="Como conheceu" className="col-span-2">
            {health?.howKnewAssociation || "—"}
          </Field>
          <Field label="Medicamentos" className="col-span-2">
            {health?.medications || "—"}
          </Field>
        </div>
        {conds.length > 0 && (
          <div className="pt-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Condições</div>
            <div className="flex flex-wrap gap-1.5">
              {conds.map((c) => (
                <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {pt.exams.length > 0 && (
        <div className="rounded-lg border p-4 bg-card space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Exames anexados</div>
          <div className="space-y-1.5">
            {pt.exams.map((ex) => (
              <div key={ex.id} className="flex items-center gap-2 text-sm">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="flex-1 truncate">{ex.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {(ex.sizeKb / 1024).toFixed(1)}MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function AreaPanel({ patientId, areaId }: { patientId: string; areaId: string }) {
  const store = useStore();
  const area = store.areas.find((a) => a.id === areaId);
  const proInArea = store.professionals.find((p) => p.areaId === areaId);
  const template = proInArea?.anamnesisTemplate;
  const existing = store.getAreaAnamnesis(patientId, areaId);

  return (
    <>
      {/* Anamnese da área */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Anamnese</div>
            <div className="text-sm font-semibold">{area?.name}</div>
          </div>
          {existing && (
            <span className="text-xs text-muted-foreground">
              Preenchida em {format(new Date(existing.filledAt), "dd/MM/yyyy")}
            </span>
          )}
        </div>
        {!proInArea ? (
          <div className="text-xs text-muted-foreground">
            Atue como um profissional desta área para preencher/editar a anamnese.
          </div>
        ) : !template || template.fields.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            Você ainda não tem um modelo de anamnese. Configure em Profissionais → Modelo de anamnese.
          </div>
        ) : (
          <AnamneseForm
            patientId={patientId}
            areaId={areaId}
            professionalId={proInArea.id}
            fields={template.fields}
            existing={existing}
          />
        )}
      </div>

      {/* Anotações da área */}
      <NotesPanel patientId={patientId} areaId={areaId} canEdit={!!proInArea} professionalId={proInArea?.id} />
    </>
  );
}

function AnamneseForm({
  patientId, areaId, professionalId, fields, existing,
}: {
  patientId: string; areaId: string; professionalId: string;
  fields: AnamnesisField[]; existing?: AreaAnamnesis;
}) {
  const store = useStore();
  const [answers, setAnswers] = useState<Record<string, string | string[] | boolean>>(
    existing?.answers ?? {},
  );

  function setVal(id: string, v: string | string[] | boolean) {
    setAnswers((a) => ({ ...a, [id]: v }));
  }

  function save() {
    const anam: AreaAnamnesis = {
      areaId,
      professionalId,
      filledAt: new Date().toISOString(),
      answers,
    };
    store.setAreaAnamnesis(patientId, anam);
    toast.success("Anamnese salva");
  }

  return (
    <div className="space-y-3">
      {fields.map((f) => {
        const v = answers[f.id];
        return (
          <div key={f.id} className="space-y-1.5">
            <Label className="text-xs">{f.label}</Label>
            {f.type === "texto" && (
              <Input value={typeof v === "string" ? v : ""} onChange={(e) => setVal(f.id, e.target.value)} />
            )}
            {f.type === "textarea" && (
              <Textarea rows={3} value={typeof v === "string" ? v : ""} onChange={(e) => setVal(f.id, e.target.value)} />
            )}
            {f.type === "checkbox" && (
              <label className="flex items-center gap-2">
                <Checkbox checked={v === true} onCheckedChange={(c) => setVal(f.id, !!c)} />
                <span className="text-sm text-muted-foreground">Marcar</span>
              </label>
            )}
            {f.type === "sim_nao" && (
              <RadioGroup
                value={typeof v === "string" ? v : ""}
                onValueChange={(val) => setVal(f.id, val)}
                className="flex gap-3"
              >
                <label className="flex items-center gap-1.5 text-sm"><RadioGroupItem value="sim" /> Sim</label>
                <label className="flex items-center gap-1.5 text-sm"><RadioGroupItem value="nao" /> Não</label>
              </RadioGroup>
            )}
            {f.type === "multipla" && (
              <RadioGroup
                value={typeof v === "string" ? v : ""}
                onValueChange={(val) => setVal(f.id, val)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-1.5"
              >
                {(f.options ?? []).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value={opt} /> {opt}
                  </label>
                ))}
              </RadioGroup>
            )}
          </div>
        );
      })}
      <Button size="sm" onClick={save} className="gradient-primary">
        <Save className="h-3 w-3 mr-1" /> Salvar anamnese
      </Button>
    </div>
  );
}

function NotesPanel({
  patientId, areaId, canEdit, professionalId,
}: {
  patientId: string; areaId: string; canEdit: boolean; professionalId?: string;
}) {
  const store = useStore();
  const [content, setContent] = useState("");
  const patient = store.patients.find((p) => p.id === patientId);
  if (!patient) return null;

  const notes = patient.notes.filter((n) => n.areaId === areaId);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!professionalId || !content.trim()) return;
    store.addPatientNote(patient!.id, professionalId, areaId, content);
    setContent("");
    toast.success("Anotação adicionada");
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Anotações desta área</div>
      {canEdit ? (
        <form onSubmit={add} className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Anotação da consulta..."
            rows={3}
          />
          <Button type="submit" size="sm" className="gradient-primary">Adicionar</Button>
        </form>
      ) : (
        <div className="text-xs text-muted-foreground">
          Atue como um profissional desta área para adicionar anotações.
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-xs text-muted-foreground">Nenhuma anotação.</div>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => {
            const pro = store.professionals.find((p) => p.id === n.professionalId);
            return (
              <div key={n.id} className="p-3 rounded-lg border bg-background">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{pro?.name}</span>
                  <span>{format(new Date(n.date), "dd MMM yyyy", { locale: ptBR })}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{n.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground text-center py-8">{text}</div>;
}
