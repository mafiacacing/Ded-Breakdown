import axios from 'axios';

// Konfigurasi Telegram Bot API
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Pastikan token bot tersedia
if (!TELEGRAM_BOT_TOKEN) {
  console.error('Telegram Bot Token is missing!');
}

// Interface untuk pengaturan notifikasi
export interface NotificationSettings {
  enabled: boolean;
  onUpload: boolean;
  onOcrComplete: boolean;
  onAnalysisComplete: boolean;
  dailySummary: boolean;
}

// Tipe notifikasi yang didukung
type NotificationType = 'upload' | 'ocrComplete' | 'analysisComplete' | 'error';

// Interface untuk parameter notifikasi
export interface NotificationParams {
  type: NotificationType;
  documentName?: string;
  message?: string;
}

// Fungsi untuk mengirim pesan ke Telegram
export async function sendMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram configuration is incomplete');
    return false;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'HTML'
    });

    return response.data.ok;
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
    return false;
  }
}

// Fungsi untuk mengirim notifikasi berdasarkan tipe
export async function sendNotification(params: NotificationParams): Promise<boolean> {
  const { type, documentName = 'Unnamed Document', message } = params;
  
  let notificationText = '';
  
  switch (type) {
    case 'upload':
      notificationText = `🆕 <b>Document Uploaded</b>\nDocument: ${documentName}\nStatus: Processing`;
      break;
    case 'ocrComplete':
      notificationText = `📝 <b>OCR Processing Complete</b>\nDocument: ${documentName}\nStatus: Ready for analysis`;
      break;
    case 'analysisComplete':
      notificationText = `✅ <b>Analysis Complete</b>\nDocument: ${documentName}\nStatus: Analysis available`;
      break;
    case 'error':
      notificationText = `❌ <b>Error Occurred</b>\nDocument: ${documentName}\nMessage: ${message || 'Unknown error'}`;
      break;
    default:
      notificationText = `ℹ️ <b>Notification</b>\n${message || 'No message provided'}`;
  }
  
  return sendMessage(notificationText);
}

// Fungsi untuk mendapatkan status koneksi bot
export async function getBotStatus(): Promise<{ isConnected: boolean, username?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { isConnected: false };
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/getMe`);
    
    if (response.data.ok) {
      return {
        isConnected: true,
        username: response.data.result.username
      };
    }
    
    return { isConnected: false };
  } catch (error) {
    console.error('Error checking Telegram bot status:', error);
    return { isConnected: false };
  }
}