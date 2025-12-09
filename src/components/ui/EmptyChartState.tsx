import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EmptyChartStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export const EmptyChartState = ({ message, icon }: EmptyChartStateProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      {icon || <BarChart3 className="w-12 h-12 mb-3 opacity-50" />}
      <p className="text-sm text-center">
        {message || t('common.noData', 'No data available')}
      </p>
    </div>
  );
};
