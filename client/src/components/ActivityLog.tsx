import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Activity } from "@/types";

const ActivityLog = () => {
  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ['/api/activities/recent'],
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
    
    return date.toLocaleDateString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getActivityDot = (type: string): { bg: string } => {
    switch(type) {
      case 'upload':
        return { bg: 'bg-primary-500' };
      case 'ocr':
        return { bg: 'bg-blue-500' };
      case 'analysis':
        return { bg: 'bg-accent-500' };
      case 'notification':
        return { bg: 'bg-green-500' };
      case 'integration':
        return { bg: 'bg-purple-500' };
      default:
        return { bg: 'bg-gray-500' };
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="font-semibold text-lg text-gray-800">Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="relative">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="ml-6 pb-4 relative">
                <Skeleton className="absolute -left-6 mt-1 w-3 h-3 rounded-full" />
                <div className="pl-4 border-l-2 border-gray-200">
                  <Skeleton className="h-4 w-2/3 mb-1" />
                  <Skeleton className="h-3 w-1/2 mb-1" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="font-semibold text-lg text-gray-800">Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            Failed to load activity log. Please refresh the page.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="font-semibold text-lg text-gray-800">Activity Log</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative">
          {activities && activities.length > 0 ? (
            activities.map((activity, index) => {
              const dot = getActivityDot(activity.type);
              const isLast = index === activities.length - 1;
              
              return (
                <div key={activity.id} className="ml-6 pb-4 relative">
                  <div className={`absolute -left-6 mt-1 w-3 h-3 rounded-full ${dot.bg} border-2 border-white`}></div>
                  <div className={`pl-4 ${!isLast ? 'border-l-2 border-gray-200' : ''}`}>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    {activity.documentName && (
                      <p className="text-xs text-gray-500 mb-1">{activity.documentName}</p>
                    )}
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.createdAt)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>No recent activities</p>
            </div>
          )}
        </div>
        
        {activities && activities.length > 0 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-primary-700 hover:text-primary-800 font-medium">View full log</button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLog;
