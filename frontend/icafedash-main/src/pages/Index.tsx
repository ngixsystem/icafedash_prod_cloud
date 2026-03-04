import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useAuth } from "@/components/auth/AuthProvider";
import StatCards from "@/components/dashboard/StatCards";
import DailyIncomeChart from "@/components/dashboard/DailyIncomeChart";
import TotalIncomeChart from "@/components/dashboard/TotalIncomeChart";
import MonthlyIncomeChart from "@/components/dashboard/MonthlyIncomeChart";
import StatusPanel from "@/components/dashboard/StatusPanel";
import Monitoring from "@/components/dashboard/Monitoring";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import ClientsList from "@/components/dashboard/ClientsList";
import ParticipantsList from "@/components/dashboard/ParticipantsList";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import ReviewsPanel from "@/components/dashboard/ReviewsPanel";
import BookingPanel from "@/components/dashboard/BookingPanel";
import CashbackPanel from "@/components/dashboard/CashbackPanel";
import ManagerHyperOverview from "@/components/dashboard/ManagerHyperOverview";

const Index = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? "Клубы" : "Обзор");

  return (
    <div className="min-h-screen text-gray-300 relative overflow-hidden">
      {!isAdmin && (
        <>
          <div className="ambient-layer">
            <div className="blob bg-[#BD00FF]/20 w-[420px] h-[420px] lg:w-[600px] lg:h-[600px] top-[-10%] left-[-10%]" />
            <div className="blob bg-[#00F0FF]/20 w-[360px] h-[360px] lg:w-[500px] lg:h-[500px] bottom-[-10%] right-[-10%]" />
            <div className="blob bg-[#2B59F9]/20 w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] top-[40%] left-[40%]" />
          </div>
          <div className="grid-bg" />
        </>
      )}

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="relative lg:ml-64 min-h-screen overflow-hidden">
        <TopBar onOpenSettings={() => setActiveTab("Настройки")} />

        <main className="px-4 pb-8 lg:px-8 lg:pt-2 relative z-10">
          {activeTab === "Обзор" ? (
            isAdmin ? (
              <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <StatCards />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DailyIncomeChart />
                    <TotalIncomeChart />
                    <MonthlyIncomeChart />
                  </div>
                </div>

                <div className="w-full xl:w-72 flex-shrink-0">
                  <StatusPanel />
                </div>
              </div>
            ) : (
              <ManagerHyperOverview />
            )
          ) : activeTab === "Мониторинг" ? (
            <Monitoring />
          ) : activeTab === "Бронирование" ? (
            <BookingPanel />
          ) : activeTab === "Участники" ? (
            <ParticipantsList />
          ) : activeTab === "Отзывы" ? (
            <ReviewsPanel />
          ) : activeTab === "Кешбек" ? (
            <CashbackPanel />
          ) : activeTab === "Клубы" ? (
            <AdminDashboard />
          ) : activeTab === "Настройки" ? (
            <SettingsPanel />
          ) : activeTab === "Клиенты" || activeTab === "Менеджеры" ? (
            <ClientsList />
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground">Вкладка "{activeTab}" находится в разработке</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
