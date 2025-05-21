import OpenAI from 'openai';

// Inisialisasi klien OpenAI
const apiKey = process.env.OPENAI_API_KEY;

// Pastikan API key sudah tersedia
if (!apiKey) {
  console.error('OpenAI API key is missing!');
}

// Buat klien OpenAI
export const openai = new OpenAI({
  apiKey: apiKey || ''
});

// Fungsi helper untuk mendapatkan embedding dari teks
export async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    return null;
  }
}

// Fungsi helper untuk analisis dokumen dengan GPT-4o
export async function analyzeDocument(text: string, prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: 'system', content: 'You are a helpful assistant specialized in document analysis.' },
        { role: 'user', content: `${prompt}\n\nDocument content:\n${text}` }
      ],
      max_tokens: 4000
    });
    
    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error analyzing document:', error);
    return 'Error analyzing document. Please try again later.';
  }
}