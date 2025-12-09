import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import MemberAgenda from "@/components/agenda/MemberAgenda";
import MemberCalendar from "@/components/agenda/MemberCalendar";
import { useTranslation } from "react-i18next";

const Agenda = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav />
      
      <div className="container mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('agenda.title', 'Agenda')}</h1>
          <p className="text-muted-foreground">{t('agenda.subtitle', 'Bekijk je geplande workouts en taken')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <MemberAgenda />
          <MemberCalendar />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Agenda;
