import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import DocumentItem from "@/components/documents/DocumentItem";
import DocumentUpload from "@/components/documents/DocumentUpload";
import type { Document } from "@/types";

const Documents: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("all");
  
  // Fetch documents from API
  const { data: documents, isLoading, error } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    staleTime: 60000, // 1 minute
  });
  
  // Filter documents based on search query and category
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = searchQuery === "" || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = currentCategory === "all" || 
      (currentCategory === "ocr" && doc.ocrProcessed) ||
      (currentCategory === "analyzed" && doc.aiAnalyzed);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-600">Manage and analyze your documents</p>
        </div>
        <Button 
          onClick={() => setShowUploadModal(true)}
          className="mt-4 sm:mt-0"
        >
          <i className="ri-upload-cloud-line mr-2"></i>
          Upload Document
        </Button>
      </div>
      
      {/* Main content */}
      <Card>
        <CardHeader className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Tabs defaultValue="all" value={currentCategory} onValueChange={setCurrentCategory}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ocr">OCR Processed</TabsTrigger>
              <TabsTrigger value="analyzed">AI Analyzed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start">
                  <Skeleton className="h-10 w-10 rounded mr-3" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full max-w-[300px] mb-2" />
                    <Skeleton className="h-3 w-full max-w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                Failed to load documents. Please refresh the page.
              </div>
            </div>
          ) : filteredDocuments && filteredDocuments.length > 0 ? (
            <div>
              {filteredDocuments.map((doc) => (
                <DocumentItem key={doc.id} document={doc} />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-gray-500">
              <i className="ri-file-search-line text-5xl mb-3 block"></i>
              <p className="text-lg font-medium">No documents found</p>
              <p className="text-sm mt-1 mb-4">
                {searchQuery
                  ? `No results matching "${searchQuery}"`
                  : "Upload your first document to get started"}
              </p>
              <Button onClick={() => setShowUploadModal(true)}>
                <i className="ri-upload-cloud-line mr-2"></i>
                Upload Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Document Upload Modal */}
      {showUploadModal && (
        <DocumentUpload isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
};

export default Documents;
