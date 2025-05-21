import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

class OpenAIService {
  private openai: OpenAI;
  private initialized: boolean = false;

  constructor() {
    // Initialize with environment variables if available
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.initialized = true;
    } else {
      this.openai = new OpenAI({ apiKey: "placeholder" }); // Will be updated when API key is set
    }
  }

  /**
   * Ensure the OpenAI client is initialized with a valid API key
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to get API key from database
      const apiKey = await storage.getApiKey("openai");
      
      if (!apiKey) {
        throw new Error("OpenAI API key not found");
      }
      
      this.openai = new OpenAI({ apiKey });
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize OpenAI client: ${(error as Error).message}`);
    }
  }

  /**
   * Analyze a document using GPT-4o
   * @param documentId ID of the document to analyze
   * @param text Document text content
   * @param customPrompt Optional custom prompt to guide the analysis
   * @returns Analysis result text
   */
  async analyzeDocument(documentId: number, text: string, customPrompt?: string): Promise<string> {
    await this.ensureInitialized();

    try {
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        throw new Error(`Document with ID ${documentId} not found`);
      }

      // Prepare a system prompt based on document type and custom prompt
      let systemPrompt = "You are an AI assistant tasked with analyzing documents. ";
      
      if (document.type.includes("pdf") || document.type.includes("doc")) {
        systemPrompt += "This is a document that may contain business or technical information. ";
      } else if (document.type.includes("image")) {
        systemPrompt += "This is text extracted from an image using OCR. There might be some errors in the text. ";
      }

      systemPrompt += "Please analyze the content thoroughly and provide a comprehensive summary including: \n";
      systemPrompt += "1. Key points and main ideas\n";
      systemPrompt += "2. Important details and findings\n";
      systemPrompt += "3. Any recommendations or action items\n";
      systemPrompt += "4. Critical information that requires attention\n\n";
      
      if (customPrompt) {
        systemPrompt += "Additionally, the user has requested the following specific analysis: " + customPrompt;
      }

      const response = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        max_tokens: 2000,
        temperature: 0.3, // More deterministic for analysis
      });

      return response.choices[0].message.content || "No analysis generated";
    } catch (error) {
      console.error("Document analysis error:", error);
      throw new Error(`Document analysis failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate an embedding vector for the given text
   * @param text Text to embed
   * @returns Embedding vector as array of numbers
   */
  async generateEmbedding(text: string): Promise<number[]> {
    await this.ensureInitialized();
    
    try {
      // Truncate text if necessary (OpenAI has token limits)
      const truncatedText = text.slice(0, 8000);
      
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: truncatedText,
        encoding_format: "float",
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error("Embedding generation error:", error);
      throw new Error(`Embedding generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Extract specific information from a document using a structured format
   * @param text Document text content
   * @param schema JSON schema describing the desired output format
   * @returns Structured information extracted from the document
   */
  async extractStructuredInfo(text: string, schema: any): Promise<any> {
    await this.ensureInitialized();
    
    try {
      const prompt = `Extract the following information from the provided text according to this schema: ${JSON.stringify(schema)}`;
      
      const response = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [
          { 
            role: "system", 
            content: "You are a document information extraction assistant. Extract the requested information in JSON format according to the schema provided."
          },
          { role: "user", content: prompt },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      });
      
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("Structured information extraction error:", error);
      throw new Error(`Information extraction failed: ${(error as Error).message}`);
    }
  }

  /**
   * Ask a specific question about a document
   * @param text Document text content
   * @param question Question to answer about the document
   * @returns Answer to the question
   */
  async askQuestion(text: string, question: string): Promise<string> {
    await this.ensureInitialized();
    
    try {
      const response = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [
          { 
            role: "system", 
            content: "You are a document analysis assistant. Answer the user's question based solely on the provided document content. If the answer cannot be determined from the document, say so clearly."
          },
          { 
            role: "user", 
            content: `Document content: ${text}\n\nQuestion: ${question}`
          }
        ],
        temperature: 0.3,
      });
      
      return response.choices[0].message.content || "Unable to answer the question based on the document.";
    } catch (error) {
      console.error("Question answering error:", error);
      throw new Error(`Question answering failed: ${(error as Error).message}`);
    }
  }
}

export const openaiService = new OpenAIService();
