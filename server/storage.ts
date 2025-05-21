import {
  type Document,
  type InsertDocument,
  type Analysis,
  type InsertAnalysis,
  type Activity,
  type InsertActivity,
  type ServiceConnection,
  type InsertServiceConnection,
  type User,
  type InsertUser,
  type Stats
} from "@shared/schema";
import { eq, desc, like, or, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { openaiService } from "./services/openai";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getRecentDocuments(limit: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  searchDocumentsByKeyword(query: string): Promise<Document[]>;
  searchDocumentsBySemantic(query: string, limit: number): Promise<Document[]>;
  searchDocumentsByHybrid(query: string, limit: number): Promise<Document[]>;

  // Analysis operations
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysesByDocument(documentId: number): Promise<Analysis[]>;
  getRecentAnalyses(limit: number): Promise<Analysis[]>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;

  // Activity operations
  getActivity(id: number): Promise<Activity | undefined>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Service connection operations
  getServiceConnections(): Promise<ServiceConnection[]>;
  getServiceConnection(id: number): Promise<ServiceConnection | undefined>;
  createServiceConnection(connection: InsertServiceConnection): Promise<ServiceConnection>;
  updateServiceConnection(id: number, connection: Partial<ServiceConnection>): Promise<ServiceConnection>;

  // Stats operations
  getStats(): Promise<Stats>;

  // API Keys operations
  getApiKey(service: string): Promise<string | null>;
  saveApiKey(service: string, key: string, url?: string): Promise<void>;
  getServiceToken(service: string): Promise<any | null>;
  saveServiceToken(service: string, token: any): Promise<void>;
}

// In-memory implementation for development
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private analyses: Map<number, Analysis>;
  private activities: Map<number, Activity>;
  private serviceConnections: Map<number, ServiceConnection>;
  private apiKeys: Map<string, string>;
  private serviceTokens: Map<string, any>;
  
  private currentUserId: number;
  private currentDocumentId: number;
  private currentAnalysisId: number;
  private currentActivityId: number;
  private currentServiceConnectionId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.analyses = new Map();
    this.activities = new Map();
    this.serviceConnections = new Map();
    this.apiKeys = new Map();
    this.serviceTokens = new Map();
    
    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentAnalysisId = 1;
    this.currentActivityId = 1;
    this.currentServiceConnectionId = 1;

    // Add some sample data
    this.setupSampleData();
  }

  private setupSampleData() {
    // Sample documents
    this.createDocument({
      name: "Financial Report Q2 2023.pdf",
      type: "application/pdf",
      size: 1258000,
      status: "processed",
      ocrProcessed: true,
      aiAnalyzed: true,
      content: "Sample content for financial report...",
      url: "/uploads/sample-financial-report.pdf"
    });

    this.createDocument({
      name: "Project Proposal - AI Implementation.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 438272,
      status: "processed",
      ocrProcessed: true,
      aiAnalyzed: true,
      content: "Sample content for project proposal...",
      url: "/uploads/sample-project-proposal.docx"
    });

    this.createDocument({
      name: "Contract Scan - Vendor Agreement.jpg",
      type: "image/jpeg",
      size: 3145728,
      status: "pending",
      ocrProcessed: false,
      aiAnalyzed: false,
      url: "/uploads/sample-contract-scan.jpg"
    });

    this.createDocument({
      name: "Inventory Analysis 2023.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 895000,
      status: "processed",
      ocrProcessed: true,
      aiAnalyzed: true,
      content: "Sample content for inventory analysis...",
      url: "/uploads/sample-inventory-analysis.xlsx"
    });

    // Sample analyses
    this.createAnalysis({
      documentId: 1,
      title: "Financial Report Summary",
      content: "Key financial indicators show 15% YoY growth with improved margins in Q2. EBITDA increased by 2.3 points compared to previous quarter.",
      model: "GPT-4o"
    });

    this.createAnalysis({
      documentId: 2,
      title: "Project Proposal Evaluation",
      content: "The AI implementation proposal outlines a 3-phase approach with estimated ROI of 25% within 6 months. Key areas of focus include customer service automation and predictive analytics.",
      model: "GPT-4o"
    });

    // Sample activities
    this.createActivity({
      type: "upload",
      description: "Document uploaded",
      documentId: 1,
      documentName: "Financial Report Q2 2023.pdf"
    });

    this.createActivity({
      type: "ocr",
      description: "OCR processing completed",
      documentId: 3,
      documentName: "Contract Scan - Vendor Agreement.jpg"
    });

    this.createActivity({
      type: "analysis",
      description: "AI analysis completed",
      documentId: 2,
      documentName: "Project Proposal - AI Implementation.docx"
    });

    this.createActivity({
      type: "notification",
      description: "Notification sent via Telegram",
      documentId: 1,
      documentName: "Financial Report Q2 2023.pdf"
    });

    this.createActivity({
      type: "integration",
      description: "Connected to Google Drive",
    });

    // Sample service connections
    this.createServiceConnection({
      type: "google_drive",
      name: "Google Drive",
      status: "connected"
    });

    this.createServiceConnection({
      type: "telegram",
      name: "Telegram Bot",
      status: "connected"
    });

    this.createServiceConnection({
      type: "openai",
      name: "OpenAI GPT-4o",
      status: "connected"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const user: User = { ...insertUser, id, createdAt, updatedAt };
    this.users.set(id, user);
    return user;
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async getRecentDocuments(limit: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const document: Document = { ...insertDocument, id, createdAt, updatedAt };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, updateData: Partial<Document>): Promise<Document> {
    const document = this.documents.get(id);
    if (!document) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    const updatedDocument = {
      ...document,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    if (!this.documents.has(id)) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    this.documents.delete(id);
    
    // Delete related analyses
    for (const [analysisId, analysis] of this.analyses.entries()) {
      if (analysis.documentId === id) {
        this.analyses.delete(analysisId);
      }
    }
    
    // Delete related activities
    for (const [activityId, activity] of this.activities.entries()) {
      if (activity.documentId === id) {
        this.activities.delete(activityId);
      }
    }
  }

  async searchDocumentsByKeyword(query: string): Promise<Document[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.documents.values())
      .filter(doc => {
        const nameMatch = doc.name.toLowerCase().includes(lowerQuery);
        const contentMatch = doc.content ? doc.content.toLowerCase().includes(lowerQuery) : false;
        return nameMatch || contentMatch;
      })
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async searchDocumentsBySemantic(query: string, limit: number): Promise<Document[]> {
    try {
      // In a real implementation, this would use pgvector to search by embeddings
      // For memory implementation, just use basic keyword search
      const results = await this.searchDocumentsByKeyword(query);
      return results.slice(0, limit);
    } catch (error) {
      console.error("Semantic search error:", error);
      throw new Error(`Semantic search failed: ${(error as Error).message}`);
    }
  }

  async searchDocumentsByHybrid(query: string, limit: number): Promise<Document[]> {
    try {
      // In a real implementation, this would combine vector and keyword search
      // For memory implementation, just use basic keyword search
      const results = await this.searchDocumentsByKeyword(query);
      return results.slice(0, limit);
    } catch (error) {
      console.error("Hybrid search error:", error);
      throw new Error(`Hybrid search failed: ${(error as Error).message}`);
    }
  }

  // Analysis operations
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getAnalysesByDocument(documentId: number): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .filter(analysis => analysis.documentId === documentId)
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async getRecentAnalyses(limit: number): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentAnalysisId++;
    const createdAt = new Date().toISOString();
    const analysis: Analysis = { ...insertAnalysis, id, createdAt };
    this.analyses.set(id, analysis);
    return analysis;
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const createdAt = new Date().toISOString();
    const activity: Activity = { ...insertActivity, id, createdAt };
    this.activities.set(id, activity);
    return activity;
  }

  // Service connection operations
  async getServiceConnections(): Promise<ServiceConnection[]> {
    return Array.from(this.serviceConnections.values());
  }

  async getServiceConnection(id: number): Promise<ServiceConnection | undefined> {
    return this.serviceConnections.get(id);
  }

  async createServiceConnection(insertConnection: InsertServiceConnection): Promise<ServiceConnection> {
    const id = this.currentServiceConnectionId++;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const connection: ServiceConnection = { ...insertConnection, id, createdAt, updatedAt };
    this.serviceConnections.set(id, connection);
    return connection;
  }

  async updateServiceConnection(id: number, updateData: Partial<ServiceConnection>): Promise<ServiceConnection> {
    const connection = this.serviceConnections.get(id);
    if (!connection) {
      throw new Error(`Service connection with ID ${id} not found`);
    }
    
    const updatedConnection = {
      ...connection,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    this.serviceConnections.set(id, updatedConnection);
    return updatedConnection;
  }

  // Stats operations
  async getStats(): Promise<Stats> {
    return {
      documentsProcessed: this.documents.size,
      ocrScans: Array.from(this.documents.values()).filter(doc => doc.ocrProcessed).length,
      aiAnalyses: this.analyses.size,
      storageUsed: Array.from(this.documents.values()).reduce((total, doc) => total + doc.size, 0),
      storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB
    };
  }

  // API Keys operations
  async getApiKey(service: string): Promise<string | null> {
    return this.apiKeys.get(service) || null;
  }

  async saveApiKey(service: string, key: string, url?: string): Promise<void> {
    this.apiKeys.set(service, key);
    if (url) {
      this.apiKeys.set(`${service}_url`, url);
    }
  }

  async getServiceToken(service: string): Promise<any | null> {
    return this.serviceTokens.get(service) || null;
  }

  async saveServiceToken(service: string, token: any): Promise<void> {
    this.serviceTokens.set(service, token);
  }
}

// Database implementation using Drizzle ORM with PostgreSQL
export class DatabaseStorage implements IStorage {
  private db: any;

  constructor() {
    // Initialize database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    
    const pool = new Pool({ connectionString });
    this.db = drizzle(pool);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const users = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return users[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await this.db.insert(schema.users).values(insertUser).returning();
    return users[0];
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    const documents = await this.db.select().from(schema.documents).where(eq(schema.documents.id, id)).limit(1);
    return documents[0];
  }

  async getAllDocuments(): Promise<Document[]> {
    return await this.db.select().from(schema.documents).orderBy(desc(schema.documents.createdAt));
  }

  async getRecentDocuments(limit: number): Promise<Document[]> {
    return await this.db.select().from(schema.documents).orderBy(desc(schema.documents.createdAt)).limit(limit);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const documents = await this.db.insert(schema.documents).values(insertDocument).returning();
    return documents[0];
  }

  async updateDocument(id: number, updateData: Partial<Document>): Promise<Document> {
    const documents = await this.db
      .update(schema.documents)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(schema.documents.id, id))
      .returning();
    
    if (documents.length === 0) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    return documents[0];
  }

  async deleteDocument(id: number): Promise<void> {
    // First delete related analyses and activities
    await this.db.delete(schema.analyses).where(eq(schema.analyses.documentId, id));
    await this.db.delete(schema.activities).where(eq(schema.activities.documentId, id));
    
    // Then delete the document
    const result = await this.db.delete(schema.documents).where(eq(schema.documents.id, id)).returning();
    
    if (result.length === 0) {
      throw new Error(`Document with ID ${id} not found`);
    }
  }

  async searchDocumentsByKeyword(query: string): Promise<Document[]> {
    // Basic keyword search using LIKE
    return await this.db
      .select()
      .from(schema.documents)
      .where(
        or(
          like(schema.documents.name, `%${query}%`),
          like(schema.documents.content || "", `%${query}%`)
        )
      )
      .orderBy(desc(schema.documents.createdAt));
  }

  async searchDocumentsBySemantic(query: string, limit: number): Promise<Document[]> {
    try {
      // Generate embedding for the query
      const embedding = await openaiService.generateEmbedding(query);
      
      // Search using pgvector
      // Note: This assumes a pgvector extension setup with embedding column
      // This is a simplified example and may need adjustments based on actual schema
      const result = await this.db.execute(
        `SELECT d.*, embedding <-> $1 as similarity 
         FROM documents d 
         WHERE d.embedding IS NOT NULL 
         ORDER BY similarity 
         LIMIT $2`,
        [embedding, limit]
      );
      
      return result;
    } catch (error) {
      console.error("Semantic search error:", error);
      throw new Error(`Semantic search failed: ${(error as Error).message}`);
    }
  }

  async searchDocumentsByHybrid(query: string, limit: number): Promise<Document[]> {
    try {
      // Hybrid search combining keyword and vector search
      // Generate embedding for the query
      const embedding = await openaiService.generateEmbedding(query);
      
      // Hybrid search using both pgvector similarity and keyword matching
      // This is a simplified example and may need adjustments based on actual schema
      const result = await this.db.execute(
        `SELECT d.*, 
          embedding <-> $1 as vector_similarity,
          ts_rank(to_tsvector('english', coalesce(d.content, '') || ' ' || d.name), to_tsquery('english', $2)) as text_rank,
          (embedding <-> $1) * 0.7 + (1 - ts_rank(to_tsvector('english', coalesce(d.content, '') || ' ' || d.name), to_tsquery('english', $2))) * 0.3 as hybrid_score
         FROM documents d 
         WHERE d.embedding IS NOT NULL 
           AND (to_tsvector('english', coalesce(d.content, '') || ' ' || d.name) @@ to_tsquery('english', $2)
             OR (embedding <-> $1) < 0.7)
         ORDER BY hybrid_score
         LIMIT $3`,
        [embedding, query.split(" ").join(" & "), limit]
      );
      
      return result;
    } catch (error) {
      console.error("Hybrid search error:", error);
      throw new Error(`Hybrid search failed: ${(error as Error).message}`);
    }
  }

  // Analysis operations
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const analyses = await this.db.select().from(schema.analyses).where(eq(schema.analyses.id, id)).limit(1);
    return analyses[0];
  }

  async getAnalysesByDocument(documentId: number): Promise<Analysis[]> {
    return await this.db
      .select()
      .from(schema.analyses)
      .where(eq(schema.analyses.documentId, documentId))
      .orderBy(desc(schema.analyses.createdAt));
  }

  async getRecentAnalyses(limit: number): Promise<Analysis[]> {
    return await this.db.select().from(schema.analyses).orderBy(desc(schema.analyses.createdAt)).limit(limit);
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const analyses = await this.db.insert(schema.analyses).values(insertAnalysis).returning();
    return analyses[0];
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    const activities = await this.db.select().from(schema.activities).where(eq(schema.activities.id, id)).limit(1);
    return activities[0];
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return await this.db.select().from(schema.activities).orderBy(desc(schema.activities.createdAt)).limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activities = await this.db.insert(schema.activities).values(insertActivity).returning();
    return activities[0];
  }

  // Service connection operations
  async getServiceConnections(): Promise<ServiceConnection[]> {
    return await this.db.select().from(schema.serviceConnections);
  }

  async getServiceConnection(id: number): Promise<ServiceConnection | undefined> {
    const connections = await this.db.select().from(schema.serviceConnections).where(eq(schema.serviceConnections.id, id)).limit(1);
    return connections[0];
  }

  async createServiceConnection(insertConnection: InsertServiceConnection): Promise<ServiceConnection> {
    const connections = await this.db.insert(schema.serviceConnections).values(insertConnection).returning();
    return connections[0];
  }

  async updateServiceConnection(id: number, updateData: Partial<ServiceConnection>): Promise<ServiceConnection> {
    const connections = await this.db
      .update(schema.serviceConnections)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(schema.serviceConnections.id, id))
      .returning();
    
    if (connections.length === 0) {
      throw new Error(`Service connection with ID ${id} not found`);
    }
    
    return connections[0];
  }

  // Stats operations
  async getStats(): Promise<Stats> {
    // Get document count
    const documentsCount = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.documents);

    // Get OCR-processed document count
    const ocrCount = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.documents)
      .where(eq(schema.documents.ocrProcessed, true));

    // Get analyses count
    const analysesCount = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.analyses);

    // Get storage used
    const storageQuery = await this.db
      .select({ total: sql`sum(size)` })
      .from(schema.documents);

    return {
      documentsProcessed: documentsCount[0].count || 0,
      ocrScans: ocrCount[0].count || 0,
      aiAnalyses: analysesCount[0].count || 0,
      storageUsed: storageQuery[0].total || 0,
      storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB
    };
  }

  // API Keys operations
  async getApiKey(service: string): Promise<string | null> {
    const keys = await this.db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.service, service))
      .limit(1);
    
    return keys.length > 0 ? keys[0].key : null;
  }

  async saveApiKey(service: string, key: string, url?: string): Promise<void> {
    // Check if key already exists
    const existingKey = await this.db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.service, service))
      .limit(1);
    
    if (existingKey.length > 0) {
      // Update existing key
      await this.db
        .update(schema.apiKeys)
        .set({ key, updatedAt: new Date().toISOString() })
        .where(eq(schema.apiKeys.service, service));
    } else {
      // Insert new key
      await this.db
        .insert(schema.apiKeys)
        .values({ service, key });
    }
    
    // Save URL if provided
    if (url) {
      await this.saveApiKey(`${service}_url`, url);
    }
  }

  async getServiceToken(service: string): Promise<any | null> {
    const tokens = await this.db
      .select()
      .from(schema.serviceTokens)
      .where(eq(schema.serviceTokens.service, service))
      .limit(1);
    
    return tokens.length > 0 ? JSON.parse(tokens[0].token) : null;
  }

  async saveServiceToken(service: string, token: any): Promise<void> {
    // Check if token already exists
    const existingToken = await this.db
      .select()
      .from(schema.serviceTokens)
      .where(eq(schema.serviceTokens.service, service))
      .limit(1);
    
    const tokenString = JSON.stringify(token);
    
    if (existingToken.length > 0) {
      // Update existing token
      await this.db
        .update(schema.serviceTokens)
        .set({ token: tokenString, updatedAt: new Date().toISOString() })
        .where(eq(schema.serviceTokens.service, service));
    } else {
      // Insert new token
      await this.db
        .insert(schema.serviceTokens)
        .values({ service, token: tokenString });
    }
  }
}

// Export memory implementation for development
export const storage = new MemStorage();

// For production, use the database implementation:
// export const storage = new DatabaseStorage();
