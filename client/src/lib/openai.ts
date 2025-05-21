import { apiRequest } from "./queryClient";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

interface AnalyzeDocumentParams {
  documentId: number;
  prompt?: string;
}

interface AnalyzeDocumentResult {
  id: number;
  title: string;
  content: string;
  model: string;
  createdAt: string;
}

/**
 * Request an AI analysis of a document
 */
export async function analyzeDocument(params: AnalyzeDocumentParams): Promise<AnalyzeDocumentResult> {
  const response = await apiRequest('POST', '/api/ai/analyze', params);
  return await response.json();
}

interface GenerateEmbeddingParams {
  text: string;
}

interface GenerateEmbeddingResult {
  embedding: number[];
}

/**
 * Generate embedding vectors for text
 */
export async function generateEmbedding(params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResult> {
  const response = await apiRequest('POST', '/api/ai/embedding', params);
  return await response.json();
}

interface SemanticSearchParams {
  query: string;
  limit?: number;
}

/**
 * Perform semantic search using vector embeddings
 */
export async function semanticSearch(params: SemanticSearchParams): Promise<any[]> {
  const response = await apiRequest('POST', '/api/search/semantic', params);
  return await response.json();
}

/**
 * Perform hybrid search using keywords and vector embeddings
 */
export async function hybridSearch(params: SemanticSearchParams): Promise<any[]> {
  const response = await apiRequest('POST', '/api/search/hybrid', params);
  return await response.json();
}
