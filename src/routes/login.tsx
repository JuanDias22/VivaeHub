import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { hydrateFromSupabase } from "@/lib/supabase-sync";
import {
  Activity,
  ArrowRight,
  Calendar,
  TrendingUp,
  Users,
  Bell,
  CheckCircle2,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { store } from "@/lib/mock-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — VivaeHub" },
      { name: "description", content: "Acesse sua clínica no VivaeHub." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    const ok = await hydrateFromSupabase();
    setLoading(false);
    if (!ok) {
      toast.error("Não foi possível carregar sua clínica.");
      return;
    }
    nav({ to: "/app" });
  }

  async function googleLogin() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (result.error) {
      toast.error("Falha ao entrar com Google.");
      return;
    }
    if (result.redirected) return;
    const ok = await hydrateFromSupabase();
    if (ok) nav({ to: "/app" });
  }

  // After OAuth callback hydrate and redirect.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const ok = await hydrateFromSupabase();
        if (ok) nav({ to: "/app" });
      }
    })();
  }, [nav]);

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-background">
      {/* LEFT — Animated Hero */}
      <HeroSide />

      {/* RIGHT — Login */}
      <div className="flex items-center justify-center p-6 md:p-10 relative">
        {/* soft ambient blob behind the card */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full gradient-hero opacity-20 blur-3xl" />
        </div>

        <div className="w-full max-w-sm relative">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">VivaeHub</span>
          </div>

          <div
            className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-elegant p-8 animate-fade-in"
            style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
          >
            <div className="hidden lg:flex items-center gap-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">VivaeHub</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse sua clínica para continuar.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-background/60 transition-smooth focus-visible:ring-2 focus-visible:ring-primary/40 hover:border-primary/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-background/60 transition-smooth focus-visible:ring-2 focus-visible:ring-primary/40 hover:border-primary/40"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl gradient-primary shadow-elegant transition-smooth hover:shadow-glow hover:scale-[1.01]"
              >
                {loading ? "Entrando..." : "Entrar"} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={googleLogin}
                className="w-full h-11 rounded-xl"
              >
                Entrar com Google
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/cadastro" className="text-primary font-medium hover:underline">
                Criar sua clínica
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HERO SIDE — animated, alive, premium
============================================================ */

function HeroSide() {
  return (
    <div className="hidden lg:flex relative overflow-hidden">
      {/* Deep blue gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.09 260) 0%, oklch(0.32 0.16 255) 45%, oklch(0.5 0.18 240) 100%)",
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full opacity-40 blur-3xl"
        style={{ background: "oklch(0.7 0.18 230)" }}
      />
      <div
        className="absolute -bottom-40 -right-20 w-[32rem] h-[32rem] rounded-full opacity-30 blur-3xl animate-pulse-slow"
        style={{ background: "oklch(0.75 0.16 200)" }}
      />

      {/* Network particles */}
      <NetworkParticles />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full text-white">
        {/* Brand */}
        <div className="flex items-center gap-2 animate-fade-in">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">VivaeHub</span>
        </div>

        {/* Headline + Dashboard mock */}
        <div className="flex-1 flex flex-col justify-center gap-10 py-10">
          <div
            className="max-w-lg animate-fade-in"
            style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/15 px-3 py-1 text-xs font-medium mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma para clínicas e associações
            </div>
            <h2 className="text-4xl xl:text-5xl font-semibold tracking-tight leading-[1.05]">
              Gerencie sua clínica em um só lugar
            </h2>
            <p className="mt-4 text-white/80 text-base xl:text-lg max-w-md">
              Agenda, pacientes e financeiro sem complicação.
            </p>
          </div>

          <DashboardMock />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>© VivaeHub</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Sistema online
          </div>
        </div>
      </div>

      {/* keyframes */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(0.3deg); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes grow-bar {
          from { transform: scaleY(0.2); }
          to { transform: scaleY(1); }
        }
        @keyframes draw-line {
          from { stroke-dashoffset: 400; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes notif-in {
          0% { opacity: 0; transform: translateY(8px) scale(0.96); }
          10% { opacity: 1; transform: translateY(0) scale(1); }
          85% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-6px) scale(0.98); }
        }
        @keyframes slot-fill {
          0% { width: 0%; opacity: 0.5; }
          100% { width: var(--w, 70%); opacity: 1; }
        }
        @keyframes particle-float {
          0%, 100% { transform: translate(0,0); opacity: 0.6; }
          50% { transform: translate(6px,-10px); opacity: 1; }
        }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 9s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ----- Floating dashboard composition ----- */

function DashboardMock() {
  return (
    <div className="relative h-[360px] xl:h-[400px] max-w-2xl">
      {/* Main schedule card */}
      <div
        className="absolute left-0 top-0 w-[340px] xl:w-[380px] rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-4 animate-float-slow"
        style={{
          animation: "fade-in 0.5s ease-out 200ms backwards, float-slow 7s ease-in-out infinite",
        }}
      >
        <ScheduleCard />
      </div>

      {/* Financial chart card */}
      <div
        className="absolute right-0 top-6 w-[260px] xl:w-[280px] rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-4 animate-float-slower"
        style={{
          animation: "fade-in 0.5s ease-out 380ms backwards, float-slower 9s ease-in-out infinite",
        }}
      >
        <ChartCard />
      </div>

      {/* Patient card */}
      <div
        className="absolute left-12 bottom-0 w-[260px] rounded-2xl bg-white/12 backdrop-blur-xl border border-white/20 shadow-2xl p-3.5 animate-float-slow"
        style={{
          animation: "fade-in 0.5s ease-out 560ms backwards, float-slow 8s ease-in-out infinite",
        }}
      >
        <PatientCard />
      </div>

      {/* Notification toast */}
      <div className="absolute right-4 bottom-10 w-[230px] rounded-xl bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl p-3">
        <NotificationToast />
      </div>
    </div>
  );
}

function ScheduleCard() {
  const slots = [
    { time: "09:00", name: "Marina Costa", role: "Nutricionista", w: 86, color: "bg-cyan-300" },
    { time: "10:30", name: "João Pereira", role: "Enfermeiro", w: 64, color: "bg-sky-300" },
    { time: "11:15", name: "Lia Almeida", role: "Podóloga", w: 78, color: "bg-blue-300" },
    { time: "14:00", name: "Rafael Souza", role: "Psicólogo", w: 52, color: "bg-indigo-300" },
  ];
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">Agenda de hoje</span>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-white/60">Ao vivo</span>
      </div>
      <div className="space-y-2">
        {slots.map((s, i) => (
          <div
            key={s.time}
            className="flex items-center gap-2 text-xs text-white/90"
            style={{
              animation: `fade-in 0.4s ease-out ${400 + i * 120}ms backwards`,
            }}
          >
            <span className="w-10 text-white/60 tabular-nums">{s.time}</span>
            <div className="flex-1 h-7 rounded-md bg-white/5 overflow-hidden relative">
              <div
                className={`h-full ${s.color} rounded-md flex items-center px-2 text-[11px] font-medium text-slate-900 whitespace-nowrap`}
                style={{
                  ["--w" as string]: `${s.w}%`,
                  animation: `slot-fill 0.9s ease-out ${600 + i * 150}ms backwards`,
                  width: `${s.w}%`,
                }}
              >
                {s.name} · {s.role}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ChartCard() {
  // simple animated line chart
  const points = "0,55 20,48 40,52 60,38 80,42 100,28 120,32 140,18 160,22 180,10";
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">Contribuições</span>
        </div>
        <span className="text-[10px] font-medium text-emerald-300">+12,4%</span>
      </div>
      <div className="text-xl font-semibold text-white tabular-nums">R$ 8.420</div>
      <div className="text-[10px] text-white/60 mb-2">últimos 30 dias</div>
      <svg viewBox="0 0 180 70" className="w-full h-16">
        <defs>
          <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.15 200)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="oklch(0.85 0.15 200)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={`${points} 180,70 0,70`}
          fill="url(#lineGrad)"
          stroke="none"
        />
        <polyline
          points={points}
          fill="none"
          stroke="oklch(0.92 0.1 200)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="400"
          style={{ animation: "draw-line 1.6s ease-out 700ms backwards" }}
        />
      </svg>
      <div className="flex gap-1 mt-1">
        {[40, 65, 50, 80, 70, 95, 85].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-white/30 origin-bottom"
            style={{
              height: `${h * 0.18}px`,
              animation: `grow-bar 0.7s ease-out ${800 + i * 80}ms backwards`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function PatientCard() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 flex items-center justify-center text-slate-900 font-semibold text-sm shadow-lg">
        AS
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white truncate">Ana Silveira</span>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/70">
          <Stethoscope className="h-2.5 w-2.5" />
          Nutricionista · Hoje 14:30
        </div>
      </div>
      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/15 text-white border border-white/20">
        Ativo
      </span>
    </div>
  );
}

function NotificationToast() {
  const items = [
    { icon: Users, text: "Novo paciente cadastrado", sub: "via portal público" },
    { icon: CheckCircle2, text: "Consulta confirmada", sub: "Marina Costa · 10:30" },
    { icon: Bell, text: "Contribuição recebida", sub: "R$ 80,00 · Pix" },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 3200);
    return () => clearInterval(t);
  }, [items.length]);
  const Item = items[i];
  const Icon = Item.icon;
  return (
    <div
      key={i}
      className="flex items-start gap-2.5"
      style={{ animation: "notif-in 3.2s ease-in-out infinite" }}
    >
      <div className="h-7 w-7 rounded-lg bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-200 flex-shrink-0">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-white truncate">{Item.text}</div>
        <div className="text-[10px] text-white/70 truncate">{Item.sub}</div>
      </div>
    </div>
  );
}

/* ----- Background network particles ----- */

function NetworkParticles() {
  const nodes = [
    { x: 12, y: 18 },
    { x: 28, y: 42 },
    { x: 8, y: 68 },
    { x: 38, y: 78 },
    { x: 52, y: 22 },
    { x: 68, y: 50 },
    { x: 84, y: 32 },
    { x: 92, y: 70 },
    { x: 60, y: 88 },
    { x: 22, y: 90 },
  ];
  const links: Array<[number, number]> = [
    [0, 1], [1, 2], [1, 4], [2, 3], [3, 5], [4, 5],
    [5, 6], [6, 7], [5, 8], [3, 9], [7, 8],
  ];
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-40"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      aria-hidden
    >
      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="white"
          strokeWidth="0.12"
          strokeOpacity="0.4"
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r="0.55"
          fill="white"
          style={{
            animation: `particle-float ${5 + (i % 4)}s ease-in-out ${i * 0.4}s infinite`,
            transformOrigin: `${n.x}px ${n.y}px`,
          }}
        />
      ))}
    </svg>
  );
}
