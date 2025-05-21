import React from "react";
import OcrProcessor from "@/components/ocr/OcrProcessor";

const Ocr: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">OCR Processing</h1>
        <p className="text-sm text-gray-600">Extract text from images and documents</p>
      </div>
      
      {/* OCR processor component */}
      <OcrProcessor />
    </div>
  );
};

export default Ocr;
