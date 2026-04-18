import { createFileRoute, redirect } from "@tanstack/react-router";
import { store } from "@/lib/mock-store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (store.authed) throw redirect({ to: "/app" });
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
