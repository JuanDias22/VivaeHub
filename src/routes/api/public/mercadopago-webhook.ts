import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!token) {
          return new Response("MP token missing", { status: 500 });
        }

        let payload: any = null;
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
          url.searchParams.get("id") ||
          url.searchParams.get("data.id");

        if (type !== "payment" || !paymentId) {
          // Acknowledge other event types so MP doesn't retry forever.
          return new Response("ignored", { status: 200 });
        }

        const idStr = String(paymentId).split("/").pop();
        const res = await fetch(`https://api.mercadopago.com/v1/payments/${idStr}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.error("MP fetch payment failed", res.status);
          return new Response("payment lookup failed", { status: 502 });
        }
        const payment = (await res.json()) as {
          status?: string;
          external_reference?: string;
          metadata?: { clinic_id?: string; plan?: string };
        };

        if (payment.status !== "approved") {
          return new Response("not approved", { status: 200 });
        }

        let clinicId = payment.metadata?.clinic_id;
        let plan = payment.metadata?.plan;
        if ((!clinicId || !plan) && payment.external_reference) {
          const [c, p] = payment.external_reference.split(":");
          clinicId = clinicId || c;
          plan = plan || p;
        }

        if (!clinicId || (plan !== "basic" && plan !== "pro")) {
          console.error("MP webhook missing clinic/plan", payment);
          return new Response("bad metadata", { status: 200 });
        }

        const { error } = await supabaseAdmin
          .from("clinics")
          .update({
            plan: plan as "basic" | "pro",
            trial_ends_at: new Date().toISOString(),
          })
          .eq("id", clinicId);

        if (error) {
          console.error("MP webhook update failed", error);
          return new Response("db update failed", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});