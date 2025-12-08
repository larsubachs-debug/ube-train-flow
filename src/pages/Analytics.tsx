import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MuscleHeatmap } from "@/components/analytics/MuscleHeatmap";
import { VolumeTrackingChart } from "@/components/analytics/VolumeTrackingChart";
import { RestTimeAnalytics } from "@/components/analytics/RestTimeAnalytics";
import { FatigueManagement } from "@/components/analytics/FatigueManagement";
import { DataExport } from "@/components/analytics/DataExport";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import { 
  BarChart3, 
  Activity, 
  Clock, 
  Battery, 
  Download,
  ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopNav />
      
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Inzichten in je training prestaties
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="text-xs">
              <BarChart3 className="h-4 w-4 mr-1 hidden sm:inline" />
              Overzicht
            </TabsTrigger>
            <TabsTrigger value="volume" className="text-xs">
              <Activity className="h-4 w-4 mr-1 hidden sm:inline" />
              Volume
            </TabsTrigger>
            <TabsTrigger value="rest" className="text-xs">
              <Clock className="h-4 w-4 mr-1 hidden sm:inline" />
              Rust
            </TabsTrigger>
            <TabsTrigger value="fatigue" className="text-xs">
              <Battery className="h-4 w-4 mr-1 hidden sm:inline" />
              Fatigue
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs">
              <Download className="h-4 w-4 mr-1 hidden sm:inline" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <MuscleHeatmap weeksToShow={4} />
            <div className="grid md:grid-cols-2 gap-6">
              <RestTimeAnalytics daysToShow={14} />
              <FatigueManagement daysToShow={14} />
            </div>
          </TabsContent>

          <TabsContent value="volume">
            <VolumeTrackingChart weeksToShow={12} />
          </TabsContent>

          <TabsContent value="rest">
            <RestTimeAnalytics daysToShow={30} />
          </TabsContent>

          <TabsContent value="fatigue">
            <FatigueManagement daysToShow={30} />
          </TabsContent>

          <TabsContent value="export">
            <DataExport />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Analytics;
