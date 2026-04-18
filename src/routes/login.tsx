import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, ArrowRight } from "lucide-react";
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
  const [email, setEmail] = useState("demo@vivaehub.com");
  const [password, setPassword] = useState("demo123");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    store.login(email, password);
    nav({ to: "/app" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">VivaeHub</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-semibold tracking-tight leading-tight">
            A plataforma da sua associação de saúde.
          </h2>
          <p className="mt-4 text-primary-foreground/85 text-base">
            Agenda, recepção, prontuário, contribuições e WhatsApp — tudo em um só lugar
            para clínicas e associações com atendimentos gratuitos.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/70">© VivaeHub</div>
        <div className="absolute -right-32 -bottom-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-10 top-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
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
              />
            </div>
            <Button type="submit" className="w-full gradient-primary shadow-soft">
              Entrar <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/cadastro" className="text-primary font-medium hover:underline">
              Crie sua clínica
            </Link>
          </div>

          <div className="mt-8 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Demo: qualquer e-mail e senha funcionam.
          </div>
        </div>
      </div>
    </div>
  );
}
