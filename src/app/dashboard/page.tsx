"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { getCurrentMonth } from "@/types/free-to-spend-types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import OverviewTab from "./components/OverviewTab";
import BudgetTab from "./components/BudgetTab";
import AnalyticsTab from "./components/AnalyticsTab";

import DashboardHeader from "./components/DashboardHeader";
import BottomTabBar from "./components/BottomTabBar";
import NotificationDrawer from "./components/NotificationDrawer";
import { useNotifications } from "./hooks/useNotifications";

export default function DashboardPage() {
  const { data: session } = useSession();

  // Dashboard layout state
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Notifications for bell badge + drawer
  const {
    notifications,
    count: notificationCount,
    dismiss,
    refresh: refreshNotifications,
    isLoading: notificationsLoading,
  } = useNotifications();

  if (!session) {
    return <div className="text-center p-8">Please log in to view your dashboard</div>;
  }

  return (
    <div className="container mx-auto p-4 pb-20 md:pb-4">
      <DashboardHeader
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        notificationCount={notificationCount}
        onBellClick={() => setDrawerOpen(true)}
      />

      {/* Desktop tabs - hidden on mobile */}
      <div className="hidden md:block mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          selectedMonth={selectedMonth}
          onNavigateToBudget={() => setActiveTab("budget")}
        />
      )}

      {activeTab === "budget" && (
        <BudgetTab selectedMonth={selectedMonth} />
      )}

      {activeTab === "analytics" && (
        <AnalyticsTab />
      )}

      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <NotificationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        notifications={notifications}
        isLoading={notificationsLoading}
        onDismiss={dismiss}
        onRefresh={refreshNotifications}
      />
    </div>
  );
}
