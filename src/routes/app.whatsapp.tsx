import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/hooks/use-store";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, BellRing } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/app/whatsapp")({
  component: WhatsApp,
});

function WhatsApp() {
  const store = useStore();

  return (
    <div>
      <PageHeader
        title="WhatsApp"
        description="Confirmações e lembretes enviados aos pacientes (simulado)."
      />

      <Card className="p-4 mb-4 border-primary/30 bg-primary/5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <BellRing className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <div className="font-medium">Integração simulada</div>
            <div className="text-muted-foreground">
              Mensagens são geradas automaticamente ao agendar consultas. Em produção,
              conecte a API oficial do WhatsApp Business para envio real.
            </div>
          </div>
        </div>
      </Card>

      {store.whatsappLogs.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground shadow-soft">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <div className="font-medium">Nenhuma mensagem enviada ainda</div>
          <div className="text-sm mt-1">
            Crie um agendamento para ver a confirmação automática aqui.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {store.whatsappLogs.map((log) => (
            <Card key={log.id} className="p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Para {log.to}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.kind === "confirmacao" ? "Confirmação" : "Lembrete"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.message}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3" />
                    {format(new Date(log.sentAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
