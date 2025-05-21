/**
 * Membersihkan teks dari karakter berlebih dan white spaces
 * @param text Teks yang akan dibersihkan
 * @returns Teks yang sudah dibersihkan
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')     // Ubah semua whitespace berlebih menjadi satu spasi
    .replace(/[^\x20-\x7E]+/g, '') // Hapus karakter non-ASCII
    .trim();                  // Hapus whitespace di awal dan akhir
}

/**
 * Memotong teks menjadi panjang tertentu dengan elipsis
 * @param text Teks yang akan dipotong
 * @param maxLength Panjang maksimum (default: 100 karakter)
 * @returns Teks yang sudah dipotong dengan elipsis jika perlu
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Ekstrak kata kunci dari teks
 * @param text Teks sumber
 * @param count Jumlah kata kunci yang ingin diekstrak (default: 5)
 * @returns Array kata kunci
 */
export function extractKeywords(text: string, count: number = 5): string[] {
  // Hapus kata-kata umum (stopwords)
  const stopwords = ['dan', 'atau', 'yang', 'ini', 'itu', 'dengan', 'untuk', 'dalam', 'pada', 'ke', 'di', 'dari'];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopwords.includes(word));
  
  // Hitung frekuensi kata
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Urutkan berdasarkan frekuensi dan ambil kata kunci teratas
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(entry => entry[0]);
}