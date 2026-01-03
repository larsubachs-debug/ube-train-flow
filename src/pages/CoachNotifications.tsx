import { Package } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const CoachNotifications = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="relative mb-6">
          <Package className="h-20 w-20 text-muted-foreground/30" strokeWidth={1} />
          <div className="absolute -top-2 -right-2">
            <div className="w-6 h-6 border-2 border-dashed border-blue-300 rounded-full" />
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2">No Notifications</h2>
        <p className="text-muted-foreground">
          You haven't received any notifications yet.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default CoachNotifications;
