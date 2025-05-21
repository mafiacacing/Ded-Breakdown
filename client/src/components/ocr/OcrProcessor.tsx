import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const OcrProcessor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [ocrLanguage, setOcrLanguage] = useState<string>("eng");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<string>("");
  
  // OCR processing mutation
  const processMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      setProcessProgress(0);
      
      // Simulate progress (in a real app, this would come from the OCR request)
      const progressInterval = setInterval(() => {
        setProcessProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 500);
      
      try {
        const formData = new FormData();
        
        if (activeTab === "upload" && selectedFile) {
          formData.append('file', selectedFile);
        } else if (activeTab === "existing" && selectedDocument) {
          formData.append('documentId', selectedDocument);
        } else {
          throw new Error("No file or document selected");
        }
        
        formData.append('language', ocrLanguage);
        
        const response = await fetch('/api/ocr/process', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`OCR processing failed: ${response.statusText}`);
        }
        
        clearInterval(progressInterval);
        setProcessProgress(100);
        
        const result = await response.json();
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "OCR processing complete",
        description: "Text has been successfully extracted",
        variant: "default",
      });
      
      // Update the OCR result
      setOcrResult(data.text || "No text extracted");
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "OCR processing failed",
        description: error.message,
        variant: "destructive",
      });
      setOcrResult("");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleProcessOcr = () => {
    if (activeTab === "upload" && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to process",
        variant: "destructive",
      });
      return;
    }
    
    if (activeTab === "existing" && !selectedDocument) {
      toast({
        title: "No document selected",
        description: "Please select an existing document to process",
        variant: "destructive",
      });
      return;
    }
    
    processMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OCR Processor</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="upload">Upload Image</TabsTrigger>
              <TabsTrigger value="existing">Existing Document</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center mb-4
                  ${selectedFile ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
                  ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                `}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {selectedFile ? (
                  <>
                    <i className="ri-image-line text-5xl text-green-500 mb-2"></i>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    <button 
                      type="button" 
                      className="mt-2 text-sm text-primary-600 hover:text-primary-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      disabled={isProcessing}
                    >
                      Change file
                    </button>
                  </>
                ) : (
                  <>
                    <i className="ri-image-add-line text-5xl text-gray-400 mb-2"></i>
                    <p className="font-medium text-gray-900">Drag and drop or click to select an image</p>
                    <p className="text-sm text-gray-500">JPG, PNG, TIFF, PDF (Max 10MB)</p>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.tiff,.pdf"
                  disabled={isProcessing}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="existing">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select a document</label>
                <Select 
                  value={selectedDocument} 
                  onValueChange={setSelectedDocument}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Financial Report Q2 2023.pdf</SelectItem>
                    <SelectItem value="2">Contract Scan - Vendor Agreement.jpg</SelectItem>
                    <SelectItem value="3">Invoice - August 2023.png</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OCR Language</label>
                <Select 
                  value={ocrLanguage} 
                  onValueChange={setOcrLanguage}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eng">English</SelectItem>
                    <SelectItem value="fra">French</SelectItem>
                    <SelectItem value="deu">German</SelectItem>
                    <SelectItem value="spa">Spanish</SelectItem>
                    <SelectItem value="ita">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Processing OCR...</span>
                    <span className="text-gray-700">{processProgress}%</span>
                  </div>
                  <Progress value={processProgress} className="h-2" />
                </div>
              )}
              
              <Button 
                onClick={handleProcessOcr}
                disabled={isProcessing || (activeTab === "upload" && !selectedFile) || (activeTab === "existing" && !selectedDocument)}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Process OCR'}
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {ocrResult && (
        <Card>
          <CardHeader>
            <CardTitle>OCR Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto border border-gray-200">
              <pre className="text-sm whitespace-pre-wrap">{ocrResult}</pre>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline">
                <i className="ri-file-copy-line mr-2"></i>
                Copy Text
              </Button>
              <Button>
                <i className="ri-save-line mr-2"></i>
                Save to Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OcrProcessor;
