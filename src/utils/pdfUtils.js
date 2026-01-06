/**
 * Shared pdfMake instance with fonts properly initialized
 * Import this instead of importing pdfmake directly
 */
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize fonts once
let fontsInitialized = false;

const initializeFonts = () => {
  if (fontsInitialized) return;
  
  if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts && pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
  } else if (typeof window !== 'undefined' && window.pdfMake && window.pdfMake.vfs) {
    // Already set globally
  } else {
    try {
      pdfMake.vfs = pdfFonts;
    } catch (e) {
      console.warn("Could not assign pdfFonts", e);
    }
  }
  
  fontsInitialized = true;
};

// Initialize immediately
initializeFonts();

/**
 * Create a PDF document
 * @param {Object} docDefinition - pdfMake document definition
 * @returns {Object} pdfMake document generator
 */
export const createPdf = (docDefinition) => {
  initializeFonts(); // Ensure fonts are ready
  return pdfMake.createPdf(docDefinition);
};

/**
 * Generate PDF data URL with promise-based API and timeout
 * @param {Object} docDefinition - pdfMake document definition
 * @param {number} timeoutMs - Timeout in milliseconds (default 15000)
 * @returns {Promise<string>} Data URL of the generated PDF
 */
export const generatePdfDataUrl = (docDefinition, timeoutMs = 15000) => {
  return new Promise((resolve, reject) => {
    initializeFonts();
    
    if (!pdfMake.vfs) {
      reject(new Error('PDF fonts not loaded - vfs is missing'));
      return;
    }
    
    const timeoutId = setTimeout(() => {
      reject(new Error(`PDF generation timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);
    
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getDataUrl((dataUrl) => {
        clearTimeout(timeoutId);
        resolve(dataUrl);
      });
    } catch (err) {
      clearTimeout(timeoutId);
      reject(err);
    }
  });
};

/**
 * Download PDF directly
 * @param {Object} docDefinition - pdfMake document definition
 * @param {string} filename - Filename for download
 */
export const downloadPdf = (docDefinition, filename = 'document.pdf') => {
  initializeFonts();
  const pdfDoc = pdfMake.createPdf(docDefinition);
  pdfDoc.download(filename);
};

/**
 * Print PDF directly
 * @param {Object} docDefinition - pdfMake document definition
 */
export const printPdf = (docDefinition) => {
  initializeFonts();
  const pdfDoc = pdfMake.createPdf(docDefinition);
  pdfDoc.print();
};

export default {
  createPdf,
  generatePdfDataUrl,
  downloadPdf,
  printPdf,
  pdfMake, // Export original for advanced usage
};
