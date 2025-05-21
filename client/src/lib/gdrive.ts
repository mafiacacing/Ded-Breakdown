import { apiRequest } from "./queryClient";

interface DriveAuthStatus {
  isAuthenticated: boolean;
  authUrl?: string;
}

/**
 * Check if the user is authenticated with Google Drive
 */
export async function checkDriveAuthStatus(): Promise<DriveAuthStatus> {
  const response = await apiRequest('GET', '/api/drive/status', undefined);
  return await response.json();
}

/**
 * Initiate the Google Drive authentication process
 */
export async function authenticateDrive(): Promise<{ authUrl: string }> {
  const response = await apiRequest('GET', '/api/drive/auth', undefined);
  return await response.json();
}

interface ListFilesParams {
  folderId?: string;
  pageSize?: number;
  pageToken?: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink: string;
  thumbnailLink?: string;
  webViewLink: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  parents?: string[];
}

interface ListFilesResult {
  files: DriveFile[];
  nextPageToken?: string;
}

/**
 * List files from Google Drive
 */
export async function listDriveFiles(params: ListFilesParams): Promise<ListFilesResult> {
  const queryParams = new URLSearchParams();
  if (params.folderId) queryParams.append('folderId', params.folderId);
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.pageToken) queryParams.append('pageToken', params.pageToken);
  
  const response = await apiRequest(
    'GET', 
    `/api/drive/files?${queryParams.toString()}`, 
    undefined
  );
  return await response.json();
}

interface UploadFileParams {
  file: File;
  folderId?: string;
  fileName?: string;
}

/**
 * Upload a file to Google Drive
 */
export async function uploadFileToDrive(params: UploadFileParams): Promise<DriveFile> {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.folderId) formData.append('folderId', params.folderId);
  if (params.fileName) formData.append('fileName', params.fileName);
  
  const response = await fetch('/api/drive/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Download a file from Google Drive
 */
export async function downloadFileFromDrive(fileId: string): Promise<Blob> {
  const response = await apiRequest('GET', `/api/drive/download/${fileId}`, undefined);
  return await response.blob();
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  await apiRequest('DELETE', `/api/drive/files/${fileId}`, undefined);
}

/**
 * Import a file from Google Drive to the application
 */
export async function importFileFromDrive(fileId: string): Promise<{ documentId: number }> {
  const response = await apiRequest('POST', '/api/drive/import', { fileId });
  return await response.json();
}
