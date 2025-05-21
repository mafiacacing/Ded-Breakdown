import Tesseract from "tesseract.js";
import fs from "fs/promises";
import { storage } from "../storage";

class OcrService {
  /**
   * Process an image or document with OCR
   * @param filePath Path to the file to process
   * @param language Language code for OCR (default: 'eng')
   * @returns Extracted text
   */
  async processImage(filePath: string, language: string = 'eng'): Promise<string> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Process image with Tesseract
      const result = await Tesseract.recognize(filePath, language);
      
      return result.data.text;
    } catch (error) {
      console.error("OCR processing error:", error);
      throw new Error(`OCR processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Process a document and update its content in the database
   * @param filePath Path to the document file
   * @param documentId ID of the document in the database
   * @returns Extracted text
   */
  async processDocument(filePath: string, documentId: number): Promise<string> {
    try {
      // Get document information
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        throw new Error(`Document with ID ${documentId} not found`);
      }

      // Determine appropriate language based on document metadata (simplified example)
      const language = 'eng'; // Default to English
      
      // Process the document
      const text = await this.processImage(filePath, language);
      
      return text;
    } catch (error) {
      console.error("Document OCR processing error:", error);
      throw new Error(`Document OCR processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get supported languages for OCR
   * @returns Array of language codes and names
   */
  async getSupportedLanguages(): Promise<{ code: string, name: string }[]> {
    return [
      { code: 'eng', name: 'English' },
      { code: 'fra', name: 'French' },
      { code: 'deu', name: 'German' },
      { code: 'spa', name: 'Spanish' },
      { code: 'ita', name: 'Italian' },
      { code: 'por', name: 'Portuguese' },
      { code: 'rus', name: 'Russian' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'chi_sim', name: 'Chinese (Simplified)' },
      { code: 'chi_tra', name: 'Chinese (Traditional)' },
      { code: 'kor', name: 'Korean' },
      { code: 'ara', name: 'Arabic' },
      { code: 'hin', name: 'Hindi' },
    ];
  }
}

export const ocrService = new OcrService();
