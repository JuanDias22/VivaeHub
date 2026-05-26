import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { store as globalStore } from "@/lib/mock-store";
import { isPlanActive, trialDaysLeft } from "@/lib/plan";
import { supabase } from "@/integrations/supabase/client";
import { createCheckoutPreference } from "@/lib/serverFns/billing.functions.server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Check, X, Sparkles, Loader2, Crown, Zap, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/upgrade")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: UpgradePage,
});

type PlanId = "basic" | "plus" | "pro";

type PlanFeature = { label: string; included: boolean };

type PlanDef = {
  id: PlanId;
  name: string;
  price: string;
  suffix: string;
  tagline: string;
  badge?: string;
  badgeIcon?: typeof Sparkles;
  cta: string;
  highlight?: boolean;
  premium?: boolean;
  features: PlanFeature[];
};

const PLANS: PlanDef[] = [
  {
    id: "basic",
    name: "Basic",
    price: "R$ 99",
    suffix: "/mês",
    tagline: "Para começar com o essencial",
    cta: "Começar no Basic",
    features: [
      { label: "Agenda completa", included: true },
      { label: "Pacientes ilimitados", included: true },
      { label: "Recepção", included: true },
      { label: "WhatsApp básico", included: true },
      { label: "Até 5 funcionários", included: true },
      { label: "Financeiro completo", included: false },
      { label: "Anamneses ilimitadas", included: false },
      { label: "Relatórios avançados", included: false },
    ],
  },
  {
    id: "plus",
    name: "Plus",
    price: "R$ 159",
    suffix: "/mês",
    tagline: "Melhor custo-benefício",
    badge: "Mais escolhido",
    badgeIcon: Sparkles,
    cta: "Escolher Plus",
    highlight: true,
    features: [
      { label: "Tudo do Basic", included: true },
      { label: "Até 10 funcionários", included: true },
      { label: "Financeiro básico", included: true },
      { label: "Relatórios simples", included: true },
      { label: "Suporte padrão", included: true },
      { label: "Automação avançada", included: false },
      { label: "Recursos premium de gestão", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 279",
    suffix: "/mês",
    tagline: "Para clínicas em escala",
    badge: "Premium",
    badgeIcon: Crown,
    cta: "Ir para o Pro",
    premium: true,
    features: [
      { label: "Tudo do Plus", included: true },
      { label: "Funcionários ilimitados", included: true },
      { label: "Financeiro completo", included: true },
      { label: "Anamneses ilimitadas", included: true },
      { label: "Relatórios avançados", included: true },
      { label: "Automação completa", included: true },
      { label: "Suporte prioritário", included: true },
    ],
  },
];

function UpgradePage() {
  const store = useStore();
  const active = isPlanActive(store.clinic);
  const days = trialDaysLeft(store.clinic);
  const isTrial = (store.clinic.plan ?? "trial") === "trial";
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

 async function handleUpgrade(plan: PlanId) {
  try {
    setLoadingPlan(plan);

    const res = await fetch("/api/public/mercadopago-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data);

    window.location.href = data.url;
  } catch (err: any) {
    toast.error(err.message || "Erro ao iniciar pagamento");
  } finally {
    setLoadingPlan(null);
  }
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

      <main className="max-w-6xl mx-auto px-6 py-10">
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
          {isTrial && active && days > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>
                Você ainda tem <strong>{days} dia(s)</strong> de trial. Escolha seu plano para
                continuar usando o sistema sem interrupções.
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((p) => {
            const BadgeIcon = p.badgeIcon;
            const cardClass = p.highlight
              ? "border-primary border-2 shadow-glow md:scale-[1.04] md:-translate-y-1 z-10"
              : p.premium
              ? "border-2 border-purple-500/40"
              : "border";
            return (
              <Card
                key={p.id}
                className={`p-6 shadow-soft flex flex-col relative ${cardClass}`}
              >
                {p.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow ${
                      p.highlight
                        ? "gradient-primary text-primary-foreground"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                    {p.badge}
                  </div>
                )}
                <div className="mb-1">
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.tagline}</p>
                </div>
                <div className="mb-5 mt-3">
                  <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                  <span className="text-muted-foreground text-sm">{p.suffix}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li
                      key={f.label}
                      className={`flex items-start gap-2 text-sm ${
                        f.included ? "" : "text-muted-foreground"
                      }`}
                    >
                      {f.included ? (
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                      )}
                      <span>{f.label}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade(p.id)}
                  disabled={loadingPlan !== null}
                  className={`w-full ${
                    p.highlight
                      ? "gradient-primary"
                      : p.premium
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : ""
                  }`}
                  variant={p.highlight || p.premium ? "default" : "outline"}
                >
                  {loadingPlan === p.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecionando...
                    </>
                  ) : (
                    <>
                      {p.premium && <Zap className="h-4 w-4" />}
                      {p.cta}
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
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