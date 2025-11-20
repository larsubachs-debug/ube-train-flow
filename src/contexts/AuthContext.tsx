import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UserRole = "admin" | "coach" | "member";
type ApprovalStatus = "pending" | "approved" | "rejected";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  approvalStatus: ApprovalStatus | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  hasRole: (role: UserRole) => boolean;
  isApproved: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("role", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (roleData) {
        setUserRole(roleData.role as UserRole);
      } else {
        // If no role found, set as member by default
        setUserRole("member");
      }

      // Fetch approval status from profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("approval_status")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileData) {
        setApprovalStatus(profileData.approval_status as ApprovalStatus);
      } else {
        // If no profile found, set as pending
        setApprovalStatus("pending");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("member");
      setApprovalStatus("pending");
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid deadlock
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setApprovalStatus(null);
        }
      }
    );

    // Check for existing session and fetch role before setting loading to false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserRole(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });

    // Profile with email will be auto-created by the trigger

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setApprovalStatus(null);
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    return { error };
  };

  const hasRole = (role: UserRole): boolean => {
    if (!userRole) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      admin: 3,
      coach: 2,
      member: 1,
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[role];
  };

  const isApproved = approvalStatus === "approved" || userRole === "admin" || userRole === "coach";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        approvalStatus,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        hasRole,
        isApproved,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};