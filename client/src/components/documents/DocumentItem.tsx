import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@/types";

interface DocumentItemProps {
  document: Document;
  onView?: () => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ document, onView }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return 'ri-file-pdf-line text-red-500';
    if (fileType.includes('word') || fileType.includes('doc')) return 'ri-file-word-line text-blue-500';
    if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('csv')) return 'ri-file-excel-line text-green-600';
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png')) return 'ri-image-line text-green-500';
    return 'ri-file-line text-gray-500';
  };

  const getFileStatus = (doc: Document): string => {
    if (doc.status === 'error') return 'Error';
    if (doc.status === 'analyzing') return 'Analyzing';
    if (doc.status === 'pending') return 'Pending';
    
    if (doc.ocrProcessed && doc.aiAnalyzed) return 'AI analyzed';
    if (doc.ocrProcessed) return 'OCR processed';
    if (doc.status === 'processed') return 'Processed';
    
    return 'Uploaded';
  };

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
  
  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/documents/${document.id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: `${document.name} was successfully deleted`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete document: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Run OCR mutation
  const runOcrMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/documents/${document.id}/ocr`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "OCR processing started",
        description: `OCR processing has started for ${document.name}`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/recent'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to start OCR processing: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Run AI analysis mutation
  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/documents/${document.id}/analyze`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "AI analysis started",
        description: `AI analysis has started for ${document.name}`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/recent'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to start AI analysis: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handle actions
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${document.name}?`)) {
      deleteMutation.mutate();
    }
  };

  const handleRunOcr = () => {
    runOcrMutation.mutate();
  };

  const handleRunAnalysis = () => {
    runAnalysisMutation.mutate();
  };

  const handleDownload = () => {
    if (document.url) {
      window.open(document.url, '_blank');
    } else {
      toast({
        title: "Error",
        description: "Download URL not available",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-3 hover:bg-gray-50 rounded-md flex items-start border-b border-gray-100 last:border-b-0">
      <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-3">
        <i className={getFileIcon(document.type)}></i>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{document.name}</p>
        <div className="flex items-center mt-1">
          <span className="text-xs text-gray-500">{formatFileSize(document.size)}</span>
          <span className="mx-2 text-gray-300">•</span>
          <span className="text-xs text-gray-500">{getFileStatus(document)}</span>
          <span className="mx-2 text-gray-300">•</span>
          <span className="text-xs text-gray-500">{formatTimeAgo(document.createdAt)}</span>
        </div>
      </div>
      <div className="flex-shrink-0 flex space-x-2">
        <button 
          className="text-gray-500 hover:text-primary-700" 
          onClick={onView}
          title="View document"
        >
          <i className="ri-eye-line"></i>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-gray-500 hover:text-primary-700" title="More options">
              <i className="ri-more-2-fill"></i>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDownload}>
              <i className="ri-download-line mr-2"></i> Download
            </DropdownMenuItem>
            {!document.ocrProcessed && (
              <DropdownMenuItem onClick={handleRunOcr}>
                <i className="ri-scan-line mr-2"></i> Run OCR
              </DropdownMenuItem>
            )}
            {document.ocrProcessed && !document.aiAnalyzed && (
              <DropdownMenuItem onClick={handleRunAnalysis}>
                <i className="ri-robot-line mr-2"></i> Run AI Analysis
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <i className="ri-delete-bin-line mr-2"></i> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default DocumentItem;
