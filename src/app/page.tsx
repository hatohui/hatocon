import LeaveBalance from "@/components/home/LeaveBalance";
import QuickActionsCard from "@/components/home/QuickActions";
import UpcomingPlans from "@/components/home/UpcomingPlans";
import { Card, CardContent } from "@/components/ui/card";

const HomePage = () => {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 space-y-6 md:px-6 md:py-10 md:space-y-8">
      {/* Quick Actions — full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:grid-cols-[1fr_5fr]">
        <QuickActionsCard />
        <div className="flex flex-col gap-6 ">
          <Card>
            <CardContent>
              <LeaveBalance />
            </CardContent>
          </Card>
          <Card className="">
            <CardContent className="px-4 md:px-6 h-full">
              <UpcomingPlans />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
