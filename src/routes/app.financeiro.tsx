import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { TrendingUp, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/app/financeiro")({
  component: Financeiro,
});

function Financeiro() {
  const store = useStore();
  const [period, setPeriod] = useState<"mes" | "todos">("mes");
  const [open, setOpen] = useState(false);
  const now = new Date();

  const filtered = store.finance.filter((e) =>
    period === "todos" ? true : new Date(e.date).getMonth() === now.getMonth(),
  );

  const recebido = filtered.filter((e) => e.status === "pago").reduce((s, e) => s + e.amount, 0);
  const pendente = filtered.filter((e) => e.status === "pendente").reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Acompanhe entradas, mensalidades e pendências."
        action={<NewEntryDialog open={open} onOpenChange={setOpen} />}
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-5 shadow-soft border-success/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Recebido</div>
              <div className="text-3xl font-semibold mt-2 text-success tabular-nums">
                {recebido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-soft border-warning/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Pendente</div>
              <div className="text-3xl font-semibold mt-2 text-warning tabular-nums">
                {pendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Movimentações</h3>
        <Select value={period} onValueChange={(v) => setPeriod(v as "mes" | "todos")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Mês atual</SelectItem>
            <SelectItem value="todos">Todos os períodos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Descrição</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-smooth">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {format(new Date(e.date), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 font-medium">{e.description}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{e.type}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    R$ {e.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {e.status === "pago" ? (
                      <Badge className="bg-success text-success-foreground">Pago</Badge>
                    ) : (
                      <Badge variant="outline" className="border-warning/40 text-warning">
                        Pendente
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma movimentação no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function NewEntryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const store = useStore();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<"mensalidade" | "consulta">("consulta");
  const [status, setStatus] = useState<"pago" | "pendente">("pago");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    store.addFinance({
      date: new Date().toISOString().slice(0, 10),
      description,
      amount,
      type,
      status,
    });
    toast.success("Lançamento registrado");
    onOpenChange(false);
    setDescription("");
    setAmount(0);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Novo lançamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="mensalidade">Mensalidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" className="gradient-primary">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
