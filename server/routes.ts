import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { ocrService } from "./services/ocr";
import { openaiService } from "./services/openai";
import { gdriveService } from "./services/gdrive";
import { telegramService } from "./services/telegram";

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.resolve(process.cwd(), "uploads");
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error as Error, uploadDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/documents/recent", async (req, res) => {
    try {
      const documents = await storage.getRecentDocuments(5);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await storage.deleteDocument(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      const storeInDrive = req.body.storeInDrive === "true";
      const runOcr = req.body.runOcr === "true";
      const runAnalysis = req.body.runAnalysis === "true";

      // Save document to database
      const document = await storage.createDocument({
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        status: "pending",
        ocrProcessed: false,
        aiAnalyzed: false,
        url: `/uploads/${file.filename}`,
      });

      // Store in Google Drive if requested
      if (storeInDrive) {
        try {
          const driveFile = await gdriveService.uploadFile(file.path, file.originalname);
          await storage.updateDocument(document.id, {
            driveId: driveFile.id,
          });
        } catch (error) {
          console.error("Failed to upload to Google Drive:", error);
          // Continue with local processing even if Drive upload fails
        }
      }

      // Create activity record
      await storage.createActivity({
        type: "upload",
        description: "Document uploaded",
        documentId: document.id,
        documentName: document.name,
      });

      // Process OCR if requested
      if (runOcr) {
        // Update status
        await storage.updateDocument(document.id, { status: "analyzing" });

        // Process OCR asynchronously
        ocrService.processDocument(file.path, document.id).then(async (text) => {
          // Update document with OCR results
          await storage.updateDocument(document.id, {
            content: text,
            status: "processed",
            ocrProcessed: true,
          });

          // Create activity record
          await storage.createActivity({
            type: "ocr",
            description: "OCR processing completed",
            documentId: document.id,
            documentName: document.name,
          });

          // Send notification
          try {
            await telegramService.sendNotification({
              type: "ocrComplete",
              documentName: document.name,
            });
          } catch (error) {
            console.error("Failed to send notification:", error);
          }

          // Run AI analysis if requested
          if (runAnalysis) {
            try {
              const analysis = await openaiService.analyzeDocument(document.id, text);
              await storage.createAnalysis({
                documentId: document.id,
                title: `Analysis of ${document.name}`,
                content: analysis,
                model: "gpt-4o",
              });

              // Update document status
              await storage.updateDocument(document.id, { aiAnalyzed: true });

              // Create activity record
              await storage.createActivity({
                type: "analysis",
                description: "AI analysis completed",
                documentId: document.id,
                documentName: document.name,
              });

              // Send notification
              try {
                await telegramService.sendNotification({
                  type: "analysisComplete",
                  documentName: document.name,
                });
              } catch (error) {
                console.error("Failed to send notification:", error);
              }
            } catch (error) {
              console.error("Failed to run AI analysis:", error);
            }
          }
        }).catch(async (error) => {
          console.error("OCR processing failed:", error);
          await storage.updateDocument(document.id, { status: "error" });
        });
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // OCR routes
  app.post("/api/documents/:id/ocr", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.url) {
        return res.status(400).json({ error: "Document has no file URL" });
      }

      // Update status
      await storage.updateDocument(documentId, { status: "analyzing" });

      // Process OCR asynchronously
      ocrService.processDocument(path.join(process.cwd(), document.url), documentId)
        .then(async (text) => {
          // Update document with OCR results
          await storage.updateDocument(documentId, {
            content: text,
            status: "processed",
            ocrProcessed: true,
          });

          // Create activity record
          await storage.createActivity({
            type: "ocr",
            description: "OCR processing completed",
            documentId: document.id,
            documentName: document.name,
          });

          // Send notification
          try {
            await telegramService.sendNotification({
              type: "ocrComplete",
              documentName: document.name,
            });
          } catch (error) {
            console.error("Failed to send notification:", error);
          }
        })
        .catch(async (error) => {
          console.error("OCR processing failed:", error);
          await storage.updateDocument(documentId, { status: "error" });
        });

      res.json({ success: true, message: "OCR processing started" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/ocr/process", upload.single("file"), async (req, res) => {
    try {
      let filePath;
      let documentId;

      if (req.file) {
        // Process uploaded file
        filePath = req.file.path;
      } else if (req.body.documentId) {
        // Process existing document
        documentId = parseInt(req.body.documentId);
        const document = await storage.getDocument(documentId);
        
        if (!document) {
          return res.status(404).json({ error: "Document not found" });
        }

        if (!document.url) {
          return res.status(400).json({ error: "Document has no file URL" });
        }

        filePath = path.join(process.cwd(), document.url);
      } else {
        return res.status(400).json({ error: "No file or document ID provided" });
      }

      const language = req.body.language || "eng";
      const text = await ocrService.processImage(filePath, language);

      // If processing an existing document, update it
      if (documentId) {
        await storage.updateDocument(documentId, {
          content: text,
          status: "processed",
          ocrProcessed: true,
        });

        const document = await storage.getDocument(documentId);
        if (document) {
          // Create activity record
          await storage.createActivity({
            type: "ocr",
            description: "OCR processing completed",
            documentId,
            documentName: document.name,
          });

          // Send notification
          try {
            await telegramService.sendNotification({
              type: "ocrComplete",
              documentName: document.name,
            });
          } catch (error) {
            console.error("Failed to send notification:", error);
          }
        }
      }

      res.json({ text });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Analysis routes
  app.get("/api/analyses/recent", async (req, res) => {
    try {
      const analyses = await storage.getRecentAnalyses(5);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/documents/:id/analyze", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.content) {
        return res.status(400).json({ error: "Document has no content to analyze" });
      }

      // Update status
      await storage.updateDocument(documentId, { status: "analyzing" });

      // Analyze document
      const analysisText = await openaiService.analyzeDocument(documentId, document.content, req.body.prompt);
      
      // Create analysis record
      const analysis = await storage.createAnalysis({
        documentId: document.id,
        title: `Analysis of ${document.name}`,
        content: analysisText,
        model: "gpt-4o",
      });

      // Update document status
      await storage.updateDocument(documentId, { 
        status: "processed",
        aiAnalyzed: true 
      });

      // Create activity record
      await storage.createActivity({
        type: "analysis",
        description: "AI analysis completed",
        documentId: document.id,
        documentName: document.name,
      });

      // Send notification
      try {
        await telegramService.sendNotification({
          type: "analysisComplete",
          documentName: document.name,
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { documentId, prompt } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ error: "Document ID is required" });
      }

      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (!document.content) {
        return res.status(400).json({ error: "Document has no content to analyze" });
      }

      // Analyze document
      const analysisText = await openaiService.analyzeDocument(documentId, document.content, prompt);
      
      // Create analysis record
      const analysis = await storage.createAnalysis({
        documentId: document.id,
        title: `Analysis of ${document.name}`,
        content: analysisText,
        model: "gpt-4o",
      });

      // Update document status
      await storage.updateDocument(documentId, { aiAnalyzed: true });

      // Create activity record
      await storage.createActivity({
        type: "analysis",
        description: "AI analysis completed",
        documentId: document.id,
        documentName: document.name,
      });

      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/ai/embedding", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const embedding = await openaiService.generateEmbedding(text);
      res.json({ embedding });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Search routes
  app.get("/api/search/keyword", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await storage.searchDocumentsByKeyword(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/search/semantic", async (req, res) => {
    try {
      const { query, limit } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await storage.searchDocumentsBySemantic(query, limit || 10);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/search/hybrid", async (req, res) => {
    try {
      const { query, limit } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const results = await storage.searchDocumentsByHybrid(query, limit || 10);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Activities routes
  app.get("/api/activities/recent", async (req, res) => {
    try {
      const activities = await storage.getRecentActivities(5);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Service connections routes
  app.get("/api/connections", async (req, res) => {
    try {
      const connections = await storage.getServiceConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Google Drive routes
  app.get("/api/drive/status", async (req, res) => {
    try {
      const status = await gdriveService.getAuthStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/drive/auth", async (req, res) => {
    try {
      const authUrl = await gdriveService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/drive/files", async (req, res) => {
    try {
      const folderId = req.query.folderId as string;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
      const pageToken = req.query.pageToken as string;

      const files = await gdriveService.listFiles(folderId, pageSize, pageToken);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/drive/import", async (req, res) => {
    try {
      const { fileId } = req.body;
      
      if (!fileId) {
        return res.status(400).json({ error: "File ID is required" });
      }

      const documentId = await gdriveService.importFile(fileId);
      res.json({ documentId });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Telegram routes
  app.get("/api/telegram/status", async (req, res) => {
    try {
      const status = await telegramService.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/telegram/connect", async (req, res) => {
    try {
      const result = await telegramService.connect();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/telegram/disconnect", async (req, res) => {
    try {
      await telegramService.disconnect();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/telegram/settings", async (req, res) => {
    try {
      const settings = await telegramService.getNotificationSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/telegram/settings", async (req, res) => {
    try {
      const settings = await telegramService.updateNotificationSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Settings routes
  app.post("/api/settings/api-keys", async (req, res) => {
    try {
      const { service, key, url } = req.body;
      
      if (!service || !key) {
        return res.status(400).json({ error: "Service and key are required" });
      }

      await storage.saveApiKey(service, key, url);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
