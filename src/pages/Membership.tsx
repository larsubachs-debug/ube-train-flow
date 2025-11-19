import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";

const plans = [
  {
    id: "program",
    name: "Program Only",
    price: 29,
    features: [
      "Access to all training programs",
      "Weekly workout plans",
      "Exercise video library",
      "Progress tracking",
      "Community access",
      "Education modules",
    ],
  },
  {
    id: "program-checkin",
    name: "Program + Monthly Check-in",
    price: 59,
    popular: true,
    features: [
      "Everything in Program Only",
      "Monthly 1-on-1 check-in call",
      "Personalized feedback",
      "Program adjustments",
      "Form check reviews",
      "Priority support",
    ],
  },
];

const Membership = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
            <Crown className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Start your 7-day free trial. Cancel anytime.
          </p>
        </div>

        {/* Trial Banner */}
        <Card className="p-4 mb-6 bg-accent/5 border-accent/20">
          <p className="text-sm text-center">
            <span className="font-semibold text-accent">7 days free</span>, then billed monthly
          </p>
        </Card>

        {/* Plans */}
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`p-6 relative ${
                plan.popular ? "border-accent border-2 shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">€{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.popular
                    ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                Start Free Trial
              </Button>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
          
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time. No questions asked.
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">What happens after the trial?</h3>
            <p className="text-sm text-muted-foreground">
              After 7 days, you'll be charged for your selected plan. You'll receive a reminder before billing.
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Can I switch plans later?</h3>
            <p className="text-sm text-muted-foreground">
              Absolutely! You can upgrade or downgrade your plan at any time from your account settings.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Membership;
