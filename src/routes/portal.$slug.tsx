import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalFlow } from "@/components/portal-flow";
import { hydratePortalBySlug } from "@/lib/supabase-sync";

export const Route = createFileRoute("/portal/$slug")({
  component: PortalGeneral,
});

function PortalGeneral() {
  const { slug } = Route.useParams();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydratePortalBySlug(slug).finally(() => setReady(true));
  }, [slug]);
  if (!ready) return null;
  return <PortalFlow clinicSlug={slug} />;
}
