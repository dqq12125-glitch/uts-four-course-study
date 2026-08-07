import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DeepStudyApi,
  DeepStudyApiError,
} from "@/src/api/client";
import type { SessionUser } from "@/src/api/types";
import {
  clearSecureSessionToken,
  readSecureSessionToken,
  writeSecureSessionToken,
} from "./secure-session";

type SessionStatus = "loading" | "signed-out" | "signed-in" | "error";

interface SessionContextValue {
  api: DeepStudyApi;
  status: SessionStatus;
  user: SessionUser | null;
  error: string | null;
  acceptMobileSession(token: string, user: SessionUser): Promise<void>;
  refreshSession(): Promise<void>;
  signOut(): Promise<void>;
}

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const api = useMemo(() => new DeepStudyApi(apiBaseUrl), []);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    const token = await readSecureSessionToken();
    if (!token) {
      api.setSessionToken(null);
      setUser(null);
      setStatus("signed-out");
      return;
    }
    api.setSessionToken(token);
    try {
      const result = await api.session();
      if (!result.user) {
        await clearSecureSessionToken();
        api.setSessionToken(null);
        setUser(null);
        setStatus("signed-out");
        return;
      }
      setUser(result.user);
      setError(null);
      setStatus("signed-in");
    } catch (caught) {
      if (
        caught instanceof DeepStudyApiError &&
        caught.status === 401
      ) {
        await clearSecureSessionToken();
        api.setSessionToken(null);
        setUser(null);
        setStatus("signed-out");
        return;
      }
      setError(
        caught instanceof Error
          ? caught.message
          : "DeepStudy is temporarily unavailable.",
      );
      setStatus("error");
    }
  }, [api]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void refreshSession();
    }, 0);
    return () => clearTimeout(timeout);
  }, [refreshSession]);

  const acceptMobileSession = useCallback(
    async (token: string, nextUser: SessionUser) => {
      await writeSecureSessionToken(token);
      api.setSessionToken(token);
      setUser(nextUser);
      setError(null);
      setStatus("signed-in");
    },
    [api],
  );

  const signOut = useCallback(async () => {
    try {
      await api.signOut();
    } finally {
      await clearSecureSessionToken();
      api.setSessionToken(null);
      setUser(null);
      setStatus("signed-out");
    }
  }, [api]);

  const value = useMemo<SessionContextValue>(
    () => ({
      api,
      status,
      user,
      error,
      acceptMobileSession,
      refreshSession,
      signOut,
    }),
    [
      acceptMobileSession,
      api,
      error,
      refreshSession,
      signOut,
      status,
      user,
    ],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used inside SessionProvider.");
  }
  return value;
}
