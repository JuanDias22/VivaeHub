import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalFlow } from "@/components/portal-flow";
import { useStore } from "@/hooks/use-store";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { hydratePortalBySlug } from "@/lib/supabase-sync";

export const Route = createFileRoute("/portal/$slug/$pro")({
  component: PortalProfessional,
});

function PortalProfessional() {
  const { slug, pro } = Route.useParams();
  const store = useStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydratePortalBySlug(slug).finally(() => setReady(true));
  }, [slug]);

  if (!ready) return null;

  // Match by slug exactly, then case-insensitive name fallback.
  const target = pro.toLowerCase();
  const professional =
    store.professionals.find((p) => p.slug === target) ??
    store.professionals.find(
      (p) => p.slug?.toLowerCase() === target ||
        p.name.toLowerCase().replace(/\s+/g, "-") === target,
    );

  if (!professional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center shadow-elegant">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Profissional não encontrado</h1>
          <p className="text-sm text-muted-foreground mb-6">
            O link <code>/portal/{slug}/{pro}</code> não corresponde a nenhum profissional.
          </p>
          <Link
            to="/portal/$slug"
            params={{ slug }}
            className="inline-flex items-center justify-center gap-2 rounded-md gradient-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-soft"
          >
            Ir ao portal geral
          </Link>
        </Card>
      </div>
    );
  }

  return <PortalFlow clinicSlug={slug} fixedProfessionalId={professional.id} />;
}
