import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Stats } from "@/types";
import { apiRequest } from "@/lib/queryClient";

const DashboardStats = () => {
  // Fetch stats from API
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/stats'],
    staleTime: 60000, // 1 minute
  });
  
  // Stats cards definition
  const statsCards = [
    {
      title: "Documents Processed",
      value: stats?.documentsProcessed || 0,
      change: "+12%",
      icon: "ri-file-text-line",
      iconBg: "bg-primary-100 text-primary-700"
    },
    {
      title: "OCR Scans",
      value: stats?.ocrScans || 0,
      change: "+8%",
      icon: "ri-scan-line",
      iconBg: "bg-blue-100 text-secondary-700"
    },
    {
      title: "AI Analyses",
      value: stats?.aiAnalyses || 0,
      change: "+24%",
      icon: "ri-robot-line",
      iconBg: "bg-orange-100 text-accent-500"
    },
    {
      title: "Storage Used",
      value: formatStorageSize(stats?.storageUsed || 0),
      percentUsed: stats ? (stats.storageUsed / stats.storageLimit) * 100 : 0,
      icon: "ri-hard-drive-line",
      iconBg: "bg-purple-100 text-purple-600"
    }
  ];

  function formatStorageSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <div className="animate-pulse h-20"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
        Failed to load statistics. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsCards.map((stat, index) => (
        <Card key={index} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className={`rounded-full p-2 ${stat.iconBg}`}>
              <i className={`${stat.icon} text-xl`}></i>
            </div>
          </div>
          
          {stat.percentUsed !== undefined ? (
            <div className="mt-2 flex items-center text-sm">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, stat.percentUsed)}%` }}
                ></div>
              </div>
              <span className="text-gray-500 ml-2">{Math.round(stat.percentUsed)}%</span>
            </div>
          ) : (
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-500 font-medium flex items-center">
                <i className="ri-arrow-up-line mr-1"></i> {stat.change}
              </span>
              <span className="text-gray-500 ml-2">from last month</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
