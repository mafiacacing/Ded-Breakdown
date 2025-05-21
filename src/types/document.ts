/**
 * Interface untuk data dokumen
 */
export interface DocumentData {
  id: string;
  name: string;
  size: number;
  type: string;
  project_id: string;
  uploaded_at: string;
  ocr_text?: string;
  summary?: string;
  classification?: string;
  embedding?: number[];
  status: DocumentStatus;
  path?: string;
  user_id: string;
  metadata?: DocumentMetadata;
  tags?: string[];
}

/**
 * Status dokumen dalam sistem
 */
export type DocumentStatus = 
  | 'uploaded'     // Baru diunggah, belum diproses
  | 'processing'   // Sedang diproses (OCR/analisis)
  | 'completed'    // Selesai diproses
  | 'failed'       // Gagal diproses
  | 'deleted';     // Sudah dihapus

/**
 * Metadata tambahan untuk dokumen
 */
export interface DocumentMetadata {
  page_count?: number;
  author?: string;
  created_date?: string;
  modified_date?: string;
  keywords?: string[];
  language?: string;
  confidence_score?: number;
}

/**
 * Interface untuk hasil analisis dokumen
 */
export interface DocumentAnalysis {
  id: string;
  document_id: string;
  type: AnalysisType;
  content: string;
  created_at: string;
  model?: string;
}

/**
 * Tipe analisis yang tersedia
 */
export type AnalysisType = 
  | 'summary'        // Ringkasan dokumen
  | 'classification' // Klasifikasi dokumen
  | 'extraction'     // Ekstraksi data terstruktur
  | 'qa'             // Question answering
  | 'translation';   // Terjemahan