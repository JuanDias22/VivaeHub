import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";

export function PermissionDeniedModal() {
  const store = useStore();
  const open = !!store.deniedPage;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) store.clearDenied(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Acesso negado</DialogTitle>
          <DialogDescription>
            Seu usuário não tem permissão para visualizar a página {store.deniedPage}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => store.clearDenied()}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}