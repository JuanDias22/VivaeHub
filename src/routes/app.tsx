import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { store } from "@/lib/mock-store";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (!store.authed) throw redirect({ to: "/login" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
