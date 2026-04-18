import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Phone, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PatientSheet } from "@/components/patient-sheet";
import { FinancialBadge } from "@/components/financial-badge";

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
        description="Núcleo do sistema: histórico, anamnese, exames e prontuário unificado."
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
          const fin = store.getPatientFinancialStatus(p.id);
          const apptCount = store.appointments.filter((a) => a.patientId === p.id).length;
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
                  <div className="mt-1.5">
                    <FinancialBadge status={fin} size="xs" />
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
  const [birthDate, setBirthDate] = useState("");
  const [memberId, setMemberId] = useState<string>("none");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    store.addPatient({
      name,
      phone,
      birthDate,
      memberId: memberId === "none" ? undefined : memberId,
    });
    toast.success("Paciente cadastrado");
    onOpenChange(false);
    setName("");
    setPhone("");
    setBirthDate("");
    setMemberId("none");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Novo paciente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
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
          <div className="space-y-1.5">
            <Label>Vincular a um associado (opcional)</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não associado</SelectItem>
                {store.members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" className="gradient-primary">Cadastrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
