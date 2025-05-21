import { apiRequest } from "./queryClient";

interface TelegramBotStatus {
  isConnected: boolean;
  username?: string;
  connectionCode?: string;
}

/**
 * Check the current status of the Telegram bot connection
 */
export async function checkTelegramStatus(): Promise<TelegramBotStatus> {
  const response = await apiRequest('GET', '/api/telegram/status', undefined);
  return await response.json();
}

/**
 * Connect the application to a Telegram bot
 */
export async function connectTelegramBot(): Promise<{ connectionCode: string }> {
  const response = await apiRequest('POST', '/api/telegram/connect', undefined);
  return await response.json();
}

/**
 * Disconnect the application from the Telegram bot
 */
export async function disconnectTelegramBot(): Promise<void> {
  await apiRequest('POST', '/api/telegram/disconnect', undefined);
}

interface SendMessageParams {
  message: string;
  documentId?: number;
}

/**
 * Send a notification message via the connected Telegram bot
 */
export async function sendTelegramMessage(params: SendMessageParams): Promise<void> {
  await apiRequest('POST', '/api/telegram/send', params);
}

interface NotificationSettings {
  enabled: boolean;
  onUpload: boolean;
  onOcrComplete: boolean;
  onAnalysisComplete: boolean;
  dailySummary: boolean;
}

/**
 * Get the current notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const response = await apiRequest('GET', '/api/telegram/settings', undefined);
  return await response.json();
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
  const response = await apiRequest('PUT', '/api/telegram/settings', settings);
  return await response.json();
}
