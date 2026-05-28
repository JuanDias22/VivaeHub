import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type MPWebhookPayload = {
  type?: string;
  topic?: string;
  data?: { id?: string };
  resource?: string;
};

type MPPayment = {
  status?: string;
  external_reference?: string;
  metadata?: {
    clinic_id?: string;
    plan?: "basic" | "plus" | "pro";
  };
};

export const Route = createFileRoute(
  "/api/public/mercadopago-webhook"
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;

        if (!token) {
          return new Response("MP token missing", { status: 500 });
        }

        let payload: MPWebhookPayload | null = null;

        try {
          payload = await request.json();
        } catch {
          payload = null;
        }

        const url = new URL(request.url);

        const type =
          payload?.type ||
          payload?.topic ||
          url.searchParams.get("type") ||
          url.searchParams.get("topic");

        const paymentId =
          payload?.data?.id ||
          payload?.resource ||
          url.searchParams.get("id");

        if (type !== "payment" || !paymentId) {
          return new Response("ignored", { status: 200 });
        }

        const idStr = String(paymentId).split("/").pop();

        const res = await fetch(
          `https://api.mercadopago.com/v1/payments/${idStr}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          return new Response("payment lookup failed", { status: 502 });
        }

        const payment: MPPayment = await res.json();

        if (payment.status !== "approved") {
          return new Response("not approved", { status: 200 });
        }

        let clinicId = payment.metadata?.clinic_id;
        let plan = payment.metadata?.plan;

        if (!clinicId || !plan) {
          if (payment.external_reference) {
            const [c, p] = payment.external_reference.split(":");
            clinicId = clinicId ?? c;
            plan = plan ?? (p as any);
          }
        }

        if (!clinicId || !plan) {
          return new Response("bad metadata", { status: 200 });
        }

        const { error } = await supabaseAdmin
          .from("clinics")
          .update({
            plan,
          })
          .eq("id", clinicId);

        if (error) {
          console.error("Webhook DB error:", error);
          return new Response("db update failed", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});