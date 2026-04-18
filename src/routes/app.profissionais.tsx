import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { isSameDay } from "date-fns";

export const Route = createFileRoute("/app/profissionais")({
  component: Profissionais,
});

function Profissionais() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const today = new Date();

  return (
    <div>
      <PageHeader
        title="Profissionais"
        description="Cadastro e visão por agenda de cada profissional."
        action={<NewProDialog open={open} onOpenChange={setOpen} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {store.professionals.map((p) => {
          const todayCount = store.appointments.filter(
            (a) => a.professionalId === p.id && isSameDay(new Date(a.date), today),
          ).length;
          const total = store.appointments.filter((a) => a.professionalId === p.id).length;
          return (
            <Card key={p.id} className="p-5 shadow-soft hover:shadow-elegant transition-smooth">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white font-medium"
                  style={{ background: p.color }}
                >
                  {p.name.split(" ").slice(-2).map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.specialty}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Hoje</div>
                  <div className="font-semibold">{todayCount}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-semibold">{total}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function NewProDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const store = useStore();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    store.addProfessional({ name, specialty });
    toast.success("Profissional cadastrado");
    onOpenChange(false);
    setName("");
    setSpecialty("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Novo profissional
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo profissional</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Especialidade</Label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" className="gradient-primary">Cadastrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
