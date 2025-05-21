import axios from 'axios';
import { storage } from "../storage";

interface TelegramNotificationParams {
  type: 'upload' | 'ocrComplete' | 'analysisComplete' | 'error';
  documentName?: string;
  message?: string;
}

interface NotificationSettings {
  enabled: boolean;
  onUpload: boolean;
  onOcrComplete: boolean;
  onAnalysisComplete: boolean;
  dailySummary: boolean;
}

class TelegramService {
  private apiToken: string | null = null;
  private chatId: string | null = null;
  private initialized: boolean = false;
  private baseUrl: string = 'https://api.telegram.org/bot';
  private connectionCode: string | null = null;

  constructor() {
    // Initialize with environment variables if available
    this.apiToken = process.env.TELEGRAM_BOT_TOKEN || null;
    this.chatId = process.env.TELEGRAM_CHAT_ID || null;
    this.initialized = !!(this.apiToken && this.chatId);
  }

  /**
   * Ensure the service is initialized with valid credentials
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to get token from database
      const token = await storage.getApiKey("telegram");
      const chatId = await storage.getApiKey("telegram_chat_id");
      
      if (token && chatId) {
        this.apiToken = token;
        this.chatId = chatId;
        this.initialized = true;
      }
    } catch (error) {
      // Don't throw here, the status check will handle this
    }
  }

  /**
   * Get connection status
   */
  async getStatus(): Promise<{ isConnected: boolean, username?: string, connectionCode?: string }> {
    await this.ensureInitialized();
    
    if (this.initialized) {
      try {
        // Get bot info
        const response = await axios.get(`${this.baseUrl}${this.apiToken}/getMe`);
        const botInfo = response.data.result;
        
        return { 
          isConnected: true,
          username: botInfo.username
        };
      } catch (error) {
        console.error("Failed to get Telegram bot info:", error);
        this.initialized = false;
        return { isConnected: false };
      }
    } else if (this.connectionCode) {
      return { 
        isConnected: false,
        connectionCode: this.connectionCode
      };
    } else {
      return { isConnected: false };
    }
  }

  /**
   * Generate connection code and start listening for messages
   */
  async connect(): Promise<{ connectionCode: string }> {
    if (!this.apiToken) {
      throw new Error("Telegram bot token not found");
    }
    
    // Generate random 6-digit code
    this.connectionCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Start a background polling process to check for messages with the code
    this.startPolling();
    
    return { connectionCode: this.connectionCode };
  }

  /**
   * Start polling for messages
   */
  private async startPolling() {
    if (!this.apiToken || !this.connectionCode) return;

    let offset = 0;
    const pollingInterval = 5000; // 5 seconds
    
    const pollFn = async () => {
      try {
        const response = await axios.get(`${this.baseUrl}${this.apiToken}/getUpdates`, {
          params: {
            offset,
            timeout: 30,
          },
        });
        
        const updates = response.data.result;
        
        if (updates.length > 0) {
          // Update offset to acknowledge received messages
          offset = updates[updates.length - 1].update_id + 1;
          
          // Check for connection code
          for (const update of updates) {
            if (update.message && update.message.text === this.connectionCode) {
              // Save chat ID
              this.chatId = update.message.chat.id.toString();
              this.initialized = true;
              
              // Store in database
              await storage.saveApiKey("telegram_chat_id", this.chatId);
              
              // Create service connection record
              const connections = await storage.getServiceConnections();
              const existingConnection = connections.find(c => c.type === "telegram");
              
              if (existingConnection) {
                await storage.updateServiceConnection(existingConnection.id, {
                  status: "connected",
                });
              } else {
                await storage.createServiceConnection({
                  type: "telegram",
                  name: "Telegram Bot",
                  status: "connected",
                });
              }
              
              // Send confirmation message
              await this.sendMessage("Connected successfully! You will now receive notifications from AMCP.");
              
              // Clear connection code
              this.connectionCode = null;
              
              // Record activity
              await storage.createActivity({
                type: "integration",
                description: "Connected to Telegram Bot",
              });
              
              // Stop polling
              return;
            }
          }
        }
        
        // Continue polling if not connected yet
        if (!this.initialized && this.connectionCode) {
          setTimeout(pollFn, pollingInterval);
        }
      } catch (error) {
        console.error("Telegram polling error:", error);
        
        // Continue polling with backoff
        setTimeout(pollFn, pollingInterval * 2);
      }
    };
    
    // Start polling
    pollFn();
  }

  /**
   * Disconnect the bot
   */
  async disconnect(): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.initialized) {
      throw new Error("Telegram bot not connected");
    }
    
    try {
      // Send disconnection message
      await this.sendMessage("AMCP is disconnecting from this chat. You will no longer receive notifications.");
      
      // Clear credentials
      this.chatId = null;
      this.initialized = false;
      
      // Update database
      await storage.saveApiKey("telegram_chat_id", "");
      
      // Update service connection record
      const connections = await storage.getServiceConnections();
      const existingConnection = connections.find(c => c.type === "telegram");
      
      if (existingConnection) {
        await storage.updateServiceConnection(existingConnection.id, {
          status: "disconnected",
        });
      }
      
      // Record activity
      await storage.createActivity({
        type: "integration",
        description: "Disconnected from Telegram Bot",
      });
    } catch (error) {
      console.error("Failed to disconnect Telegram bot:", error);
      throw new Error(`Failed to disconnect: ${(error as Error).message}`);
    }
  }

  /**
   * Send a message
   */
  async sendMessage(text: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.initialized) {
      throw new Error("Telegram bot not connected");
    }
    
    try {
      await axios.post(`${this.baseUrl}${this.apiToken}/sendMessage`, {
        chat_id: this.chatId,
        text: text,
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error("Failed to send Telegram message:", error);
      throw new Error(`Failed to send message: ${(error as Error).message}`);
    }
  }

  /**
   * Send a notification based on type
   */
  async sendNotification(params: TelegramNotificationParams): Promise<void> {
    // Check notification settings
    const settings = await this.getNotificationSettings();
    
    if (!settings.enabled) {
      return;
    }
    
    // Check specific notification type setting
    switch (params.type) {
      case 'upload':
        if (!settings.onUpload) return;
        break;
      case 'ocrComplete':
        if (!settings.onOcrComplete) return;
        break;
      case 'analysisComplete':
        if (!settings.onAnalysisComplete) return;
        break;
      default:
        // Always send error notifications
        break;
    }
    
    // Construct message
    let message = '';
    
    switch (params.type) {
      case 'upload':
        message = `📄 New document uploaded: "${params.documentName}"`;
        break;
      case 'ocrComplete':
        message = `🔍 OCR processing completed for "${params.documentName}"`;
        break;
      case 'analysisComplete':
        message = `🤖 AI analysis completed for "${params.documentName}"`;
        break;
      case 'error':
        message = `❌ Error: ${params.message || 'An error occurred'}`;
        break;
    }
    
    // Add timestamp
    message += `\n\n⏰ ${new Date().toLocaleString()}`;
    
    // Send message
    await this.sendMessage(message);
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      // Get settings from database or use default
      const settingsStr = await storage.getApiKey("telegram_notification_settings");
      
      if (settingsStr) {
        return JSON.parse(settingsStr);
      } else {
        // Default settings
        return {
          enabled: true,
          onUpload: true,
          onOcrComplete: true,
          onAnalysisComplete: true,
          dailySummary: false,
        };
      }
    } catch (error) {
      console.error("Failed to get notification settings:", error);
      
      // Return default settings on error
      return {
        enabled: true,
        onUpload: true,
        onOcrComplete: true,
        onAnalysisComplete: true,
        dailySummary: false,
      };
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    try {
      await storage.saveApiKey("telegram_notification_settings", JSON.stringify(settings));
      return settings;
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      throw new Error(`Failed to update settings: ${(error as Error).message}`);
    }
  }
}

export const telegramService = new TelegramService();
