import fs from 'fs';
import path from 'path';
import type { jsPDF } from 'jspdf';

let cachedFontBase64: string | null = null;

export function loadTurkishFont(doc: jsPDF): boolean {
  try {
    if (!cachedFontBase64) {
      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Turkish-Font.ttf');
      if (fs.existsSync(fontPath)) {
        const buf = fs.readFileSync(fontPath);
        cachedFontBase64 = buf.toString('base64');
      }
    }

    if (cachedFontBase64) {
      doc.addFileToVFS('Turkish-Font.ttf', cachedFontBase64);
      doc.addFont('Turkish-Font.ttf', 'TurkishFont', 'normal');
      doc.setFont('TurkishFont');
      return true;
    }
  } catch (error) {
    console.error('Error loading Turkish font into jsPDF:', error);
  }
  return false;
}
