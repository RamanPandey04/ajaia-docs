"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USERS } from "@/lib/demo-users";

type IdentityContextValue = {
  userId: string | null;
  ready: boolean;
  selectUser: (id: string) => Promise<void>;
  registerPendingSave: (save: (() => Promise<void>) | null) => void;
};
const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const pendingSave = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = localStorage.getItem("ajaia-demo-user");
      setUserId(DEMO_USERS.some((user) => user.id === stored) ? stored : DEMO_USERS[0].id);
      setReady(true);
    });
  }, []);

  async function selectUser(id: string) {
    if (id === userId) return;
    if (pendingSave.current) {
      try { await pendingSave.current(); }
      catch { return; } // Keep the editor open if the latest changes could not be saved.
    }
    localStorage.setItem("ajaia-demo-user", id);
    setUserId(id);
    router.push("/");
  }

  return <IdentityContext.Provider value={{ userId, ready, selectUser, registerPendingSave: (save) => { pendingSave.current = save; } }}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (!context) throw new Error("IdentityProvider is missing");
  return context;
}
