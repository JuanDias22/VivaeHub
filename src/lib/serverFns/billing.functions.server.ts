import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PlanId = "basic" | "plus" | "pro";

const PRICES: Record<PlanId, { amount: number; title: string }> = {
  basic: { amount: 99, title: "VivaeHub - Plano Basic" },
  plus: { amount: 159, title: "VivaeHub - Plano Plus" },
  pro: { amount: 279, title: "VivaeHub - Plano Pro" },
};

export const createCheckoutPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { plan: PlanId }) => {
    if (data?.plan !== "basic" && data?.plan !== "plus" && data?.plan !== "pro") {
      throw new Error("Plano inválido");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

    const { supabase, userId } = context;

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("clinic_id, email")
      .eq("id", userId)
      .single();
    if (profileErr || !profile?.clinic_id) {
      throw new Error("Clínica não encontrada para o usuário");
    }

    const price = PRICES[data.plan];
    const origin =
      process.env.PUBLIC_SITE_URL ||
      "https://project--af4ed562-1e7e-4566-b20e-1bf56a1f727b.lovable.app";

    const body = {
      items: [
        {
          id: `plan_${data.plan}`,
          title: price.title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: price.amount,
        },
      ],
      payer: profile.email ? { email: profile.email } : undefined,
      external_reference: `${profile.clinic_id}:${data.plan}`,
      metadata: {
        clinic_id: profile.clinic_id,
        plan: data.plan,
      },
      back_urls: {
        success: `${origin}/app`,
        failure: `${origin}/upgrade`,
        pending: `${origin}/upgrade`,
      },
      auto_return: "approved",
      notification_url: `${origin}/api/public/mercadopago-webhook`,
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("MP preference error", res.status, txt);
      throw new Error(`Falha ao criar checkout (${res.status})`);
    }

    const json = (await res.json()) as {
      id: string;
      init_point?: string;
      sandbox_init_point?: string;
    };

    const url =
      token.startsWith("TEST-") ? json.sandbox_init_point ?? json.init_point : json.init_point;

    if (!url) throw new Error("Checkout URL ausente");
    return { url, id: json.id };
  });