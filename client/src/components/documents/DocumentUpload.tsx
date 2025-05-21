import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storeInDrive, setStoreInDrive] = useState(false);
  const [runOcr, setRunOcr] = useState(true);
  const [runAnalysis, setRunAnalysis] = useState(false);

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) return null;
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('storeInDrive', storeInDrive.toString());
      formData.append('runOcr', runOcr.toString());
      formData.append('runAnalysis', runAnalysis.toString());
      
      setIsUploading(true);
      
      // Simulate progress (in a real app, this would come from the upload request)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      try {
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `${selectedFile?.name} was uploaded successfully`,
        variant: "default",
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      // Reset form
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
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

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate();
  };

  const handleCancel = () => {
    if (isUploading) {
      if (window.confirm("Cancel upload?")) {
        // In a real app, you would abort the fetch request here
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* File selection area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center
              ${selectedFile ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
              ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
            `}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {selectedFile ? (
              <>
                <i className={`text-5xl mb-2 ${selectedFile.type.includes('pdf') ? 'ri-file-pdf-line text-red-500' : 
                  selectedFile.type.includes('image') ? 'ri-image-line text-green-500' : 'ri-file-line text-blue-500'}`}></i>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                <button 
                  type="button" 
                  className="mt-2 text-sm text-primary-600 hover:text-primary-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  disabled={isUploading}
                >
                  Change file
                </button>
              </>
            ) : (
              <>
                <i className="ri-upload-cloud-line text-5xl text-gray-400 mb-2"></i>
                <p className="font-medium text-gray-900">Drag and drop or click to select</p>
                <p className="text-sm text-gray-500">PDF, Word, Excel, Images (Max 10MB)</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              disabled={isUploading}
            />
          </div>
          
          {/* Upload options */}
          {selectedFile && (
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="storeInDrive"
                  className="mr-2"
                  checked={storeInDrive}
                  onChange={(e) => setStoreInDrive(e.target.checked)}
                  disabled={isUploading}
                />
                <label htmlFor="storeInDrive" className="text-sm text-gray-700">Store in Google Drive</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="runOcr"
                  className="mr-2"
                  checked={runOcr}
                  onChange={(e) => setRunOcr(e.target.checked)}
                  disabled={isUploading}
                />
                <label htmlFor="runOcr" className="text-sm text-gray-700">Run OCR after upload</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="runAnalysis"
                  className="mr-2"
                  checked={runAnalysis}
                  onChange={(e) => setRunAnalysis(e.target.checked)}
                  disabled={isUploading || !runOcr}
                />
                <label htmlFor="runAnalysis" className={`text-sm ${!runOcr ? 'text-gray-400' : 'text-gray-700'}`}>
                  Run AI Analysis after OCR
                </label>
              </div>
            </div>
          )}
          
          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Uploading...</span>
                <span className="text-gray-700">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isUploading && uploadProgress < 100}
          >
            {isUploading && uploadProgress < 100 ? 'Cancel' : 'Close'}
          </Button>
          <Button 
            type="button" 
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUpload;
