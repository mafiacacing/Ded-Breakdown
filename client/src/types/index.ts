// Document types
export interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  status: 'processed' | 'pending' | 'analyzing' | 'error';
  ocrProcessed: boolean;
  aiAnalyzed: boolean;
  createdAt: string;
  updatedAt: string;
  content?: string;
  url?: string;
  thumbnailUrl?: string;
  driveId?: string;
}

export interface InsertDocument {
  name: string;
  type: string;
  size: number;
  status: 'processed' | 'pending' | 'analyzing' | 'error';
  ocrProcessed: boolean;
  aiAnalyzed: boolean;
  content?: string;
  url?: string;
  thumbnailUrl?: string;
  driveId?: string;
}

// Analysis types
export interface Analysis {
  id: number;
  documentId: number;
  title: string;
  content: string;
  model: string;
  createdAt: string;
}

export interface InsertAnalysis {
  documentId: number;
  title: string;
  content: string;
  model: string;
}

// Activity types
export interface Activity {
  id: number;
  type: 'upload' | 'ocr' | 'analysis' | 'notification' | 'integration';
  description: string;
  documentId?: number;
  documentName?: string;
  createdAt: string;
}

export interface InsertActivity {
  type: 'upload' | 'ocr' | 'analysis' | 'notification' | 'integration';
  description: string;
  documentId?: number;
  documentName?: string;
}

// Stats types
export interface Stats {
  documentsProcessed: number;
  ocrScans: number;
  aiAnalyses: number;
  storageUsed: number;
  storageLimit: number;
}

// Service Connection types
export interface ServiceConnection {
  id: number;
  type: 'google_drive' | 'telegram' | 'openai';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface InsertServiceConnection {
  type: 'google_drive' | 'telegram' | 'openai';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
}

// User type
export interface ExtendedUser extends User {
  avatar?: string;
  role: string;
}
