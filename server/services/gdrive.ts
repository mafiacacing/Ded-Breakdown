import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";
import { storage } from "../storage";

class GoogleDriveService {
  private oauth2Client: any;
  private drive: any;
  private initialized: boolean = false;

  // OAuth configuration
  private CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  private CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  private REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/drive/callback";
  private SCOPES = ["https://www.googleapis.com/auth/drive.file"];

  constructor() {
    // Initialize oauth client
    this.oauth2Client = new google.auth.OAuth2(
      this.CLIENT_ID,
      this.CLIENT_SECRET,
      this.REDIRECT_URI
    );

    this.drive = google.drive({ version: "v3", auth: this.oauth2Client });
  }

  /**
   * Ensure the service is initialized with valid credentials
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to get tokens from database
      const tokens = await storage.getServiceToken("google_drive");
      
      if (tokens) {
        this.oauth2Client.setCredentials(tokens);
        this.initialized = true;
      }
    } catch (error) {
      console.error("Failed to initialize Google Drive service:", error);
      // Don't throw here, the auth status check will handle this
    }
  }

  /**
   * Get authentication status
   * @returns Authentication status object
   */
  async getAuthStatus(): Promise<{ isAuthenticated: boolean, authUrl?: string }> {
    await this.ensureInitialized();
    
    if (this.initialized) {
      return { isAuthenticated: true };
    } else {
      const authUrl = this.getAuthUrl();
      return { isAuthenticated: false, authUrl };
    }
  }

  /**
   * Generate an authentication URL for OAuth flow
   * @returns Authentication URL
   */
  async getAuthUrl(): Promise<string> {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.SCOPES,
      prompt: "consent", // Force refresh token
    });
  }

  /**
   * Handle OAuth callback and store tokens
   * @param code Authorization code from OAuth callback
   * @returns Success status
   */
  async handleCallback(code: string): Promise<{ success: boolean }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      this.initialized = true;
      
      // Store tokens in database
      await storage.saveServiceToken("google_drive", tokens);
      
      // Create service connection record
      const connections = await storage.getServiceConnections();
      const existingConnection = connections.find(c => c.type === "google_drive");
      
      if (existingConnection) {
        await storage.updateServiceConnection(existingConnection.id, {
          status: "connected",
        });
      } else {
        await storage.createServiceConnection({
          type: "google_drive",
          name: "Google Drive",
          status: "connected",
        });
      }
      
      // Record activity
      await storage.createActivity({
        type: "integration",
        description: "Connected to Google Drive",
      });
      
      return { success: true };
    } catch (error) {
      console.error("Failed to handle OAuth callback:", error);
      throw new Error(`Failed to authenticate with Google Drive: ${(error as Error).message}`);
    }
  }

  /**
   * Upload a file to Google Drive
   * @param filePath Local path to the file
   * @param fileName Name for the file in Drive
   * @param mimeType MIME type of the file (optional)
   * @param folderId Parent folder ID (optional)
   * @returns File metadata
   */
  async uploadFile(filePath: string, fileName: string, mimeType?: string, folderId?: string): Promise<any> {
    await this.ensureInitialized();
    
    if (!this.initialized) {
      throw new Error("Google Drive service not authenticated");
    }
    
    try {
      const fileStats = await fs.stat(filePath);
      
      if (!fileStats.isFile()) {
        throw new Error(`Not a file: ${filePath}`);
      }
      
      const fileMetadata: any = {
        name: fileName,
      };
      
      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      // Determine MIME type if not provided
      if (!mimeType) {
        const extension = path.extname(filePath).toLowerCase();
        switch (extension) {
          case '.pdf':
            mimeType = 'application/pdf';
            break;
          case '.jpg':
          case '.jpeg':
            mimeType = 'image/jpeg';
            break;
          case '.png':
            mimeType = 'image/png';
            break;
          case '.doc':
            mimeType = 'application/msword';
            break;
          case '.docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          default:
            mimeType = 'application/octet-stream';
        }
      }

      const fileContent = await fs.readFile(filePath);
      
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: mimeType,
          body: fileContent,
        },
        fields: 'id,name,mimeType,webViewLink,iconLink',
      });
      
      return response.data;
    } catch (error) {
      console.error("Failed to upload file to Google Drive:", error);
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  /**
   * List files in a folder
   * @param folderId Folder ID (optional, defaults to root)
   * @param pageSize Number of files to return
   * @param pageToken Page token for pagination
   * @returns List of files
   */
  async listFiles(folderId?: string, pageSize: number = 20, pageToken?: string): Promise<any> {
    await this.ensureInitialized();
    
    if (!this.initialized) {
      throw new Error("Google Drive service not authenticated");
    }
    
    try {
      let query = "trashed = false";
      
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }
      
      const response = await this.drive.files.list({
        q: query,
        pageSize: pageSize,
        pageToken: pageToken,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink, iconLink, thumbnailLink, createdTime, modifiedTime, size, parents)',
      });
      
      return {
        files: response.data.files,
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error("Failed to list Google Drive files:", error);
      throw new Error(`Failed to list files: ${(error as Error).message}`);
    }
  }

  /**
   * Download a file from Google Drive
   * @param fileId ID of the file to download
   * @param destinationPath Local path to save the file
   * @returns Path to the downloaded file
   */
  async downloadFile(fileId: string, destinationPath: string): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.initialized) {
      throw new Error("Google Drive service not authenticated");
    }
    
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
      }, { responseType: 'stream' });
      
      const writer = fs.createWriteStream(destinationPath);
      
      return new Promise((resolve, reject) => {
        response.data
          .on('end', () => {
            resolve(destinationPath);
          })
          .on('error', (err: Error) => {
            reject(err);
          })
          .pipe(writer);
      });
    } catch (error) {
      console.error("Failed to download file from Google Drive:", error);
      throw new Error(`Failed to download file: ${(error as Error).message}`);
    }
  }

  /**
   * Import a file from Google Drive into the application
   * @param fileId ID of the file to import
   * @returns Document ID in the application
   */
  async importFile(fileId: string): Promise<number> {
    await this.ensureInitialized();
    
    if (!this.initialized) {
      throw new Error("Google Drive service not authenticated");
    }
    
    try {
      // Get file metadata
      const fileMetadata = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size',
      });
      
      const file = fileMetadata.data;
      
      // Create upload directory if it doesn't exist
      const uploadDir = path.resolve(process.cwd(), "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Generate unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.name) || "";
      const filename = path.basename(file.name, extension) + "-" + uniqueSuffix + extension;
      const localPath = path.join(uploadDir, filename);
      
      // Download the file
      await this.downloadFile(fileId, localPath);
      
      // Create document record
      const document = await storage.createDocument({
        name: file.name,
        type: file.mimeType,
        size: parseInt(file.size) || 0,
        status: "pending",
        ocrProcessed: false,
        aiAnalyzed: false,
        url: `/uploads/${filename}`,
        driveId: fileId,
      });
      
      // Create activity record
      await storage.createActivity({
        type: "upload",
        description: "Document imported from Google Drive",
        documentId: document.id,
        documentName: document.name,
      });
      
      return document.id;
    } catch (error) {
      console.error("Failed to import file from Google Drive:", error);
      throw new Error(`Failed to import file: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a file from Google Drive
   * @param fileId ID of the file to delete
   * @returns Success status
   */
  async deleteFile(fileId: string): Promise<{ success: boolean }> {
    await this.ensureInitialized();
    
    if (!this.initialized) {
      throw new Error("Google Drive service not authenticated");
    }
    
    try {
      await this.drive.files.delete({
        fileId: fileId,
      });
      
      return { success: true };
    } catch (error) {
      console.error("Failed to delete file from Google Drive:", error);
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  }
}

export const gdriveService = new GoogleDriveService();
