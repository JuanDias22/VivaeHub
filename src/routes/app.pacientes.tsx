import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Phone, CalendarDays, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PatientSheet } from "@/components/patient-sheet";
import { ContributionBadge } from "@/components/financial-badge";
import {
  CONTRIBUTION_AMOUNT,
  CONTRIBUTION_TEXT,
  LGPD_TEXT,
} from "@/lib/mock-store";

export const Route = createFileRoute("/app/pacientes")({
  component: Pacientes,
});

function Pacientes() {
  const store = useStore();
  const [openNew, setOpenNew] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = store.patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Pacientes"
        description="Todo paciente é associado. Histórico, anamnese, exames e prontuário unificado."
        action={<NewPatientDialog open={openNew} onOpenChange={setOpenNew} />}
      />

      <div className="mb-4">
        <Input
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => {
          const apptCount = store.appointments.filter((a) => a.patientId === p.id).length;
          const responsible = p.professionalId
            ? store.professionals.find((pr) => pr.id === p.professionalId)
            : null;
          return (
            <Card
              key={p.id}
              className="p-4 shadow-soft hover:shadow-elegant transition-smooth cursor-pointer"
              onClick={() => setSelected(p.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground font-medium text-sm shrink-0">
                  {p.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {p.phone}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <CalendarDays className="h-3 w-3" />{" "}
                    {format(new Date(p.birthDate), "dd/MM/yyyy")}
                  </div>
                  {responsible && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                      <Stethoscope className="h-3 w-3" /> {responsible.name}
                    </div>
                  )}
                  <div className="mt-1.5">
                    <ContributionBadge status={p.isContributor} size="xs" />
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {apptCount} atendimento(s) · {p.notes.length} anotação(ões)
                </span>
                <span className="text-primary font-medium">Ver prontuário →</span>
              </div>
            </Card>
          );
        })}
      </div>

      <PatientSheet patientId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function NewPatientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const store = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [professionalId, setProfessionalId] = useState<string>("none");
  const [isContributor, setIsContributor] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!lgpdConsent) {
      toast.error("Aceite o termo de uso de dados (LGPD)");
      return;
    }
    store.addPatient({
      name,
      phone,
      email: email || undefined,
      birthDate,
      professionalId: professionalId === "none" ? undefined : professionalId,
      isContributor,
      contributionAmount: isContributor ? CONTRIBUTION_AMOUNT : undefined,
      lgptConsent: lgpdConsent,
    });
    toast.success("Paciente cadastrado · associado automaticamente");
    onOpenChange(false);
    setName("");
    setPhone("");
    setEmail("");
    setBirthDate("");
    setProfessionalId("none");
    setIsContributor(false);
    setLgpdConsent(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Novo paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo paciente</DialogTitle>
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

          <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30">
            <Checkbox checked={lgpdConsent} onCheckedChange={(v) => setLgpdConsent(!!v)} />
            <div className="text-xs leading-relaxed">
              <strong>LGPD *</strong>
              <div className="text-muted-foreground mt-0.5">{LGPD_TEXT}</div>
            </div>
          </label>
          <label className="flex items-start gap-3 rounded-lg border bg-primary/5 border-primary/20 p-3 cursor-pointer hover:bg-primary/10">
            <Checkbox checked={isContributor} onCheckedChange={(v) => setIsContributor(!!v)} />
            <div className="text-xs leading-relaxed text-muted-foreground">
              {CONTRIBUTION_TEXT}
            </div>
          </label>

          <DialogFooter>
            <Button type="submit" className="gradient-primary">Cadastrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
