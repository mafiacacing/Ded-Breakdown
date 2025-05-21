/**
 * Memformat ukuran file dari bytes ke format yang mudah dibaca manusia
 * @param bytes Ukuran file dalam bytes
 * @returns String dengan format ukuran file yang mudah dibaca (contoh: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  
  return `${bytes.toFixed(1)} ${units[i]}`;
}

/**
 * Validasi ukuran file sesuai batas maksimum
 * @param size Ukuran file dalam bytes
 * @param maxSize Ukuran maksimum dalam bytes (default 10MB)
 * @returns Boolean yang menunjukkan apakah file melebihi ukuran maksimum
 */
export function isValidFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return size <= maxSize;
}