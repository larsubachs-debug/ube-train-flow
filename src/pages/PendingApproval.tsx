import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, Mail } from "lucide-react";
import ubeLogo from "@/assets/ube-logo.png";
import { useNavigate } from "react-router-dom";

const PendingApproval = () => {
  const { signOut, user, approvalStatus } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <img src={ubeLogo} alt="U.be" className="h-16" />
        </div>

        {approvalStatus === "pending" && (
          <>
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Account In Review
              </h1>
              <p className="text-muted-foreground">
                Your account is being reviewed by a trainer. You'll receive access once approved.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3 text-left">
                <Mail className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Email Notification</p>
                  <p className="text-sm text-muted-foreground">
                    We'll send you an email at <strong>{user?.email}</strong> once your account is approved.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {approvalStatus === "rejected" && (
          <>
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Account Not Approved
              </h1>
              <p className="text-muted-foreground mb-4">
                Unfortunately, your account was not approved at this time. Please contact us for more information.
              </p>
            </div>
          </>
        )}

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full"
        >
          Sign Out
        </Button>
      </Card>
    </div>
  );
};

export default PendingApproval;