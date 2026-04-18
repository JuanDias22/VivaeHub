import { createFileRoute } from "@tanstack/react-router";
import { PortalFlow } from "@/components/portal-flow";

export const Route = createFileRoute("/portal/$slug")({
  component: PortalGeneral,
});

function PortalGeneral() {
  const { slug } = Route.useParams();
  return <PortalFlow clinicSlug={slug} />;
}
