import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DocumentItem from "@/components/documents/DocumentItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Document } from "@/types";

const RecentDocuments = () => {
  const { data: documents, isLoading, error } = useQuery<Document[]>({
    queryKey: ['/api/documents/recent'],
    staleTime: 60000, // 1 minute
  });

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

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="font-semibold text-lg text-gray-800">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 flex items-start">
              <Skeleton className="h-10 w-10 rounded mr-3" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full max-w-[250px] mb-2" />
                <Skeleton className="h-3 w-full max-w-[200px]" />
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
          <CardTitle className="font-semibold text-lg text-gray-800">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            Failed to load recent documents. Please refresh the page.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="font-semibold text-lg text-gray-800">Recent Documents</CardTitle>
        <a href="/documents" className="text-sm text-primary-700 hover:text-primary-800 font-medium">View all</a>
      </CardHeader>
      <CardContent className="p-2">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc.id} className="p-3 hover:bg-gray-50 rounded-md flex items-start border-b border-gray-100 last:border-b-0">
              <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-3">
                <i className={getFileIcon(doc.type)}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500">{formatFileSize(doc.size)}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-xs text-gray-500">{getFileStatus(doc)}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-xs text-gray-500">{formatTimeAgo(doc.createdAt)}</span>
                </div>
              </div>
              <div className="flex-shrink-0 flex space-x-2">
                <button className="text-gray-500 hover:text-primary-700">
                  <i className="ri-eye-line"></i>
                </button>
                <button className="text-gray-500 hover:text-primary-700">
                  <i className="ri-more-2-fill"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-5 text-center text-gray-500">
            <i className="ri-file-upload-line text-3xl mb-2 block"></i>
            <p>No documents uploaded yet.</p>
            <p className="text-sm mt-1">Start by uploading your first document</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentDocuments;
