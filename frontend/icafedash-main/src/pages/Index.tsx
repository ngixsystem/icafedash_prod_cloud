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

const Index = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? "Клубы" : "Обзор");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="lg:ml-60">
        <TopBar />

        <main className="px-4 pb-8 lg:px-6">
          {activeTab === "Обзор" ? (
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
          ) : activeTab === "Мониторинг" ? (
            <Monitoring />
          ) : activeTab === "Бронирование" ? (
            <BookingPanel />
          ) : activeTab === "Участники" ? (
            <ParticipantsList />
          ) : activeTab === "Отзывы" ? (
            <ReviewsPanel />
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
