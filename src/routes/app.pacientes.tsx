import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Phone, CalendarDays, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

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
        description="Cadastro completo, prontuário e histórico de atendimentos."
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
        {filtered.map((p) => (
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
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {p.notes.length} anotação(ões)
              </span>
              <span className="text-primary font-medium">Ver prontuário →</span>
            </div>
          </Card>
        ))}
      </div>

      <PatientSheet
        patientId={selected}
        onClose={() => setSelected(null)}
      />
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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    store.addPatient({ name, phone, birthDate });
    toast.success("Paciente cadastrado");
    onOpenChange(false);
    setName("");
    setPhone("");
    setBirthDate("");
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
          <DialogFooter>
            <Button type="submit" className="gradient-primary">Cadastrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PatientSheet({
  patientId,
  onClose,
}: {
  patientId: string | null;
  onClose: () => void;
}) {
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

  return (
    <Sheet open={!!patientId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {patient && (
          <>
            <SheetHeader>
              <SheetTitle>{patient.name}</SheetTitle>
              <div className="text-sm text-muted-foreground">
                {patient.phone} · {format(new Date(patient.birthDate), "dd/MM/yyyy")}
              </div>
            </SheetHeader>

            <div className="mt-6">
              <h3 className="font-medium flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4" /> Prontuário
              </h3>

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

              <div className="space-y-3">
                {patient.notes.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    Nenhuma anotação ainda.
                  </div>
                ) : (
                  patient.notes.map((n) => {
                    const pro = store.professionals.find((x) => x.id === n.professionalId);
                    return (
                      <div key={n.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>{pro?.name}</span>
                          <span>{format(new Date(n.date), "dd MMM yyyy", { locale: ptBR })}</span>
                        </div>
                        <p className="text-sm">{n.content}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
