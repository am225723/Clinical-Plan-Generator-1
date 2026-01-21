import * as pdfjsLib from 'pdfjs-dist';

// Configure worker - in a real app this might need to be pointed to a CDN or local worker file
// For this mockup, we'll try to rely on the main thread or a CDN worker if needed.
// However, in many bundlers, setting the workerSrc to a CDN is the most reliable way without complex config.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export interface ExtractedContent {
  source: string;
  text: string;
  type: 'pdf' | 'audio' | 'text';
}

export const extractTextFromPdf = async (file: File): Promise<{ text: string; isScanned: boolean }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    let totalChars = 0;
    let totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      totalChars += pageText.length;
    }

    // Heuristic for scanned PDF: very few characters per page on average
    const isScanned = (totalChars / totalPages) < 50; 

    return { text: fullText, isScanned };
  } catch (error) {
    console.error("PDF Extraction failed:", error);
    throw new Error("Failed to extract text from PDF");
  }
};
