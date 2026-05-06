import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { store } from "@/lib/mock-store";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { hydrateFromSupabase } from "@/lib/supabase-sync";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
    if (!store.authed) {
      const ok = await hydrateFromSupabase();
      if (!ok) throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
