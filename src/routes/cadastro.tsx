import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { hydrateFromSupabase } from "@/lib/supabase-sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — VivaeHub" },
      { name: "description", content: "Crie a conta da sua clínica em segundos." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/login",
        data: { clinic_name: clinicName },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    // Try immediate session (auto-confirm or already-confirmed)
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session) {
      const ok = await hydrateFromSupabase();
      setLoading(false);
      if (ok) {
        nav({ to: "/app" });
        return;
      }
    }
    setLoading(false);
    toast.success("Conta criada! Verifique seu e-mail para confirmar e depois entrar.");
    nav({ to: "/login" });
  }

  async function googleSignup() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/login",
      },
    })

    if (error) {
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">VivaeHub</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Crie sua clínica</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sua conta tem dados isolados — totalmente seus.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="clinic">Nome da clínica ou associação</Label>
            <Input
              id="clinic"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Ex.: Associação Vivae"
              required
            />
          </div>
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
              minLength={6}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-primary shadow-soft">
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>

        <div className="mt-3">
          <Button type="button" variant="outline" onClick={googleSignup} className="w-full">
            Continuar com Google
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
