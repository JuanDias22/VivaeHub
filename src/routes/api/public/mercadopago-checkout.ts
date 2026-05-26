import { createFileRoute } from "@tanstack/react-router";

type PlanId = "basic" | "plus" | "pro";

const PRICES: Record<PlanId, { amount: number; title: string }> = {
  basic: { amount: 99, title: "VivaeHub - Plano Basic" },
  plus: { amount: 159, title: "VivaeHub - Plano Plus" },
  pro: { amount: 279, title: "VivaeHub - Plano Pro" },
};

export const Route = createFileRoute(
  "/api/public/mercadopago-checkout"
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
          const origin = process.env.PUBLIC_SITE_URL ?? "http://localhost:8080";

          if (!token) {
            return new Response("MP token missing", { status: 500 });
          }

          const body = await request.json();
          const plan = body?.plan as PlanId;

          if (!plan || !PRICES[plan]) {
            return new Response("Plano inválido", { status: 400 });
          }

          const price = PRICES[plan];

          const res = await fetch(
            "https://api.mercadopago.com/checkout/preferences",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                items: [
                  {
                    title: price.title,
                    quantity: 1,
                    currency_id: "BRL",
                    unit_price: price.amount,
                  },
                ],
                external_reference: `checkout:${plan}`,
                back_urls: {
                  success: `${origin}/app`,
                  failure: `${origin}/upgrade`,
                  pending: `${origin}/upgrade`,
                },
                notification_url: `${origin}/api/public/mercadopago-webhook`,
              }),
            }
          );

          const data = await res.json();

          return new Response(
            JSON.stringify({
              url: data.init_point,
              id: data.id,
            }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err) {
          console.error(err);
          return new Response("internal error", { status: 500 });
        }
      },
    },
  },
});