import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DocumentUpload from "@/components/documents/DocumentUpload";
import type { ServiceConnection } from "@/types";

const QuickActions = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  const { data: connections, isLoading, error } = useQuery<ServiceConnection[]>({
    queryKey: ['/api/connections'],
    staleTime: 60000, // 1 minute
  });

  const handleUploadDocument = () => {
    setShowUploadModal(true);
  };

  const handleOcrScan = () => {
    window.location.href = "/ocr";
  };

  const handleAiAnalysis = () => {
    window.location.href = "/analysis";
  };

  const handleConnectDrive = () => {
    window.location.href = "/drive";
  };

  const getConnectionIcon = (type: string): string => {
    switch(type) {
      case 'google_drive': return 'ri-google-drive-line text-blue-600';
      case 'telegram': return 'ri-telegram-line text-blue-500';
      case 'openai': return 'ri-openai-line text-gray-800';
      default: return 'ri-cloud-line text-gray-600';
    }
  };

  const getConnectionName = (type: string): string => {
    switch(type) {
      case 'google_drive': return 'Google Drive';
      case 'telegram': return 'Telegram Bot';
      case 'openai': return 'OpenAI GPT-4o';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="font-semibold text-lg text-gray-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="font-semibold text-lg text-gray-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <Button 
            onClick={handleUploadDocument}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white py-2 px-4 rounded-md flex items-center justify-center"
          >
            <i className="ri-upload-cloud-line mr-2"></i>
            Upload Document
          </Button>
          
          <Button 
            onClick={handleOcrScan}
            variant="outline"
            className="w-full border border-primary-700 text-primary-700 hover:bg-primary-50 py-2 px-4 rounded-md flex items-center justify-center"
          >
            <i className="ri-scan-line mr-2"></i>
            New OCR Scan
          </Button>
          
          <Button 
            onClick={handleAiAnalysis}
            variant="outline"
            className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-md flex items-center justify-center"
          >
            <i className="ri-robot-line mr-2"></i>
            AI Analysis
          </Button>
          
          <Button 
            onClick={handleConnectDrive}
            variant="outline"
            className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-md flex items-center justify-center"
          >
            <i className="ri-google-drive-line mr-2"></i>
            Connect to Drive
          </Button>
        </CardContent>
        
        {/* Integration status */}
        <div className="px-5 pb-5">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Connected Services</h3>
          <div className="space-y-2">
            {connections?.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <i className={`${getConnectionIcon(connection.type)} mr-2`}></i>
                  <span className="text-sm text-gray-700">{getConnectionName(connection.type)}</span>
                </div>
                <span className={`text-xs px-2 py-1 ${connection.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-full`}>
                  {connection.status === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            ))}
            
            {(!connections || connections.length === 0) && (
              <div className="text-center py-2 text-gray-500">
                <p className="text-sm">No services connected yet</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Document Upload Modal */}
      {showUploadModal && (
        <DocumentUpload isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
      )}
    </>
  );
};

export default QuickActions;
