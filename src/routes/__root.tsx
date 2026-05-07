import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VivaeHub — Gestão de clínicas e associações de saúde" },
      {
        name: "description",
        content:
          "VivaeHub: agenda, prontuário, recepção, contribuições e WhatsApp para clínicas e associações de saúde, em um só lugar.",
      },
      { property: "og:title", content: "VivaeHub — Gestão de clínicas e associações de saúde" },
      {
        property: "og:description",
        content: "Agenda, pacientes, recepção, contribuições e WhatsApp para associações de saúde.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "VivaeHub — Gestão de clínicas e associações de saúde" },
      { name: "description", content: "NutriClinic Hub is a multi-tenant SaaS for managing nutrition clinics and health professional associations." },
      { property: "og:description", content: "NutriClinic Hub is a multi-tenant SaaS for managing nutrition clinics and health professional associations." },
      { name: "twitter:description", content: "NutriClinic Hub is a multi-tenant SaaS for managing nutrition clinics and health professional associations." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/75FMuKfl0nNuxMVtwzxv84PcHJ13/social-images/social-1778138280857-ChatGPT_Image_18_de_abr._de_2026,_01_52_48.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/75FMuKfl0nNuxMVtwzxv84PcHJ13/social-images/social-1778138280857-ChatGPT_Image_18_de_abr._de_2026,_01_52_48.webp" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => <Outlet />,
  notFoundComponent: NotFoundComponent,
});

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-right" />
        <Scripts />
      </body>
    </html>
  );
}
