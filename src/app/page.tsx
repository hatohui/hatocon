import QuickActions from "@/components/home/QuickActions";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import UpcomingPlans from "@/components/home/UpcomingPlans";
import { Card, CardContent } from "@/components/ui/card";

const HomePage = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 space-y-6 md:px-6 md:py-10 md:space-y-8">
      {/* Quick Actions — full width */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <QuickActions />
        </CardContent>
      </Card>

      {/* Two-column: Upcoming Events + Upcoming Plans */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="min-h-105">
          <CardContent className="p-4 md:p-6 h-full">
            <UpcomingPlans />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default HomePage;
