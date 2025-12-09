import { Dumbbell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const NoProgramState = () => {
  const { t } = useTranslation();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Dumbbell className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">
          {t('home.noProgram', 'No program assigned')}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {t('programs.startDescription', 'Start a program to begin your training journey')}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/programs">
            {t('programs.viewPrograms', 'View Programs')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
