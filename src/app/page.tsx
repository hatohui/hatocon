import LeaveHeatmap from "@/components/home/LeaveHeatmap";
import QuickActions from "@/components/home/QuickActions";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

const HomePage = () => {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      {/* Heatmap — full width */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Your Leave Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <LeaveHeatmap />
        </CardContent>
      </Card>

      {/* Lower row: Upcoming Events + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="min-h-[420px]">
          <CardContent className="p-6 h-full">
            <UpcomingEvents />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <QuickActions />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default HomePage;
