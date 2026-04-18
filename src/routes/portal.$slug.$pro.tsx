import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalFlow } from "@/components/portal-flow";
import { useStore } from "@/hooks/use-store";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/portal/$slug/$pro")({
  component: PortalProfessional,
});

function PortalProfessional() {
  const { slug, pro } = Route.useParams();
  const store = useStore();
  const professional = store.findProfessionalBySlug(pro);

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
