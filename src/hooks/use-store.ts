import { useSyncExternalStore } from "react";
import { store } from "@/lib/mock-store";

export function useStore() {
  useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => storeVersion(),
    () => storeVersion(),
  );
  return store;
}

// Version increments on every emit so React re-renders.
let v = 0;
store.subscribe(() => {
  v += 1;
});
function storeVersion() {
  return v;
}
