import OpenAI from 'openai';
import { truncateText } from '../../utils/formatText';

// Inisialisasi klien OpenAI
const apiKey = process.env.OPENAI_API_KEY;

// Pastikan API key tersedia
if (!apiKey) {
  console.error('OpenAI API key is missing!');
}

// Buat klien OpenAI
const openai = new OpenAI({
  apiKey: apiKey || '',
  dangerouslyAllowBrowser: true, // Hanya gunakan di browser jika benar-benar diperlukan
});

/**
 * Membuat ringkasan dari teks dokumen menggunakan OpenAI GPT
 * @param text Teks dokumen yang akan diringkas
 * @param maxLength Panjang maksimum teks ringkasan (default: 500 karakter)
 * @returns Teks ringkasan
 */
export async function summarizeText(
  text: string, 
  maxLength: number = 500
): Promise<string> {
  try {
    // Potong teks input jika terlalu panjang untuk menghindari token yang berlebihan
    const maxInputLength = 5000;
    const truncatedText = text.length > maxInputLength 
      ? truncateText(text, maxInputLength) 
      : text;
    
    console.log('Generating summary using OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: 'Anda adalah asisten profesional yang ahli dalam meringkas dokumen. Buatlah ringkasan yang padat, informatif, dan mudah dipahami dari dokumen yang diberikan. Identifikasi poin-poin kunci dan informasi penting. Jangan menambahkan informasi atau opini yang tidak ada dalam dokumen asli.'
        },
        {
          role: 'user',
          content: `Ringkas dokumen berikut ini dalam bahasa Indonesia yang baik:\n\n${truncatedText}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Nilai rendah untuk mendapatkan output yang lebih deterministik
    });
    
    const summary = response.choices[0]?.message?.content?.trim() || '';
    return summary.length > maxLength ? truncateText(summary, maxLength) : summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}

/**
 * Mengklasifikasikan dokumen ke dalam kategori yang sesuai
 * @param text Teks dokumen yang akan diklasifikasikan
 * @returns Kategori dokumen
 */
export async function classifyDocument(text: string): Promise<string> {
  try {
    // Potong teks input jika terlalu panjang untuk menghindari token yang berlebihan
    const truncatedText = truncateText(text, 3000);
    
    console.log('Classifying document using OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: 'Klasifikasikan dokumen ini ke dalam SATU kategori saja dari kategori berikut: Keuangan, Hukum, Teknis, Medis, Akademik, Administratif, Pemasaran, SDM, atau Lainnya. Berikan hanya nama kategori tanpa penjelasan tambahan.'
        },
        {
          role: 'user',
          content: truncatedText
        }
      ],
      max_tokens: 50,
      temperature: 0.2,
    });
    
    return response.choices[0]?.message?.content?.trim() || 'Lainnya';
  } catch (error) {
    console.error('Error classifying document:', error);
    return 'Lainnya'; // Kategori default jika klasifikasi gagal
  }
}

/**
 * Mengekstrak informasi penting dari dokumen
 * @param text Teks dokumen
 * @param schema Skema data yang diinginkan (misal: {"tanggal": "", "nomor": "", "pihak": ""})
 * @returns Objek dengan informasi yang diekstrak
 */
export async function extractStructuredData(
  text: string, 
  schema: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const truncatedText = truncateText(text, 4000);
    
    console.log('Extracting structured data using OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: `Ekstrak informasi berikut dari dokumen dalam format JSON: ${JSON.stringify(schema)}. Jika informasi tidak ditemukan, isi dengan null.`
        },
        {
          role: 'user',
          content: truncatedText
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.2,
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    console.error('Error extracting structured data:', error);
    return { error: `Failed to extract data: ${error.message}` };
  }
}