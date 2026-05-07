import { createFileRoute, redirect } from "@tanstack/react-router";
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
import { TrendingUp, Heart, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { store as globalStore } from "@/lib/mock-store";
import { FinanceProInsights } from "@/components/pro-insights";

export const Route = createFileRoute("/app/financeiro")({
  beforeLoad: () => {
    if (globalStore.session && globalStore.session.role === "profissional") {
      globalStore.denyAccess("Financeiro");
      throw redirect({ to: "/app" });
    }
  },
  component: Financeiro,
});

function Financeiro() {
  const store = useStore();
  const [period, setPeriod] = useState<"mes" | "todos">("mes");
  const [open, setOpen] = useState(false);
  const now = new Date();

  const filtered = store.finance.filter((e) =>
    period === "todos"
      ? true
      : new Date(e.date).getMonth() === now.getMonth() &&
        new Date(e.date).getFullYear() === now.getFullYear(),
  );

  const totalPeriodo = filtered.reduce((s, e) => s + e.amount, 0);
  const contribuicoesPeriodo = filtered
    .filter((e) => e.type === "contribuicao")
    .reduce((s, e) => s + e.amount, 0);
  const totalArrecadado = store.getTotalRaised();

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Histórico de contribuições e movimentações financeiras."
        action={<NewEntryDialog open={open} onOpenChange={setOpen} />}
      />

      <FinanceProInsights />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 shadow-soft border-success/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Contribuições no período
              </div>
              <div className="text-3xl font-semibold mt-2 text-success tabular-nums">
                {contribuicoesPeriodo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15 text-success">
              <Heart className="h-5 w-5 fill-current" />
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-soft border-primary/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Total no período
              </div>
              <div className="text-3xl font-semibold mt-2 text-primary tabular-nums">
                {totalPeriodo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-primary-foreground shadow-glow">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Total arrecadado
              </div>
              <div className="text-3xl font-semibold mt-2 tabular-nums">
                {totalArrecadado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <TrendingUp className="h-5 w-5" />
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-smooth">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {format(new Date(e.date), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 font-medium">{e.description}</td>
                  <td className="px-4 py-3">
                    {e.type === "contribuicao" ? (
                      <Badge className="bg-success text-success-foreground">
                        <Heart className="h-3 w-3 mr-1 fill-current" /> Contribuição
                      </Badge>
                    ) : e.type === "consulta" ? (
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        Consulta
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground capitalize">
                        {e.type}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    R$ {e.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
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
  const [type, setType] = useState<"contribuicao" | "consulta" | "outro">("contribuicao");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    store.addFinance({
      date: new Date().toISOString().slice(0, 10),
      description,
      amount,
      type,
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
                  <SelectItem value="contribuicao">Contribuição</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="gradient-primary">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
