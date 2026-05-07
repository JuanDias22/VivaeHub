import { createFileRoute, redirect } from "@tanstack/react-router";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Heart, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CONTRIBUTION_AMOUNT, store as globalStore, type Patient } from "@/lib/mock-store";
import { ContributionBadge } from "@/components/financial-badge";
import { formatDateOnly } from "@/lib/date-utils";

export const Route = createFileRoute("/app/associados")({
  beforeLoad: () => {
    if (globalStore.session && globalStore.session.role === "profissional") {
      throw redirect({ to: "/app" });
    }
  },
  component: Contribuicoes,
});

function Contribuicoes() {
  const store = useStore();
  const [open, setOpen] = useState(false);

  const contribuintes = store.patients.filter((p) => p.isContributor);
  const naoContribuintes = store.patients.filter((p) => !p.isContributor);
  const totalArrecadado = store.getTotalRaised();
  const totalMesAtual = store.finance
    .filter(
      (e) =>
        e.type === "contribuicao" &&
        new Date(e.date).getMonth() === new Date().getMonth() &&
        new Date(e.date).getFullYear() === new Date().getFullYear(),
    )
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Contribuições"
        description="Todo paciente é associado. A contribuição é voluntária e ajuda a manter os atendimentos gratuitos."
        action={<RegisterContribDialog open={open} onOpenChange={setOpen} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          icon={<Heart className="h-5 w-5 fill-current" />}
          label="Contribuintes"
          value={contribuintes.length.toString()}
          hint={`${naoContribuintes.length} não contribuem`}
          tone="success"
        />
        <KpiCard
          icon={<Calendar className="h-5 w-5" />}
          label="Arrecadado no mês"
          value={totalMesAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          hint={format(new Date(), "MMMM yyyy")}
          tone="primary"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total arrecadado"
          value={totalArrecadado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          hint="Histórico completo"
          tone="primary"
        />
      </div>

      <Tabs defaultValue="contribuintes" className="w-full">
        <TabsList>
          <TabsTrigger value="contribuintes">
            Contribuintes ({contribuintes.length})
          </TabsTrigger>
          <TabsTrigger value="todos">
            Todos os pacientes ({store.patients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contribuintes" className="mt-4">
          <PatientsContribTable patients={contribuintes} />
        </TabsContent>
        <TabsContent value="todos" className="mt-4">
          <PatientsContribTable patients={store.patients} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PatientsContribTable({ patients }: { patients: Patient[] }) {
  const store = useStore();

  if (patients.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground shadow-soft">
        Nenhum paciente nesta visualização.
      </Card>
    );
  }

  return (
    <Card className="shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Paciente</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Valor mensal</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Última contribuição</th>
              <th className="text-right px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => {
              const last = store.getLastContribution(p.id);
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-smooth">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <ContributionBadge status={p.isContributor} />
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums">
                    {p.contributionAmount
                      ? `R$ ${p.contributionAmount.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground tabular-nums">
                    {last ? `${formatDateOnly(last.date, "dd/MM/yyyy")} · R$ ${last.amount.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const next = !p.isContributor;
                          store.setContributorStatus(p.id, next);
                          toast.success(next ? "Paciente marcado como contribuinte" : "Paciente removido dos contribuintes");
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          store.registerContribution(p.id);
                          toast.success(`Contribuição de ${p.name} registrada`);
                        }}
                      >
                        Registrar contribuição
                      </Button>
                    </div>
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

function KpiCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: "success" | "primary";
}) {
  const cls =
    tone === "primary"
      ? "gradient-primary text-primary-foreground shadow-glow"
      : "bg-success/15 text-success";
  return (
    <Card className="p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold mt-2 tabular-nums">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{hint}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cls}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function RegisterContribDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const store = useStore();
  const [patientId, setPatientId] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      toast.error("Selecione um paciente");
      return;
    }
    store.registerContribution(patientId);
    toast.success("Contribuição registrada");
    onOpenChange(false);
    setPatientId("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Registrar contribuição
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar contribuição</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {store.patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border bg-primary/5 border-primary/20 p-3 text-sm">
            Valor fixo da contribuição: <strong>R$ {CONTRIBUTION_AMOUNT},00/mês</strong>
          </div>
          <DialogFooter>
            <Button type="submit" className="gradient-primary">Registrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
