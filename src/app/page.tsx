import QuickActions from "@/components/home/QuickActions";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import { Card, CardContent } from "@/components/ui/card";

const HomePage = () => {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      {/* Quick Actions — full width */}
      <Card>
        <CardContent className="p-6">
          <QuickActions />
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="min-h-[420px]">
        <CardContent className="p-6 h-full">
          <UpcomingEvents />
        </CardContent>
      </Card>
    </main>
  );
};

export default HomePage;
