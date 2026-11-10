import { useEffect, useState, useSyncExternalStore } from "react";
import { store, sincronizar } from "./treino-api";

export function useTreino() {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

export function useOnline() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const f = () => { setOn(navigator.onLine); if (navigator.onLine) void sincronizar(); };
    f();
    window.addEventListener("online", f);
    window.addEventListener("offline", f);
    return () => { window.removeEventListener("online", f); window.removeEventListener("offline", f); };
  }, []);
  return on;
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
