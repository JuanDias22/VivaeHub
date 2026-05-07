import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useStore } from "@/hooks/use-store";
import { store as globalStore } from "@/lib/mock-store";
import { isPlanActive, trialDaysLeft } from "@/lib/plan";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/upgrade")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: UpgradePage,
});

const PLANS = [
  {
    id: "basic" as const,
    name: "Basic",
    price: "R$ 99",
    suffix: "/mês",
    features: ["Agenda completa", "Pacientes ilimitados", "Recepção", "WhatsApp básico"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "R$ 249",
    suffix: "/mês",
    features: [
      "Tudo do Basic",
      "Profissionais ilimitados",
      "Financeiro completo",
      "Anamneses ilimitadas",
      "Suporte prioritário",
    ],
    highlight: true,
  },
];

function UpgradePage() {
  const store = useStore();
  const active = isPlanActive(store.clinic);
  const days = trialDaysLeft(store.clinic);

  function handleUpgrade(plan: "basic" | "pro") {
    toast.info(`Fluxo de pagamento (${plan}) em breve. Entre em contato com o suporte.`);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{store.clinic.name}</div>
            <div className="text-xs text-muted-foreground">VivaeHub · Planos</div>
          </div>
          <button
            onClick={() => {
              void supabase.auth.signOut().finally(() => {
                globalStore.logout();
                window.location.href = "/login";
              });
            }}
            className="text-xs text-muted-foreground hover:underline"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">
            <Sparkles className="h-3 w-3 mr-1" />
            {active
              ? `Plano atual: ${store.clinic.plan ?? "trial"}`
              : store.clinic.plan === "trial"
              ? "Seu período de avaliação expirou"
              : "Assinatura inativa"}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Escolha seu plano</h1>
          <p className="text-muted-foreground mt-2">
            {active && days > 0
              ? `Você ainda tem ${days} dia(s) de trial. Faça upgrade para garantir continuidade.`
              : "Para continuar usando o VivaeHub, escolha um plano abaixo."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {PLANS.map((p) => (
            <Card
              key={p.id}
              className={`p-6 shadow-soft ${p.highlight ? "border-primary border-2 shadow-glow" : ""}`}
            >
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-xl font-semibold">{p.name}</h3>
                {p.highlight && <Badge className="gradient-primary">Recomendado</Badge>}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="text-muted-foreground text-sm">{p.suffix}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleUpgrade(p.id)}
                className={`w-full ${p.highlight ? "gradient-primary" : ""}`}
                variant={p.highlight ? "default" : "outline"}
              >
                Fazer upgrade
              </Button>
            </Card>
          ))}
        </div>

        {active && (
          <div className="text-center mt-8">
            <Link to="/app" className="text-sm text-primary hover:underline">
              Voltar ao sistema
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}