import Tesseract from 'tesseract.js';
import { cleanText } from '../../utils/formatText';

/**
 * Ekstrak teks dari gambar menggunakan Tesseract OCR
 * @param file File gambar atau dokumen
 * @param language Kode bahasa (default: 'eng')
 * @returns Teks yang diekstrak dari gambar
 */
export async function extractTextFromImage(
  file: File | string,
  language: string = 'eng'
): Promise<string> {
  try {
    console.log(`Starting OCR processing for language: ${language}`);
    
    const { data } = await Tesseract.recognize(
      file,
      language,
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(2)}%`);
          }
        },
      }
    );
    
    console.log('OCR processing completed successfully');
    return cleanText(data.text);
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}

/**
 * Ekstrak teks dari PDF menggunakan kombinasi Tesseract dan PDF.js
 * @param file File PDF
 * @param language Kode bahasa (default: 'eng')
 * @returns Teks yang diekstrak dari PDF
 */
export async function extractTextFromPDF(
  file: File,
  language: string = 'eng'
): Promise<string> {
  // Catatan: Implementasi ini hanya placeholder
  // Untuk PDF yang sebenarnya, kita perlu menggunakan PDF.js
  // untuk mengekstrak gambar dari setiap halaman terlebih dahulu,
  // lalu memproses gambar-gambar tersebut dengan Tesseract
  return extractTextFromImage(file, language);
}

/**
 * Mendapatkan daftar bahasa yang didukung oleh Tesseract OCR
 * @returns Array objek bahasa dengan kode dan nama
 */
export async function getSupportedLanguages(): Promise<{ code: string; name: string }[]> {
  // Daftar bahasa yang umum digunakan
  return [
    { code: 'eng', name: 'English' },
    { code: 'ind', name: 'Indonesian' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'chi_sim', name: 'Chinese Simplified' },
    { code: 'chi_tra', name: 'Chinese Traditional' },
    { code: 'kor', name: 'Korean' },
    { code: 'ara', name: 'Arabic' },
    { code: 'rus', name: 'Russian' },
    { code: 'deu', name: 'German' },
    { code: 'fra', name: 'French' },
    { code: 'spa', name: 'Spanish' },
    { code: 'ita', name: 'Italian' },
    { code: 'por', name: 'Portuguese' },
  ];
}