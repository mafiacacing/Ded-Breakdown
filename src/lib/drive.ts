import { google } from 'googleapis';

// Konfigurasi Google Drive API
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/drive/callback';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Pastikan kredensial sudah tersedia
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Google Drive API credentials are missing!');
}

// Buat OAuth2 client
export const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Buat instance Drive API
export const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
});

// Fungsi untuk menghasilkan URL otorisasi
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

// Fungsi untuk mengatur token
export async function setTokens(code: string): Promise<void> {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return;
  } catch (error) {
    console.error('Error setting tokens:', error);
    throw error;
  }
}

// Fungsi untuk mengunggah file ke Google Drive
export async function uploadFile(filePath: string, fileName: string, mimeType?: string): Promise<any> {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType
      },
      media: {
        body: filePath
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error);
    throw error;
  }
}