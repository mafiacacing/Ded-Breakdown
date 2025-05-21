import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Analysis } from "@/types";

const RecentAnalysis = () => {
  const { data: analyses, isLoading, error } = useQuery<Analysis[]>({
    queryKey: ['/api/analyses/recent'],
    staleTime: 60000, // 1 minute
  });

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="font-semibold text-lg text-gray-800">Recent AI Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="font-semibold text-lg text-gray-800">Recent AI Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            Failed to load recent analyses. Please refresh the page.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="font-semibold text-lg text-gray-800">Recent AI Analysis</CardTitle>
        <a href="/analysis" className="text-sm text-primary-700 hover:text-primary-800 font-medium">View all</a>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {analyses && analyses.length > 0 ? (
          analyses.map((analysis) => (
            <div key={analysis.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between mb-2">
                <h3 className="font-medium text-gray-900">{analysis.title}</h3>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{analysis.model}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{analysis.content.slice(0, 150)}...</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <i className="ri-time-line mr-1"></i>
                  <span>{formatTimeAgo(analysis.createdAt)}</span>
                </div>
                <button className="text-xs text-primary-700 hover:text-primary-800 font-medium">View details</button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="ri-robot-line text-3xl mb-2 block"></i>
            <p>No AI analyses performed yet</p>
            <p className="text-sm mt-1">Upload a document and run AI analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentAnalysis;
