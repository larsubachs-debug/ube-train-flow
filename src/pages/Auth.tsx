import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import ubeLogo from "@/assets/ube-logo.png";
import { LuxuryBackground } from "@/components/auth/LuxuryBackground";
import { useTranslation } from "react-i18next";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [signupPassword, setSignupPassword] = useState("");
  
  // Check if user came from an invite link
  const inviteToken = searchParams.get("invite");
  const defaultTab = inviteToken ? "signup" : "login";

  // Redirect if already logged in
  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const processInvitation = async (userId: string, userEmail: string) => {
    if (!inviteToken) return;

    try {
      // Find the invitation by token
      const { data: invitation, error: inviteError } = await supabase
        .from("invitations")
        .select("*")
        .eq("token", inviteToken)
        .eq("status", "pending")
        .single();

      if (inviteError || !invitation) {
        console.error("Invalid or expired invitation:", inviteError);
        return;
      }

      // Check if invitation email matches (case insensitive)
      if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
        console.error("Email mismatch for invitation");
        return;
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        console.error("Invitation expired");
        return;
      }

      // Wait for profile to be created by trigger, with retry
      let profileExists = false;
      for (let i = 0; i < 5; i++) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (profile) {
          profileExists = true;
          break;
        }
        // Wait 500ms before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!profileExists) {
        console.error("Profile not created in time");
        return;
      }

      // Update the user's profile to approved and link to coach
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          approval_status: "approved",
          coach_id: invitation.coach_id,
        })
        .eq("user_id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        return;
      }

      // Mark invitation as accepted
      await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      console.log("Invitation processed successfully");
    } catch (error) {
      console.error("Error processing invitation:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: t('auth.validationError', 'Validation Error'),
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: t('auth.signInFailed', 'Sign In Failed'),
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const displayName = formData.get("displayName") as string;

    const validation = signupSchema.safeParse({ email, password, confirmPassword, displayName });
    if (!validation.success) {
      toast({
        title: t('auth.validationError', 'Validation Error'),
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, displayName);

    if (error) {
      toast({
        title: t('auth.signUpFailed', 'Sign Up Failed'),
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      toast({
        title: t('common.success', 'Success!'),
        description: t('auth.signupSuccess', 'Your account has been created. You can now sign in.'),
      });
      // Auto sign in after successful signup
      const signInResult = await signIn(email, password);
      
      if (!signInResult.error) {
        // Get the current user after sign in
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Process invitation if there's a token
        if (currentUser && inviteToken) {
          await processInvitation(currentUser.id, email);
          // Force full reload to refresh auth state after invitation processing
          window.location.href = "/";
          return;
        }
      }
      
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4 relative overflow-hidden">
      <LuxuryBackground />
      <div className="w-full max-w-md relative z-10">
        <Card className="border-2 shadow-xl backdrop-blur-md bg-card/95">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <img src={ubeLogo} alt="U.be" className="h-20" />
            </div>
            <div>
              <CardTitle className="text-2xl font-medium text-foreground">
                {inviteToken ? (
                  <>Welkom bij <span className="font-bold text-accent">U.be</span></>
                ) : (
                  <>All About <span className="font-bold text-accent">U</span></>
                )}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {inviteToken 
                  ? "Je bent uitgenodigd! Maak een account aan om te starten."
                  : t('auth.signInOrCreate', 'Sign in to your account or create a new one')
                }
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-8">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                <TabsTrigger value="login" className="text-base">{t('auth.login', 'Sign In')}</TabsTrigger>
                <TabsTrigger value="signup" className="text-base">{t('auth.signup', 'Sign Up')}</TabsTrigger>
              </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">{t('auth.email', 'Email')}</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                    className="h-11"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">{t('auth.password', 'Password')}</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    disabled={isLoading}
                    className="h-11"
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm h-auto font-normal text-accent hover:text-accent/80"
                  onClick={() => navigate("/reset-password")}
                  disabled={isLoading}
                >
                  {t('auth.forgotPassword', 'Forgot password?')}
                </Button>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground font-medium" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.login', 'Sign In')}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium">{t('auth.fullName', 'Full Name')}</Label>
                  <Input
                    id="signup-name"
                    name="displayName"
                    type="text"
                    placeholder="John Doe"
                    required
                    disabled={isLoading}
                    className="h-11"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">{t('auth.email', 'Email')}</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    disabled={isLoading}
                    className="h-11"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">{t('auth.password', 'Password')}</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder={t('auth.minCharacters', 'Min. 6 characters')}
                    required
                    disabled={isLoading}
                    className="h-11"
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  <PasswordStrength password={signupPassword} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-sm font-medium">{t('auth.confirmPassword', 'Confirm Password')}</Label>
                  <Input
                    id="signup-confirm"
                    name="confirmPassword"
                    type="password"
                    placeholder={t('auth.repeatPassword', 'Repeat password')}
                    required
                    disabled={isLoading}
                    className="h-11"
                    autoComplete="new-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground font-medium" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.createAccount', 'Create Account')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;