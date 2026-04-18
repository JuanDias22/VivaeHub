import { useSyncExternalStore } from "react";
import { store } from "@/lib/mock-store";

// Versão global incrementada a cada emit do store. Como o store é um
// singleton (mesmo módulo importado por /app e /portal), qualquer mutação
// — addPatient, addAppointment, addProfessional, etc — propaga para
// TODOS os componentes inscritos, garantindo reatividade entre o portal
// público e o sistema interno sem necessidade de refresh manual.
let version = 0;
store.subscribe(() => {
  version += 1;
});

function getSnapshot() {
  return version;
}

function subscribe(cb: () => void) {
  return store.subscribe(cb);
}

export function useStore() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return store;
}
