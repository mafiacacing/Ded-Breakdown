import React from "react";
import DashboardStats from "@/components/DashboardStats";
import RecentDocuments from "@/components/RecentDocuments";
import QuickActions from "@/components/QuickActions";
import RecentAnalysis from "@/components/RecentAnalysis";
import ActivityLog from "@/components/ActivityLog";

const Dashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Dashboard header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Overview of your document analysis activities</p>
      </div>
      
      {/* Stats cards */}
      <DashboardStats />
      
      {/* Recent activity and quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent documents */}
        <RecentDocuments />
        
        {/* Quick actions */}
        <QuickActions />
      </div>
      
      {/* Recent AI analysis and activity log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent AI analysis */}
        <RecentAnalysis />
        
        {/* Activity log */}
        <ActivityLog />
      </div>
    </div>
  );
};

export default Dashboard;
