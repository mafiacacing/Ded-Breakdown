import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { analyzeDocument } from "@/lib/openai";
import type { Document, Analysis } from "@/types";

const AnalysisPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("new");
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<Analysis | null>(null);
  
  // Fetch documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch recent analyses
  const { data: analyses, isLoading: isLoadingAnalyses } = useQuery<Analysis[]>({
    queryKey: ['/api/analyses/recent'],
    staleTime: 60000, // 1 minute
  });
  
  const handleAnalyze = async () => {
    if (!selectedDocument) {
      toast({
        title: "No document selected",
        description: "Please select a document to analyze",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const result = await analyzeDocument({
        documentId: parseInt(selectedDocument),
        prompt: customPrompt || undefined,
      });
      
      setAnalysisResult(result);
      toast({
        title: "Analysis complete",
        description: "Document has been successfully analyzed",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleViewAnalysis = (analysis: Analysis) => {
    setAnalysisResult(analysis);
    setSelectedTab("result");
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Analysis</h1>
        <p className="text-sm text-gray-600">Analyze documents using AI to extract insights</p>
      </div>
      
      {/* Analysis interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <Tabs defaultValue="new" value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                  <TabsTrigger value="new">New Analysis</TabsTrigger>
                  {analysisResult && <TabsTrigger value="result">Analysis Result</TabsTrigger>}
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-6">
              <TabsContent value="new" className="space-y-4 mt-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Document</label>
                  {isLoadingDocuments ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select 
                      value={selectedDocument} 
                      onValueChange={setSelectedDocument}
                      disabled={isAnalyzing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents?.filter(doc => doc.ocrProcessed).map((doc) => (
                          <SelectItem key={doc.id} value={doc.id.toString()}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Analysis Prompt (Optional)
                  </label>
                  <Textarea
                    placeholder="Provide specific instructions for the AI analysis, e.g., 'Summarize key points and identify action items'"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={4}
                    disabled={isAnalyzing}
                    className="resize-y"
                  />
                </div>
                
                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !selectedDocument}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="ri-robot-line mr-2"></i>
                      Run AI Analysis
                    </>
                  )}
                </Button>
              </TabsContent>
              
              <TabsContent value="result" className="mt-0">
                {analysisResult ? (
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{analysisResult.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(analysisResult.createdAt).toLocaleString()} • {analysisResult.model}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">AI Analysis</span>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                      <pre className="whitespace-pre-wrap text-sm font-normal">{analysisResult.content}</pre>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline">
                        <i className="ri-file-copy-line mr-2"></i>
                        Copy
                      </Button>
                      <Button variant="outline">
                        <i className="ri-download-line mr-2"></i>
                        Export
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="ri-error-warning-line text-3xl mb-2 block"></i>
                    <p>Analysis result not available</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-lg">Recent Analyses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingAnalyses ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : analyses && analyses.length > 0 ? (
                <div>
                  {analyses.map((analysis) => (
                    <div 
                      key={analysis.id}
                      className="p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                      onClick={() => handleViewAnalysis(analysis)}
                    >
                      <h4 className="font-medium text-gray-900 truncate">{analysis.title}</h4>
                      <p className="text-xs text-gray-500">
                        {new Date(analysis.createdAt).toLocaleDateString()} • {analysis.model}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>No analyses yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
