import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { store } from "@/lib/mock-store";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { hydrateFromSupabase } from "@/lib/supabase-sync";
import { isPlanActive } from "@/lib/plan";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
    if (!store.authed) {
      const ok = await hydrateFromSupabase();
      if (!ok) throw redirect({ to: "/login" });
    }
    if (!isPlanActive(store.clinic)) {
      throw redirect({ to: "/upgrade" });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
