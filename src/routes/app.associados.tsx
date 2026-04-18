import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/associados")({
  component: Associados,
});

function Associados() {
  const store = useStore();
  const [open, setOpen] = useState(false);

  const inadimplentes = store.members.filter((m) =>
    m.payments.some((p) => p.status === "pendente"),
  );

  return (
    <div>
      <PageHeader
        title="Associados"
        description="Controle de mensalidades e situação dos membros."
        action={<NewMemberDialog open={open} onOpenChange={setOpen} />}
      />

      <Tabs defaultValue="todos" className="w-full">
        <TabsList>
          <TabsTrigger value="todos">Todos ({store.members.length})</TabsTrigger>
          <TabsTrigger value="inadimplentes">
            Inadimplentes ({inadimplentes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-4">
          <MembersTable members={store.members} />
        </TabsContent>
        <TabsContent value="inadimplentes" className="mt-4">
          <MembersTable members={inadimplentes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MembersTable({ members }: { members: ReturnType<typeof useStore>["members"] }) {
  const store = useStore();

  if (members.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground shadow-soft">
        Nenhum associado nesta visualização.
      </Card>
    );
  }

  return (
    <Card className="shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Associado</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">CPF</th>
              <th className="text-left px-4 py-3 font-medium">Mensalidade</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const hasPending = m.payments.some((p) => p.status === "pendente");
              return (
                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-smooth">
                  <td className="px-4 py-3">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.phone}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground tabular-nums">
                    {m.cpf}
                  </td>
                  <td className="px-4 py-3 font-medium">R$ {m.monthlyFee.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {hasPending ? (
                      <Badge variant="outline" className="border-warning/40 text-warning">
                        <AlertCircle className="h-3 w-3 mr-1" /> Pendente
                      </Badge>
                    ) : (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Em dia
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        store.registerMonthlyPayment(m.id);
                        toast.success(`Pagamento de ${m.name} registrado`);
                      }}
                    >
                      Marcar pagamento
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function NewMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const store = useStore();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [fee, setFee] = useState(50);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    store.addMember({ name, cpf, phone, monthlyFee: fee });
    toast.success("Associado cadastrado");
    onOpenChange(false);
    setName("");
    setCpf("");
    setPhone("");
    setFee(50);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Novo associado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo associado</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mensalidade (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
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
