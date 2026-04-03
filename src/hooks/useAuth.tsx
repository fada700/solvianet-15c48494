import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AuthMethod = "google" | "staff" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  authMethod: AuthMethod;
  isGoogleUser: boolean;
  isStaffUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const adminCacheRef = useRef<Record<string, boolean>>({});
  const initializedRef = useRef(false);

  const checkAdmin = useCallback(async (userId: string): Promise<boolean> => {
    if (userId in adminCacheRef.current) {
      return adminCacheRef.current[userId];
    }
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      const result = !!data;
      adminCacheRef.current[userId] = result;
      return result;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth loading timeout - forcing ready state");
        setLoading(false);
      }
    }, 5000);

    const handleSession = async (newSession: Session | null) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const provider = newSession.user.app_metadata?.provider;
        const method: AuthMethod = provider === "google" ? "google" : "staff";
        if (mounted) setAuthMethod(method);

        const admin = await checkAdmin(newSession.user.id);
        if (mounted) setIsAdmin(admin);
      } else {
        setIsAdmin(false);
        setAuthMethod(null);
      }
      if (mounted) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        initializedRef.current = true;
        handleSession(newSession);
      }
    );

    const fallbackTimeout = setTimeout(() => {
      if (!initializedRef.current && mounted) {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (mounted && !initializedRef.current) {
            initializedRef.current = true;
            handleSession(s);
          }
        }).catch(() => {
          if (mounted) setLoading(false);
        });
      }
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, [checkAdmin]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    setIsAdmin(false);
    setAuthMethod(null);
    adminCacheRef.current = {};
    await supabase.auth.signOut();
  }, []);

  const isGoogleUser = authMethod === "google";
  const isStaffUser = authMethod === "staff";

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
