import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { User } from "../../types";
import { api, ApiError } from "../../services/api";
const SessionContext = createContext<{
  user: User | null;
  loading: boolean;
  error: Error | null;
}>({ user: null, loading: true, error: null });
export function SessionProvider({ children }: { children: ReactNode }) {
  const q = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await api<User>("/users/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    retry: false,
  });
  return (
    <SessionContext.Provider
      value={{ user: q.data || null, loading: q.isPending, error: q.error }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export const useSession = () => useContext(SessionContext);
