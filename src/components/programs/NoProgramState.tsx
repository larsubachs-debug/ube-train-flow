import { Dumbbell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

export const NoProgramState = () => {
  const { t } = useTranslation();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Dumbbell className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">
          {t('home.noProgram', 'No program assigned yet')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t('home.noProgramDescription', 'Your coach will assign a program for you soon')}
        </p>
      </CardContent>
    </Card>
  );
};
