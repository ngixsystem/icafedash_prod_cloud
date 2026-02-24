import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import StatCards from "@/components/dashboard/StatCards";
import DailyIncomeChart from "@/components/dashboard/DailyIncomeChart";
import TotalIncomeChart from "@/components/dashboard/TotalIncomeChart";
import PaymentMethods from "@/components/dashboard/PaymentMethods";
import StatusPanel from "@/components/dashboard/StatusPanel";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="lg:ml-60">
        <TopBar />

        <main className="px-4 pb-8 lg:px-6">
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Main content */}
            <div className="flex-1 space-y-6">
              <StatCards />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DailyIncomeChart />
                <TotalIncomeChart />
                <PaymentMethods />
              </div>
            </div>

            {/* Right panel */}
            <div className="w-full xl:w-72 flex-shrink-0">
              <StatusPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
